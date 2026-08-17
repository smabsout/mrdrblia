/**
 * Valuation Engine — comp-based price estimation
 *
 * Rules:
 * - Tier A: ≥2 verified direct sales for this exact item
 * - Tier B: <2 direct sales, but comp_matches with similarity_score ≥ 0.75
 * - Tier C: no data — returns category range only
 *
 * NEVER generate or modify sale_price, low_estimate, median_estimate, or
 * high_estimate via LLM. All values come exclusively from formulas below.
 */

import { db } from "@workspace/db";
import { salesTable, compMatchesTable, valuationCacheTable, itemsTable } from "@workspace/db";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { logger } from "./logger";

// ─── Constants ─────────────────────────────────────────────────────────────
/** Exponential decay half-life in days (6 months) */
export const HALF_LIFE_DAYS = 180;
/** Minimum similarity score to qualify as a Tier B comp */
export const MIN_COMP_SIMILARITY = 0.75;
/** Maximum number of comp items to consider for Tier B */
export const MAX_COMP_ITEMS = 10;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface SaleWithWeight {
  id: number;
  itemId: number;
  itemName?: string | null;
  itemSlug?: string | null;
  salePrice: number;
  saleDate: string;
  saleSource: string;
  sourceName?: string | null;
  conditionGrade?: string | null;
  authenticationStatus?: string | null;
  verified: boolean;
  notes?: string | null;
  createdAt: Date;
  weight: number;
}

export interface ValuationSegment {
  conditionGrade: string | null;
  authenticationStatus: string | null;
  sampleSize: number;
  lowEstimate: number | null;
  medianEstimate: number | null;
  highEstimate: number | null;
  confidence: "low" | "medium" | "high" | null;
  singleSaleNote: string | null;
  sales: SaleWithWeight[];
}

export interface ValuationResult {
  itemId: number;
  itemSlug: string;
  tierUsed: "A" | "B" | "C";
  segments: ValuationSegment[];
  categoryRangeNote: string | null;
  categoryLow: number | null;
  categoryHigh: number | null;
  computedAt: Date;
}

// ─── Weight calculation ──────────────────────────────────────────────────────
function computeWeight(saleDate: string): number {
  const now = Date.now();
  const sale = new Date(saleDate).getTime();
  const daysSince = (now - sale) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, daysSince / HALF_LIFE_DAYS);
}

// ─── Weighted statistics ─────────────────────────────────────────────────────
function weightedPercentile(prices: number[], weights: number[], p: number): number {
  if (prices.length === 0) return 0;
  if (prices.length === 1) return prices[0];

  // Sort by price
  const pairs = prices.map((price, i) => ({ price, weight: weights[i] }));
  pairs.sort((a, b) => a.price - b.price);

  const totalWeight = pairs.reduce((sum, x) => sum + x.weight, 0);
  const target = p * totalWeight;

  let cumulative = 0;
  for (const pair of pairs) {
    cumulative += pair.weight;
    if (cumulative >= target) {
      return pair.price;
    }
  }
  return pairs[pairs.length - 1].price;
}

function weightedMedian(prices: number[], weights: number[]): number {
  return weightedPercentile(prices, weights, 0.5);
}

// ─── Confidence label ────────────────────────────────────────────────────────
function confidenceLabel(sampleSize: number): "low" | "medium" | "high" | null {
  if (sampleSize >= 8) return "high";
  if (sampleSize >= 3) return "medium";
  if (sampleSize >= 1) return "low";
  return null;
}

