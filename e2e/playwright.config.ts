import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the price-guide E2E smoke tests.
 *
 * Targets:
 *   - Frontend : http://localhost:18565  (price-guide dev server)
 *   - API      : http://localhost:8080   (api-server dev server)
 *
 * Auth strategy: @clerk/testing setupClerkTestingToken() bypasses the Clerk
 * sign-in UI and injects a real session token for a pre-created test user.
 *
 * Browser: uses Replit's pre-installed Chromium (REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE)
 * which is a full Chrome binary, not the headless-shell. We pass it via
 * launchOptions.executablePath so Playwright skips the "is browser installed?" check
 * and goes directly to launching the supplied binary with --headless=new.
 */

const replitChromium = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: false,
  retries: 1,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // Use the Replit artifact router (port 80) so relative /api/... calls in the
    // React app resolve to the real API server — not the Vite dev server.
    baseURL: "http://localhost:80",
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },

  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // executablePath bypasses Playwright's "browser installed" check.
          // The Replit nix store ships a full Chrome binary, not the headless
          // shell, so we must also opt into the new headless mode explicitly.
          ...(replitChromium ? { executablePath: replitChromium } : {}),
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--headless=new",
          ],
        },
      },
    },
  ],
});
