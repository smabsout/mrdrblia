import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { watchlistTable, itemsTable, valuationCacheTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/watchlist", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const rows = await db
    .select({
      item: itemsTable,
      watchCount: sql<number>`(SELECT COUNT(*) FROM watchlist WHERE item_id = ${itemsTable.id})`,
      medianEstimate: valuationCacheTable.medianEstimate,
      confidence: valuationCacheTable.confidence,
    })
    .from(watchlistTable)
    .innerJoin(itemsTable, eq(watchlistTable.itemId, itemsTable.id))
    .leftJoin(valuationCacheTable, eq(itemsTable.id, valuationCacheTable.itemId))
    .where(eq(watchlistTable.userId, userId))
    .orderBy(watchlistTable.createdAt);

  res.json(
    rows.map(({ item, watchCount, medianEstimate, confidence }) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      year: item.year,
      authenticator: item.authenticator,
      notorietyTier: item.notorietyTier,
      imageUrls: item.imageUrls,
      status: item.status,
      watchCount: Number(watchCount ?? 0),
      medianEstimate: medianEstimate ? Number(medianEstimate) : null,
      confidence,
      createdAt: item.createdAt,
    })),
  );
});

router.post("/watchlist", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: "itemId is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.itemId, Number(itemId))));

  if (existing) {
    res.status(201).json(existing);
    return;
  }

  const [entry] = await db
    .insert(watchlistTable)
    .values({ userId, itemId: Number(itemId) })
    .returning();

  res.status(201).json(entry);
});

router.delete("/watchlist/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(raw, 10);

  await db
    .delete(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.itemId, itemId)));

  res.sendStatus(204);
});

export default router;