// ─── Segment computation ─────────────────────────────────────────────────────
function computeSegments(sales: SaleWithWeight[]): ValuationSegment[] {
  // Group by condition + authentication
  const groups = new Map<string, SaleWithWeight[]>();

  for (const sale of sales) {
    const key = `${sale.conditionGrade ?? "unknown"}|${sale.authenticationStatus ?? "unknown"}`;
    const group = groups.get(key) ?? [];
    group.push(sale);
    groups.set(key, group);
  }

  const segments: ValuationSegment[] = [];

  for (const [key, groupSales] of groups.entries()) {
    const [conditionGrade, authenticationStatus] = key.split("|").map((v) => (v === "unknown" ? null : v));
    const prices = groupSales.map((s) => s.salePrice);
    const weights = groupSales.map((s) => s.weight);
    const sampleSize = groupSales.length;

    if (sampleSize === 1) {
      segments.push({
        conditionGrade,
        authenticationStatus,
        sampleSize: 1,
        lowEstimate: null,
        medianEstimate: prices[0],
        highEstimate: null,
        confidence: "low",
        singleSaleNote: "1 sale on record — not a statistical estimate",
        sales: groupSales,
      });
    } else {
      segments.push({
        conditionGrade,
        authenticationStatus,
        sampleSize,
        lowEstimate: weightedPercentile(prices, weights, 0.1),
        medianEstimate: weightedMedian(prices, weights),
        highEstimate: weightedPercentile(prices, weights, 0.9),
        confidence: confidenceLabel(sampleSize),
        singleSaleNote: null,
        sales: groupSales,
      });
    }
  }

  // Sort segments: authenticated/excellent first, then by sample size desc
  segments.sort((a, b) => {
    const authOrder = ["authenticated", null, "unauthenticated", "disputed"];
    const aAuthIdx = authOrder.indexOf(a.authenticationStatus);
    const bAuthIdx = authOrder.indexOf(b.authenticationStatus);
    if (aAuthIdx !== bAuthIdx) return aAuthIdx - bAuthIdx;
    return b.sampleSize - a.sampleSize;
  });

  return segments;
}

// ─── Category range fallback (Tier C) ────────────────────────────────────────
async function getCategoryRange(category: string): Promise<{ low: number | null; high: number | null; count: number }> {
  const result = await db
    .select({
      low: sql<number>`MIN(CAST(${salesTable.salePrice} AS numeric))`,
      high: sql<number>`MAX(CAST(${salesTable.salePrice} AS numeric))`,
      count: sql<number>`COUNT(*)`,
    })
    .from(salesTable)
    .innerJoin(itemsTable, eq(salesTable.itemId, itemsTable.id))
    .where(and(eq(itemsTable.category, category), eq(salesTable.verified, true)));

  const row = result[0];
  return {
    low: row?.low ?? null,
    high: row?.high ?? null,
    count: Number(row?.count ?? 0),
  };
}

