import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable, valuationCacheTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import slugify from "../lib/slugify.js";

const router: IRouter = Router();

router.post("/collection", requireAuth, async (req, res): Promise<void> => {
  const {
    name, category, subcategory, description, provenanceNotes,
    year, sourceEvent, authenticator, notorietyTier, imageUrls,
    purchasePrice, purchaseDate, purchaseSource, owned,
  } = req.body;

  if (!name || !category) {
    res.status(400).json({ error: "name and category are required" });
    return;
  }

  const userId = req.userId!;

  let slug: string = req.body.slug ?? slugify(name);
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
      notorietyTier: notorietyTier ?? null,
      imageUrls: imageUrls ?? [],
      purchasePrice: purchasePrice ? String(purchasePrice) : null,
      purchaseDate: purchaseDate ?? null,
      purchaseSource: purchaseSource ?? null,
      owned: owned !== undefined ? Boolean(owned) : true,
      createdBy: userId,
      status: "pending",
    })
    .returning();

  res.status(201).json({ ...item, watchCount: 0, isWatched: false });
});

router.patch("/collection/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const userId = req.userId!;

  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  if (existing.createdBy !== userId && req.userRole !== "admin") {
    res.status(403).json({ error: "You can only edit items you created" });
    return;
  }

  const {
    name, category, subcategory, description, provenanceNotes,
    year, sourceEvent, authenticator, notorietyTier, imageUrls,
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
      ...(notorietyTier !== undefined && { notorietyTier: notorietyTier ?? null }),
      ...(imageUrls !== undefined && { imageUrls: imageUrls ?? [] }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? String(purchasePrice) : null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ?? null }),
      ...(purchaseSource !== undefined && { purchaseSource: purchaseSource ?? null }),
      ...(owned !== undefined && { owned: Boolean(owned) }),
    })
    .where(eq(itemsTable.id, id))
    .returning();

  res.json({ ...item, watchCount: 0, isWatched: false });
});

router.get("/collection/export", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const rows = await db
    .select({
      item: itemsTable,
      medianEstimate: valuationCacheTable.medianEstimate,
      confidence: valuationCacheTable.confidence,
    })
    .from(itemsTable)
    .leftJoin(valuationCacheTable, eq(itemsTable.id, valuationCacheTable.itemId))
    .where(eq(itemsTable.createdBy, userId))
    .orderBy(desc(itemsTable.createdAt));

  const headers = [
    "Name", "Category", "Subcategory", "Year", "Source Event",
    "Authenticator", "Notoriety Tier", "Description", "Provenance Notes",
    "Purchase Price", "Purchase Date", "Purchase Source", "Owned",
    "Est. Value", "Confidence", "Status", "Added",
  ];

  const csvRows = rows.map(({ item, medianEstimate, confidence }) => {
    const escape = (v: string | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    return [
      escape(item.name),
      escape(item.category),
      escape(item.subcategory),
      item.year ?? "",
      escape(item.sourceEvent),
      escape(item.authenticator),
      escape(item.notorietyTier),
      escape(item.description),
      escape(item.provenanceNotes),
      item.purchasePrice ? Number(item.purchasePrice) : "",
      item.purchaseDate ?? "",
      escape(item.purchaseSource),
      item.owned ? "Yes" : "No",
      medianEstimate ? Number(medianEstimate) : "",
      confidence ?? "",
      item.status,
      item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "",
    ].join(",");
  });

  const csv = [headers.join(","), ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="collection-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
});

export default router;
