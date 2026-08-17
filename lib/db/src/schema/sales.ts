import { pgTable, text, serial, timestamp, integer, boolean, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";
import { usersTable } from "./users";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  saleDate: date("sale_date", { mode: "string" }).notNull(),
  saleSource: text("sale_source").notNull(),
  sourceName: text("source_name"),
  conditionGrade: text("condition_grade"),
  authenticationStatus: text("authentication_status"),
  verified: boolean("verified").notNull().default(false),
  notes: text("notes"),
  enteredBy: integer("entered_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
