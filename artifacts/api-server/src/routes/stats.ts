import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable, salesTable, valuationCacheTable } from "@workspace/db";
import { eq, and, sql, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalItemsRow] = await db
    .select({ count: count() })
    .from(itemsTable)
    .where(eq(itemsTable.status, "approved"));

  const [totalSalesRow] = await db.select({ count: count() }).from(salesTable);
  const [verifiedSalesRow] = await db.select({ count: count() }).from(salesTable).where(eq(salesTable.verified, true));
  const [pendingRow] = await db.select({ count: count() }).from(salesTable).where(eq(salesTable.verified, false));

  // Category count
  const categoryRows = await db
    .selectDistinct({ category: itemsTable.category })
    .from(itemsTable)
    .where(eq(itemsTable.status, "approved"));

  // Tier breakdown
  const tierRows = await db
    .select({ tier: valuationCacheTable.tierUsed, cnt: count() })
    .from(valuationCacheTable)
    .groupBy(valuationCacheTable.tierUsed);

  const tierBreakdown: Record<string, number> = { A: 0, B: 0, C: 0 };
  for (const row of tierRows) {
    if (row.tier) tierBreakdown[row.tier] = Number(row.cnt);
  }

  // Recent activity (last 10 events)
  const recentItemsAdded = await db
    .select({
      itemName: itemsTable.name,
      itemSlug: itemsTable.slug,
      timestamp: itemsTable.createdAt,
    })
    .from(itemsTable)
    .where(eq(itemsTable.status, "approved"))
    .orderBy(desc(itemsTable.createdAt))
    .limit(5);

  const recentSalesVerified = await db
    .select({
      itemName: itemsTable.name,
      itemSlug: itemsTable.slug,
      timestamp: salesTable.createdAt,
    })
    .from(salesTable)
    .innerJoin(itemsTable, eq(salesTable.itemId, itemsTable.id))
    .where(eq(salesTable.verified, true))
    .orderBy(desc(salesTable.createdAt))
    .limit(5);

  const recentActivity = [
    ...recentItemsAdded.map((r) => ({
      type: "item_added" as const,
      itemName: r.itemName,
      itemSlug: r.itemSlug,
      timestamp: r.timestamp,
    })),
    ...recentSalesVerified.map((r) => ({
      type: "sale_verified" as const,
      itemName: r.itemName,
      itemSlug: r.itemSlug,
      timestamp: r.timestamp,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Portfolio totals (collection tracking)
  const [portfolioRow] = await db
    .select({
      totalSpent: sql<string>`SUM(CASE WHEN ${itemsTable.owned} = true AND ${itemsTable.purchasePrice} IS NOT NULL THEN ${itemsTable.purchasePrice}::numeric ELSE 0 END)`,
      ownedCount: sql<number>`COUNT(*) FILTER (WHERE ${itemsTable.owned} = true)`,
    })
    .from(itemsTable)
    .where(eq(itemsTable.status, "approved"));

  const valuedItems = await db
    .select({
      medianEstimate: valuationCacheTable.medianEstimate,
      purchasePrice: itemsTable.purchasePrice,
    })
    .from(itemsTable)
    .innerJoin(valuationCacheTable, eq(itemsTable.id, valuationCacheTable.itemId))
    .where(eq(itemsTable.status, "approved"));

  const portfolioTotalEstimated = valuedItems.reduce(
    (sum, r) => sum + (r.medianEstimate ? Number(r.medianEstimate) : 0),
    0,
  );
  const portfolioTotalSpent = Number(portfolioRow?.totalSpent ?? 0);

  res.json({
    totalItems: Number(totalItemsRow.count),
    totalSales: Number(totalSalesRow.count),
    totalCategories: categoryRows.length,
    verifiedSales: Number(verifiedSalesRow.count),
    pendingVerification: Number(pendingRow.count),
    tierBreakdown,
    recentActivity,
    portfolioTotalSpent,
    portfolioTotalEstimated,
    portfolioNetGainLoss: portfolioTotalEstimated - portfolioTotalSpent,
    portfolioOwnedCount: Number(portfolioRow?.ownedCount ?? 0),
  });
});

export default router;
