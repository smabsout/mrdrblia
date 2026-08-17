import { pgTable, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";
import { itemsTable } from "./items";

export const valuationCacheTable = pgTable("valuation_cache", {
  itemId: integer("item_id").primaryKey().references(() => itemsTable.id),
  lowEstimate: numeric("low_estimate", { precision: 10, scale: 2 }),
  medianEstimate: numeric("median_estimate", { precision: 10, scale: 2 }),
  highEstimate: numeric("high_estimate", { precision: 10, scale: 2 }),
  confidence: text("confidence"),
  tierUsed: text("tier_used"),
  sampleSize: integer("sample_size"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ValuationCache = typeof valuationCacheTable.$inferSelect;
