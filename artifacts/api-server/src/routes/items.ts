import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable, salesTable, watchlistTable, valuationCacheTable } from "@workspace/db";
import { eq, sql, and, desc, count } from "drizzle-orm";
import slugify from "../lib/slugify.js";

const router: IRouter = Router();

router.get("/items", async (req, res): Promise<void> => {
  const { q, category, sort = "recent" } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "24", 10)));
  const offset = (page - 1) * limit;

  const userId = req.session?.userId ?? null;

  const conditions = [eq(itemsTable.status, "approved")];
  if (category) conditions.push(eq(itemsTable.category, category));
  if (q) {
    // Full-text search using Postgres tsvector. Falls back to trigram-style
    // if the search term has no tsquery operators. We use websearch_to_tsquery
    // which handles plain text safely (no syntax errors on partial words).
    conditions.push(
      sql`to_tsvector('english', coalesce(${itemsTable.name}, '') || ' ' || coalesce(${itemsTable.description}, '') || ' ' || coalesce(${itemsTable.category}, '') || ' ' || coalesce(${itemsTable.subcategory}, '')) @@ websearch_to_tsquery('english', ${q})`,
    );
  }

  const where = and(...conditions);

  const orderBy = sort === "watched"
    ? [desc(sql`watch_count`), desc(itemsTable.createdAt)]
    : [desc(itemsTable.createdAt)];

  const rows = await db
    .select({
      item: itemsTable,
      watchCount: sql<number>`(SELECT COUNT(*) FROM watchlist WHERE item_id = ${itemsTable.id})`.as("watch_count"),
      medianEstimate: valuationCacheTable.medianEstimate,
      confidence: valuationCacheTable.confidence,
    })
    .from(itemsTable)
    .leftJoin(valuationCacheTable, eq(itemsTable.id, valuationCacheTable.itemId))
    .where(where)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(itemsTable)
    .where(where);

  const items = rows.map(({ item, watchCount, medianEstimate, confidence }) => {
    const pp = item.purchasePrice ? Number(item.purchasePrice) : null;
    const me = medianEstimate ? Number(medianEstimate) : null;
    const gainLoss = me !== null && pp !== null ? me - pp : null;
    const gainLossPct = gainLoss !== null && pp !== null && pp > 0 ? (gainLoss / pp) * 100 : null;
    return {
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
      medianEstimate: me,
      confidence,
      purchasePrice: pp,
      purchaseDate: item.purchaseDate,
      purchaseSource: item.purchaseSource,
      owned: item.owned,
      unrealizedGainLoss: gainLoss,
      unrealizedGainLossPct: gainLossPct,
      createdAt: item.createdAt,
    };
  });

  res.json({ items, total, page, limit });
});

router.get("/items/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params as { slug: string };
  const userId = req.session?.userId ?? null;

  const [row] = await db
    .select({
      item: itemsTable,
      watchCount: sql<number>`(SELECT COUNT(*) FROM watchlist WHERE item_id = ${itemsTable.id})`,
    })
    .from(itemsTable)
    .where(and(eq(itemsTable.slug, slug), eq(itemsTable.status, "approved")));

  if (!row) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  let isWatched = false;
  if (userId) {
    const [watch] = await db
      .select()
      .from(watchlistTable)
      .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.itemId, row.item.id)));
    isWatched = !!watch;
  }

  res.json({
    ...row.item,
    purchasePrice: row.item.purchasePrice ? Number(row.item.purchasePrice) : null,
    watchCount: Number(row.watchCount ?? 0),
    isWatched,
  });
});

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: itemsTable.category,
      subcategory: itemsTable.subcategory,
      count: count(),
    })
    .from(itemsTable)
    .where(eq(itemsTable.status, "approved"))
    .groupBy(itemsTable.category, itemsTable.subcategory)
    .orderBy(itemsTable.category);

  const categoryMap = new Map<string, { itemCount: number; subcategories: Set<string> }>();
  for (const row of rows) {
    const existing = categoryMap.get(row.category) ?? { itemCount: 0, subcategories: new Set<string>() };
    existing.itemCount += Number(row.count);
    if (row.subcategory) existing.subcategories.add(row.subcategory);
    categoryMap.set(row.category, existing);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    itemCount: data.itemCount,
    subcategories: Array.from(data.subcategories),
  }));

  res.json(categories);
});

export { slugify };
export default router;
