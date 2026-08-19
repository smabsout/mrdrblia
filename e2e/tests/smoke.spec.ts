/**
 * End-to-end smoke test after Clerk auth migration.
 *
 * Covers the five critical paths:
 *   1. Sign-up via Clerk → local user row created with role "user"
 *   2. Admin link visible only when role is "admin"
 *   3. Create a new item via Admin panel → item appears in pending queue
 *   4. Morbid chat drawer opens, message sends, SSE stream returns a response
 *   5. Sign out → Morbid button disappears, Admin link disappears
 *
 * Auth: @clerk/testing setupClerkTestingToken() injects a valid Clerk session
 *       into the browser without touching the sign-in UI.
 */

import { test, expect } from "../fixtures.js";

// Use the artifact router (port 80) for all requests — both the browser page
// and page.request calls. This ensures relative /api/... calls in the React
// app and our direct API checks both hit the same backend.
const API = "http://localhost:80/api";

// Helper: wait for /api/auth/me to return a user with the expected role.
// We poll the endpoint directly instead of watching for a browser network event
// so we don't race against already-resolved responses.
async function waitForMeRole(page: import("@playwright/test").Page, role: string) {
  await expect(async () => {
    const res = await page.request.get(`${API}/auth/me`);
    const body = await res.json();
    expect(body.role).toBe(role);
  }).toPass({ timeout: 20_000, intervals: [500] });
}

// ─── 1. JIT provisioning ─────────────────────────────────────────────────────
//
// The "jit" test user was created in Clerk but has NO pre-seeded local DB row.
// We sign them in, then hit a requireAuth-protected endpoint so that the
// getOrProvisionUser middleware runs and creates the DB row for the first time.
// Finally we confirm /auth/me reflects the newly created row with role="user".

test("1. sign-up: Clerk user is JIT-provisioned into the local DB with role=user", async ({
  jitPage: page,
  testUsers,
}) => {
  // Verify that NO local row exists yet (if it did, the test would be vacuous)
  const beforeMe = await page.request.get(`${API}/auth/me`);
  // /auth/me does NOT call requireAuth — it only looks up an existing row.
  // A 401 here confirms there is no local row for this Clerk user yet.
  expect(beforeMe.status()).toBe(401);

  // Hit a requireAuth-protected endpoint — this triggers getOrProvisionUser,
  // which fetches the Clerk profile and inserts a new users row with role="user".
  const convRes = await page.request.get(`${API}/anthropic/conversations`);
  expect(convRes.status()).toBe(200);

  // Now /auth/me should return the newly-provisioned local user record
  const meRes = await page.request.get(`${API}/auth/me`);
  expect(meRes.status()).toBe(200);

  const me = await meRes.json();
  expect(me).toMatchObject({
    email: testUsers.jit.email,
    role: "user",
  });
  expect(typeof me.id).toBe("number");
});

// ─── 2. Admin link visibility ─────────────────────────────────────────────────

test("2a. admin link: NOT visible for role=user", async ({ regularPage: page }) => {
  // Confirm the API returns role=user
  await waitForMeRole(page, "user");

  // Give React a moment to re-render after the /auth/me response settles
  // (the layout reads the `me` query result to decide whether to show Admin)
  const adminLink = page.locator("nav a", { hasText: /^Admin$/ });
  await expect(adminLink).not.toBeVisible({ timeout: 15_000 });
});

test("2b. admin link: visible for role=admin", async ({ adminPage: page }) => {
  // Confirm the API returns role=admin
  await waitForMeRole(page, "admin");

  // Navigate back to home if the Clerk hydration took us elsewhere
  await page.goto("/");

  const adminLink = page.locator("nav a", { hasText: /^Admin$/ });
  await expect(adminLink).toBeVisible({ timeout: 20_000 });
});

// ─── 3. Admin panel: create item ─────────────────────────────────────────────