// ─── Main valuation function ─────────────────────────────────────────────────
export async function computeValuation(itemId: number): Promise<ValuationResult> {
  // Fetch the item
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
  if (!item) throw new Error(`Item ${itemId} not found`);

  const now = new Date();

  // Fetch all verified direct sales for this item
  const directSalesRaw = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.itemId, itemId), eq(salesTable.verified, true)));

  const directSales: SaleWithWeight[] = directSalesRaw.map((s) => ({
    ...s,
    salePrice: Number(s.salePrice),
    createdAt: s.createdAt,
    weight: computeWeight(s.saleDate),
  }));

  // ── Tier classification ──────────────────────────────────────────────────
  let tier: "A" | "B" | "C";

  if (directSales.length >= 2) {
    tier = "A";
  } else {
    // Check for qualifying comps
    const comps = await db
      .select()
      .from(compMatchesTable)
      .where(
        and(
          eq(compMatchesTable.itemId, itemId),
          gte(compMatchesTable.similarityScore, String(MIN_COMP_SIMILARITY)),
        ),
      )
      .orderBy(sql`${compMatchesTable.similarityScore} DESC`)
      .limit(MAX_COMP_ITEMS);

    if (comps.length > 0) {
      tier = "B";
    } else {
      tier = "C";
    }
  }

  // ── Gather sales set ─────────────────────────────────────────────────────
  let salesToUse: SaleWithWeight[] = [];

  if (tier === "A") {
    salesToUse = directSales;
  } else if (tier === "B") {
    const comps = await db
      .select()
      .from(compMatchesTable)
      .where(
        and(
          eq(compMatchesTable.itemId, itemId),
          gte(compMatchesTable.similarityScore, String(MIN_COMP_SIMILARITY)),
        ),
      )
      .orderBy(sql`${compMatchesTable.similarityScore} DESC`)
      .limit(MAX_COMP_ITEMS);

    const compItemIds = comps.map((c) => c.compItemId);

    if (compItemIds.length > 0) {
      const compSalesRaw = await db
        .select({
          sale: salesTable,
          item: itemsTable,
        })
        .from(salesTable)
        .innerJoin(itemsTable, eq(salesTable.itemId, itemsTable.id))
        .where(and(inArray(salesTable.itemId, compItemIds), eq(salesTable.verified, true)));

      salesToUse = compSalesRaw.map(({ sale, item: compItem }) => ({
        ...sale,
        itemName: compItem.name,
        itemSlug: compItem.slug,
        salePrice: Number(sale.salePrice),
        createdAt: sale.createdAt,
        weight: computeWeight(sale.saleDate),
      }));
    }
  }

  // ── Tier C: category range only ──────────────────────────────────────────
  if (tier === "C") {
    const { low, high, count } = await getCategoryRange(item.category);
    const result: ValuationResult = {
      itemId,
      itemSlug: item.slug,
      tierUsed: "C",
      segments: [],
      categoryRangeNote: `No comparable sales data. Category range for "${item.category}": based on ${count} unrelated sale(s).`,
      categoryLow: low,
      categoryHigh: high,
      computedAt: now,
    };

    // Cache minimal Tier C data
    await db
      .insert(valuationCacheTable)
      .values({
        itemId,
        lowEstimate: low !== null ? String(low) : null,
        medianEstimate: null,
        highEstimate: high !== null ? String(high) : null,
        confidence: null,
        tierUsed: "C",
        sampleSize: 0,
        computedAt: now,
      })
      .onConflictDoUpdate({
        target: valuationCacheTable.itemId,
        set: {
          lowEstimate: low !== null ? String(low) : null,
          medianEstimate: null,
          highEstimate: high !== null ? String(high) : null,
          confidence: null,
          tierUsed: "C",
          sampleSize: 0,
          computedAt: now,
        },
      });

    return result;
  }

  // ── Compute segments (Tier A and B) ─────────────────────────────────────
  const segments = computeSegments(salesToUse);

  // Overall cache entry: use the largest segment's median/low/high
  const bestSegment = segments.reduce(
    (best, seg) => (!best || seg.sampleSize > best.sampleSize ? seg : best),
    null as ValuationSegment | null,
  );

  const overallSampleSize = salesToUse.length;
  await db
    .insert(valuationCacheTable)
    .values({
      itemId,
      lowEstimate: bestSegment?.lowEstimate !== null && bestSegment?.lowEstimate !== undefined ? String(bestSegment.lowEstimate) : null,
      medianEstimate: bestSegment?.medianEstimate !== null && bestSegment?.medianEstimate !== undefined ? String(bestSegment.medianEstimate) : null,
      highEstimate: bestSegment?.highEstimate !== null && bestSegment?.highEstimate !== undefined ? String(bestSegment.highEstimate) : null,
      confidence: bestSegment?.confidence ?? null,
      tierUsed: tier,
      sampleSize: overallSampleSize,
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: valuationCacheTable.itemId,
      set: {
        lowEstimate: bestSegment?.lowEstimate !== null && bestSegment?.lowEstimate !== undefined ? String(bestSegment.lowEstimate) : null,
        medianEstimate: bestSegment?.medianEstimate !== null && bestSegment?.medianEstimate !== undefined ? String(bestSegment.medianEstimate) : null,
        highEstimate: bestSegment?.highEstimate !== null && bestSegment?.highEstimate !== undefined ? String(bestSegment.highEstimate) : null,
        confidence: bestSegment?.confidence ?? null,
        tierUsed: tier,
        sampleSize: overallSampleSize,
        computedAt: now,
      },
    });

  logger.info({ itemId, tier, segments: segments.length, totalSales: overallSampleSize }, "Valuation computed");

  return {
    itemId,
    itemSlug: item.slug,
    tierUsed: tier,
    segments,
    categoryRangeNote: null,
    categoryLow: null,
    categoryHigh: null,
    computedAt: now,
  };
}
