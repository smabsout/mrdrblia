import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable, salesTable, valuationCacheTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import { computeValuation } from "../lib/valuation.js";
import slugify from "../lib/slugify.js";

const router: IRouter = Router();

// ─── Admin: Items ─────────────────────────────────────────────────────────────

router.post("/admin/items", requireAdmin, async (req, res): Promise<void> => {
  const {
    name, category, subcategory, description, provenanceNotes,
    year, sourceEvent, authenticator, imageUrls,
    purchasePrice, purchaseDate, purchaseSource, owned,
  } = req.body;

  if (!name || !category) {
    res.status(400).json({ error: "name and category are required" });
    return;
  }

  const userId = req.userId!;

  // Auto-generate slug if not provided
  let slug: string = req.body.slug ?? slugify(name);
  // Ensure uniqueness
  const existing = await db.select({ id: itemsTable.id }).from(itemsTable).where(eq(itemsTable.slug, slug));
  if (existing.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  const [item] = await db
    .insert(itemsTable)
    .values({
      slug,
      name,
      category,
      subcategory: subcategory ?? null,
      description: description ?? null,
      provenanceNotes: provenanceNotes ?? null,
      year: year ? Number(year) : null,
      sourceEvent: sourceEvent ?? null,
      authenticator: authenticator ?? null,
      imageUrls: imageUrls ?? [],
      purchasePrice: purchasePrice ? String(purchasePrice) : null,
      purchaseDate: purchaseDate ?? null,
      purchaseSource: purchaseSource ?? null,
      owned: owned !== undefined ? Boolean(owned) : true,
      createdBy: userId,
      status: "pending",
    })
    .returning();

  const fullItem = {
    ...item,
    watchCount: 0,
    isWatched: false,
  };

  res.status(201).json(fullItem);
});

router.get("/admin/items/pending", requireAdmin, async (_req, res): Promise<void> => {
  const items = await db
    .select({
      item: itemsTable,
      watchCount: sql<number>`(SELECT COUNT(*) FROM watchlist WHERE item_id = ${itemsTable.id})`,
    })
    .from(itemsTable)
    .where(eq(itemsTable.status, "pending"))
    .orderBy(itemsTable.createdAt);

  res.json(
    items.map(({ item, watchCount }) => ({
      ...item,
      watchCount: Number(watchCount ?? 0),
      isWatched: false,
    })),
  );
});

router.patch("/admin/items/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const {
    name, category, subcategory, description, provenanceNotes,
    year, sourceEvent, authenticator, imageUrls,
    purchasePrice, purchaseDate, purchaseSource, owned,
  } = req.body;

  const [item] = await db
    .update(itemsTable)
    .set({
      ...(name && { name }),
      ...(category && { category }),
      ...(subcategory !== undefined && { subcategory: subcategory ?? null }),
      ...(description !== undefined && { description: description ?? null }),
      ...(provenanceNotes !== undefined && { provenanceNotes: provenanceNotes ?? null }),
      ...(year !== undefined && { year: year ? Number(year) : null }),
      ...(sourceEvent !== undefined && { sourceEvent: sourceEvent ?? null }),
      ...(authenticator !== undefined && { authenticator: authenticator ?? null }),
      ...(imageUrls !== undefined && { imageUrls: imageUrls ?? [] }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? String(purchasePrice) : null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ?? null }),
      ...(purchaseSource !== undefined && { purchaseSource: purchaseSource ?? null }),
      ...(owned !== undefined && { owned: Boolean(owned) }),
    })
    .where(eq(itemsTable.id, id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json({ ...item, watchCount: 0, isWatched: false });
});

router.patch("/admin/items/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    return;
  }

  const [item] = await db
    .update(itemsTable)
    .set({ status })
    .where(eq(itemsTable.id, id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json({ ...item, watchCount: 0, isWatched: false });
});

// ─── Admin: Sales ─────────────────────────────────────────────────────────────

router.post("/admin/items/:itemId/sales", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(rawId, 10);

  const {
    salePrice, saleDate, saleSource, sourceName,
    conditionGrade, authenticationStatus, verified = false, notes,
  } = req.body;

  if (!salePrice || !saleDate || !saleSource) {
    res.status(400).json({ error: "salePrice, saleDate, and saleSource are required" });
    return;
  }

  const [item] = await db.select({ id: itemsTable.id, name: itemsTable.name, slug: itemsTable.slug })
    .from(itemsTable).where(eq(itemsTable.id, itemId));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const [sale] = await db
    .insert(salesTable)
    .values({
      itemId,
      salePrice: String(salePrice),
      saleDate,
      saleSource,
      sourceName: sourceName ?? null,
      conditionGrade: conditionGrade ?? null,
      authenticationStatus: authenticationStatus ?? null,
      verified: Boolean(verified),
      notes: notes ?? null,
      enteredBy: req.userId!,
    })
    .returning();

  // Recompute valuation (fire and forget, log errors)
  computeValuation(itemId).catch((err) => {
    req.log.error({ err, itemId }, "Valuation recompute failed after sale insert");
  });

  res.status(201).json({
    ...sale,
    itemName: item.name,
    itemSlug: item.slug,
    salePrice: Number(sale.salePrice),
  });
});

router.get("/admin/sales/pending", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      sale: salesTable,
      item: itemsTable,
    })
    .from(salesTable)
    .innerJoin(itemsTable, eq(salesTable.itemId, itemsTable.id))
    .where(eq(salesTable.verified, false))
    .orderBy(salesTable.createdAt);

  res.json(
    rows.map(({ sale, item }) => ({
      ...sale,
      itemName: item.name,
      itemSlug: item.slug,
      salePrice: Number(sale.salePrice),
    })),
  );
});

router.patch("/admin/sales/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const {
    salePrice, saleDate, saleSource, sourceName,
    conditionGrade, authenticationStatus, notes,
  } = req.body;

  const [sale] = await db
    .update(salesTable)
    .set({
      ...(salePrice !== undefined && { salePrice: String(salePrice) }),
      ...(saleDate !== undefined && { saleDate }),
      ...(saleSource !== undefined && { saleSource }),
      ...(sourceName !== undefined && { sourceName: sourceName ?? null }),
      ...(conditionGrade !== undefined && { conditionGrade: conditionGrade ?? null }),
      ...(authenticationStatus !== undefined && { authenticationStatus: authenticationStatus ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
    })
    .where(eq(salesTable.id, id))
    .returning();

  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  const [item] = await db.select({ name: itemsTable.name, slug: itemsTable.slug })
    .from(itemsTable).where(eq(itemsTable.id, sale.itemId));

  res.json({
    ...sale,
    itemName: item?.name ?? null,
    itemSlug: item?.slug ?? null,
    salePrice: Number(sale.salePrice),
  });
});

router.patch("/admin/sales/:id/verify", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [sale] = await db
    .update(salesTable)
    .set({ verified: true })
    .where(eq(salesTable.id, id))
    .returning();

  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  // Recompute valuation after verification
  computeValuation(sale.itemId).catch((err) => {
    req.log.error({ err, itemId: sale.itemId }, "Valuation recompute failed after verify");
  });

  const [item] = await db.select({ name: itemsTable.name, slug: itemsTable.slug })
    .from(itemsTable).where(eq(itemsTable.id, sale.itemId));

  res.json({
    ...sale,
    itemName: item?.name ?? null,
    itemSlug: item?.slug ?? null,
    salePrice: Number(sale.salePrice),
  });
});

export default router;