test("3. admin panel: create item appears in pending queue", async ({
  adminPage: page,
}) => {
  const itemName = `Smoke Item ${Date.now()}`;

  await page.goto("/admin/items/new");

  // The form renders "Unauthorized" if role check fails
  await expect(page.locator("h1", { hasText: "Create Item" })).toBeVisible({
    timeout: 20_000,
  });

  await page.fill("#name", itemName);
  await page.fill("#category", "Letter");
  await page.fill("#year", "1985");

  // Intercept the create-item response (admin endpoint: /api/admin/items)
  const [createRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/admin/items") && r.request().method() === "POST",
      { timeout: 30_000 },
    ),
    page.click('button[type="submit"]'),
  ]);

  // The API must return 201 Created
  expect(createRes.status()).toBe(201);

  // After creation, the app navigates to /items/:slug (client-side).
  // Pending items show "Item not found" on the detail page — we verify the
  // item exists on the admin pending queue instead.
  await page.goto("/admin/items/pending");
  await expect(page.locator("body")).toContainText(itemName, { timeout: 15_000 });
});

// ─── 4. Morbid chat ──────────────────────────────────────────────────────────

test("4. Morbid chat: opens, message sends, SSE stream returns a response", async ({
  regularPage: page,
}) => {
  // Make sure the page is at home
  await page.goto("/");

  // The Morbid floating button appears once Clerk has a user
  const morbidBtn = page.locator("button", { hasText: "Morbid" });
  await expect(morbidBtn).toBeVisible({ timeout: 20_000 });

  await morbidBtn.click();

  // Drawer slides in
  const drawerHeader = page.locator("h2", { hasText: "Morbid AI" });
  await expect(drawerHeader).toBeVisible({ timeout: 10_000 });

  // Wait for the conversation to be auto-created (drawer useEffect)
  await page.waitForTimeout(3_000);

  const input = page.locator('input[placeholder="Ask Morbid..."]');
  await expect(input).toBeEnabled({ timeout: 10_000 });
  await input.fill("How many items are in my collection?");

  // Send via the icon button (last button with an svg inside)
  const sendBtn = page
    .locator("button")
    .filter({ has: page.locator("svg") })
    .last();
  await sendBtn.click();

  // Input becomes disabled during streaming, then re-enabled when done
  await expect(input).toBeDisabled({ timeout: 5_000 });
  await expect(input).toBeEnabled({ timeout: 60_000 });

  // At least one assistant bubble should be present
  const assistantBubble = page.locator(".bg-white.border.rounded-bl-none");
  await expect(assistantBubble.first()).toBeVisible({ timeout: 10_000 });
  const text = await assistantBubble.first().textContent();
  expect((text ?? "").length).toBeGreaterThan(5);
});

// ─── 5. Sign out ─────────────────────────────────────────────────────────────

test("5. sign out: Morbid button and Admin link disappear", async ({
  adminPage: page,
}) => {
  await page.goto("/");

  // Confirm authenticated state: Morbid button visible
  const morbidBtn = page.locator("button", { hasText: "Morbid" });
  await expect(morbidBtn).toBeVisible({ timeout: 20_000 });

  // Admin link visible for admin user
  await waitForMeRole(page, "admin");
  await page.goto("/");
  const adminLink = page.locator("nav a", { hasText: /^Admin$/ });
  await expect(adminLink).toBeVisible({ timeout: 20_000 });

  // Click Log Out
  await page.locator("button", { hasText: "Log Out" }).click();

  // Clerk redirects to "/" — wait for it to settle
  await page.waitForURL("/", { timeout: 20_000 });
  await page.waitForTimeout(1_500);

  // Morbid button gone (ChatDrawer returns null when !user)
  await expect(morbidBtn).not.toBeVisible({ timeout: 15_000 });

  // Admin link gone
  await expect(adminLink).not.toBeVisible();

  // Sign In / Sign Up links appear
  await expect(page.locator("nav a", { hasText: "Sign In" })).toBeVisible({
    timeout: 10_000,
  });
});
