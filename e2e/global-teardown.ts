/**
 * Playwright global teardown — runs once after all tests.
 * Deletes all three Clerk test users and their local DB rows (FK-safe order).
 */

import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClerkClient } from "@clerk/backend";
import pg from "pg";
import type { TestUsers } from "./global-setup.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = `${__dirname}/.test-users.json`;

export default async function globalTeardown() {
  if (!existsSync(STATE_FILE)) {
    console.log("[e2e teardown] No state file — nothing to clean up.");
    return;
  }

  const users: TestUsers = JSON.parse(readFileSync(STATE_FILE, "utf8"));
  const allClerkIds = [users.jit.userId, users.regular.userId, users.admin.userId];

  // Clean up Clerk users
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    const clerk = createClerkClient({ secretKey });
    for (const [label, user] of Object.entries(users)) {
      try {
        await clerk.users.deleteUser(user.userId);
        console.log(`[e2e teardown] Deleted Clerk ${label}: ${user.userId}`);
      } catch (err) {
        console.warn(`[e2e teardown] Could not delete ${label} ${user.userId}:`, err);
      }
    }
  }

  // Clean up local DB rows — follow FK dependency order to avoid constraint errors
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const pool = new pg.Pool({ connectionString: dbUrl });
    try {
      // 1. conversations owned by test users (messages cascade-delete via FK)
      await pool.query(
        `DELETE FROM conversations WHERE clerk_user_id = ANY($1::text[])`,
        [allClerkIds],
      );

      // 2. valuation_cache → items (FK: valuation_cache.item_id → items.id)
      await pool.query(
        `DELETE FROM valuation_cache
         WHERE item_id IN (
           SELECT id FROM items
           WHERE created_by IN (
             SELECT id FROM users WHERE clerk_id = ANY($1::text[])
           )
         )`,
        [allClerkIds],
      );

      // 3. items created by test users (FK: items.created_by → users.id)
      await pool.query(
        `DELETE FROM items
         WHERE created_by IN (
           SELECT id FROM users WHERE clerk_id = ANY($1::text[])
         )`,
        [allClerkIds],
      );

      // 4. users themselves
      await pool.query(
        `DELETE FROM users WHERE clerk_id = ANY($1::text[])`,
        [allClerkIds],
      );

      console.log("[e2e teardown] Deleted local DB rows.");
    } catch (err) {
      console.warn("[e2e teardown] Could not delete DB rows:", err);
    } finally {
      await pool.end();
    }
  }

  unlinkSync(STATE_FILE);
  console.log("[e2e teardown] Complete.");
}
