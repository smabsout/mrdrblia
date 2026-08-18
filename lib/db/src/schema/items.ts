import { pgTable, text, serial, timestamp, integer, numeric, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  provenanceNotes: text("provenance_notes"),
  year: integer("year"),
  sourceEvent: text("source_event"),
  authenticator: text("authenticator"),
  imageUrls: text("image_urls").array().notNull().default([]),
  notorietyTier: text("notoriety_tier"),
  // Collection ownership fields
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  purchaseDate: date("purchase_date"),
  purchaseSource: text("purchase_source"),
  owned: boolean("owned").notNull().default(true),
  createdBy: integer("created_by").references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
