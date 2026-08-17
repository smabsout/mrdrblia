/**
 * Nightly valuation recompute cron job.
 * Recomputes Tier B items whose comps may have changed.
 * Runs at 2 AM daily.
 */

import cron from "node-cron";
import { db } from "@workspace/db";
import { valuationCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { computeValuation } from "./valuation.js";
import { logger } from "./logger.js";

export function startCronJobs(): void {
  // Nightly at 02:00 — recompute all Tier B items
  cron.schedule("0 2 * * *", async () => {
    logger.info("Nightly valuation recompute: starting");
    try {
      const tierBItems = await db
        .select({ itemId: valuationCacheTable.itemId })
        .from(valuationCacheTable)
        .where(eq(valuationCacheTable.tierUsed, "B"));

      for (const { itemId } of tierBItems) {
        try {
          await computeValuation(itemId);
        } catch (err) {
          logger.error({ err, itemId }, "Recompute failed for item");
        }
      }

      logger.info({ count: tierBItems.length }, "Nightly valuation recompute: done");
    } catch (err) {
      logger.error({ err }, "Nightly valuation recompute: fatal error");
    }
  });

  logger.info("Cron jobs started");
}
