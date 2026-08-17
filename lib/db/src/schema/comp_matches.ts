import { pgTable, serial, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";

export const compMatchesTable = pgTable("comp_matches", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  compItemId: integer("comp_item_id").notNull().references(() => itemsTable.id),
  similarityScore: numeric("similarity_score", { precision: 4, scale: 3 }).notNull(),
  matchReason: text("match_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompMatchSchema = createInsertSchema(compMatchesTable).omit({ id: true, createdAt: true });
export type InsertCompMatch = z.infer<typeof insertCompMatchSchema>;
export type CompMatch = typeof compMatchesTable.$inferSelect;
