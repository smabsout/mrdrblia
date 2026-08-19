/**
 * Playwright global setup — runs once before all tests.
 *
 * Creates three Clerk test users:
 *   1. jitUser    — Clerk user only, NO local DB row. Used to verify that
 *                   getOrProvisionUser (auth middleware) creates the row JIT.
 *   2. regularUser — pre-seeded in DB with role "user"  (for the other UI tests)
 *   3. adminUser   — pre-seeded in DB with role "admin"
 *
 * Pre-seeding admin via pg avoids the chicken-and-egg problem of granting
 * admin before the admin link test runs, while leaving the JIT path fully
 * exercised by a user who has never touched the API.
 *
 * State is written to e2e/.test-users.json (gitignored) for tests and teardown.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClerkClient } from "@clerk/backend";
import { clerkSetup } from "@clerk/testing/playwright";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const STATE_FILE = `${__dirname}/.test-users.json`;

const FRONTEND_URL = "http://localhost:80";
const API_URL = "http://localhost:80/api";

export interface TestUser {
  userId: string;
  email: string;
  password: string;
}

export interface TestUsers {
  /** Clerk-only user: no local DB row pre-seeded. JIT test signs them in and
   *  hits requireAuth so getOrProvisionUser creates the row in real-time. */
  jit: TestUser;
  /** Pre-seeded in users table with role="user". Used for UI auth tests. */
  regular: TestUser;
  /** Pre-seeded in users table with role="admin". Used for admin-panel tests. */
  admin: TestUser;
}

async function waitFor(url: string, maxWaitMs = 30_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready within ${maxWaitMs}ms`);
}

export default async function globalSetup() {
  // clerkSetup reads CLERK_PUBLISHABLE_KEY to configure the FAPI endpoint
  // that setupClerkTestingToken / clerk.signIn rely on later.
  await clerkSetup();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is required for E2E tests");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required for E2E tests");

  console.log("[e2e setup] Waiting for dev servers...");
  await Promise.all([waitFor(`${API_URL}/healthz`), waitFor(FRONTEND_URL)]);
  console.log("[e2e setup] Dev servers are ready.");

  const clerk = createClerkClient({ secretKey });

  const ts = Date.now();
  const password = `E2eT3st!${ts}`;

  const mkEmail = (label: string) => `e2e-${label}-${ts}@example.com`;

  console.log("[e2e setup] Creating Clerk test users...");
  const [jitClerkUser, regularClerkUser, adminClerkUser] = await Promise.all([
    clerk.users.createUser({
      emailAddress: [mkEmail("jit")],
      password,
      skipPasswordChecks: true,
    }),
    clerk.users.createUser({
      emailAddress: [mkEmail("regular")],
      password,
      skipPasswordChecks: true,
    }),
    clerk.users.createUser({
      emailAddress: [mkEmail("admin")],
      password,
      skipPasswordChecks: true,
    }),
  ]);

  console.log(`[e2e setup] JIT user:     ${jitClerkUser.id}  (no DB row — JIT test will create it)`);
  console.log(`[e2e setup] Regular user: ${regularClerkUser.id}`);
  console.log(`[e2e setup] Admin user:   ${adminClerkUser.id}`);

  // Pre-seed ONLY the regular and admin users into the local DB.
  // The jit user intentionally has NO local row — getOrProvisionUser must create it.
  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    for (const [clerkUser, role] of [
      [regularClerkUser, "user"],
      [adminClerkUser, "admin"],
    ] as const) {
      const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@clerk.local`;
      const displayName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

      await pool.query(
        `INSERT INTO users (clerk_id, email, display_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET clerk_id = $1, role = $4`,
        [clerkUser.id, email, displayName, role],
      );
      console.log(`[e2e setup] DB pre-seeded: ${role} <${email}>`);
    }
  } finally {
    await pool.end();
  }

  const users: TestUsers = {
    jit: {
      userId: jitClerkUser.id,
      email: mkEmail("jit"),
      password,
    },
    regular: {
      userId: regularClerkUser.id,
      email: mkEmail("regular"),
      password,
    },
    admin: {
      userId: adminClerkUser.id,
      email: mkEmail("admin"),
      password,
    },
  };

  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(users, null, 2));
  console.log("[e2e setup] State written to", STATE_FILE);
}
