import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable, salesTable, compMatchesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { computeValuation } from "../lib/valuation.js";

const router: IRouter = Router();

router.get("/items/:slug/valuation", async (req, res): Promise<void> => {
  const { slug } = req.params as { slug: string };

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.slug, slug));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const result = await computeValuation(item.id);

  // Serialize to API shape
  const response = {
    itemId: result.itemId,
    itemSlug: result.itemSlug,
    tierUsed: result.tierUsed,
    segments: result.segments.map((seg) => ({
      conditionGrade: seg.conditionGrade,
      authenticationStatus: seg.authenticationStatus,
      sampleSize: seg.sampleSize,
      lowEstimate: seg.lowEstimate,
      medianEstimate: seg.medianEstimate,
      highEstimate: seg.highEstimate,
      confidence: seg.confidence,
      singleSaleNote: seg.singleSaleNote,
      sales: seg.sales.map((s) => ({
        id: s.id,
        itemId: s.itemId,
        itemName: s.itemName ?? null,
        itemSlug: s.itemSlug ?? null,
        salePrice: s.salePrice,
        saleDate: s.saleDate,
        saleSource: s.saleSource,
        sourceName: s.sourceName ?? null,
        conditionGrade: s.conditionGrade ?? null,
        authenticationStatus: s.authenticationStatus ?? null,
        verified: s.verified,
        notes: s.notes ?? null,
        createdAt: s.createdAt,
      })),
    })),
    categoryRangeNote: result.categoryRangeNote,
    categoryLow: result.categoryLow,
    categoryHigh: result.categoryHigh,
    computedAt: result.computedAt,
  };

  res.json(response);
});

router.get("/items/:slug/sales", async (req, res): Promise<void> => {
  const { slug } = req.params as { slug: string };

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.slug, slug));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const sales = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.itemId, item.id))
    .orderBy(salesTable.saleDate);

  res.json(
    sales.map((s) => ({
      id: s.id,
      itemId: s.itemId,
      itemName: item.name,
      itemSlug: item.slug,
      salePrice: Number(s.salePrice),
      saleDate: s.saleDate,
      saleSource: s.saleSource,
      sourceName: s.sourceName,
      conditionGrade: s.conditionGrade,
      authenticationStatus: s.authenticationStatus,
      verified: s.verified,
      notes: s.notes,
      createdAt: s.createdAt,
    })),
  );
});

router.get("/items/:slug/comps", async (req, res): Promise<void> => {
  const { slug } = req.params as { slug: string };

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.slug, slug));
  if (!item) {
    res.json([]);
    return;
  }

  const comps = await db
    .select({
      comp: compMatchesTable,
      compItem: itemsTable,
    })
    .from(compMatchesTable)
    .innerJoin(itemsTable, eq(compMatchesTable.compItemId, itemsTable.id))
    .where(eq(compMatchesTable.itemId, item.id))
    .orderBy(compMatchesTable.similarityScore);

  res.json(
    comps.map(({ comp, compItem }) => ({
      id: comp.id,
      compItemId: comp.compItemId,
      compItemName: compItem.name,
      compItemSlug: compItem.slug,
      similarityScore: Number(comp.similarityScore),
      matchReason: comp.matchReason,
    })),
  );
});

export default router;
