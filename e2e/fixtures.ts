/**
 * Custom Playwright fixtures that extend the base `test` with:
 *   - `testUsers`   — the TestUsers state written by global-setup
 *   - `regularPage` — a Page in an isolated context, signed-in as the regular test user
 *   - `adminPage`   — a Page in an isolated context, signed-in as the admin test user
 *
 * Each fixture creates its own browser context (like a fresh incognito window)
 * to prevent session bleed between tests: Clerk cookies from one user would
 * otherwise interfere with the next test's sign-in.
 *
 * Auth uses @clerk/testing `clerk.signIn({ page, emailAddress })`:
 *   1. Navigate so window.Clerk is available
 *   2. Backend creates a sign-in token for the user
 *   3. Browser evaluates Clerk.signIn({ strategy:'ticket', ticket })
 *   4. Reload the page so the app fully re-renders authenticated
 */

import { test as base, type Page, type Browser } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { TestUser, TestUsers } from "./global-setup.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = `${__dirname}/.test-users.json`;

function loadTestUsers(): TestUsers {
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

/** Create an isolated browser context, navigate, sign in, and return the page. */
async function createSignedInPage(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Bypass the age-gate (localStorage flag) before the page first loads.
  // Without this the modal blocks all interaction.
  await page.addInitScript(() => {
    localStorage.setItem("pg_age_confirmed", "true");
  });

  // Navigate through the artifact router (port 80) so relative /api/... calls
  // in the React app resolve to the real API server, not the Vite dev server.
  await page.goto("http://localhost:80/");

  // clerk.signIn: backend creates a sign-in token then evaluates it in the browser
  await clerk.signIn({ page, emailAddress: email });

  // Reload so the React app fully re-renders with the authenticated session
  await page.reload();

  // Wait for the header nav (rendered only when Clerk is loaded)
  await page.waitForSelector("header nav", { timeout: 20_000 });

  return page;
}

type Fixtures = {
  testUsers: TestUsers;
  /** Isolated page signed in as the JIT-only Clerk user (no pre-seeded DB row). */
  jitPage: Page;
  regularPage: Page;
  adminPage: Page;
};

export const test = base.extend<Fixtures>({
  testUsers: async ({}, use) => {
    await use(loadTestUsers());
  },

  jitPage: async ({ browser, testUsers }, use) => {
    const page = await createSignedInPage(browser, testUsers.jit.email);
    await use(page);
    await page.context().close();
  },

  regularPage: async ({ browser, testUsers }, use) => {
    const page = await createSignedInPage(browser, testUsers.regular.email);
    await use(page);
    await page.context().close();
  },

  adminPage: async ({ browser, testUsers }, use) => {
    const page = await createSignedInPage(browser, testUsers.admin.email);
    await use(page);
    await page.context().close();
  },
});

export { expect } from "@playwright/test";
