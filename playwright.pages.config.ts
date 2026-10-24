import { defineConfig, devices } from "@playwright/test";

// Dieselben Smoke-Tests wie playwright.config.ts, aber gegen den statischen GitHub-Pages-Export (out/),
// ausgeliefert wie auf Pages: unter /creative-connect-demo/, unbekannte Pfade → 404.html.
// Vorher bauen: PAGES_BASE_PATH=/creative-connect-demo pnpm build:pages
const PORT = 4100;
const BASE_PATH = process.env.PAGES_BASE_PATH ?? "/creative-connect-demo";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  // baseURL mit abschließendem Slash: relative Pfade in den Tests landen unter dem basePath
  use: { baseURL: `http://localhost:${PORT}${BASE_PATH}/`, locale: "de-DE", timezoneId: "Europe/Berlin", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", testIgnore: /mobil\.spec/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobil", testMatch: /mobil\.spec/, use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: `node scripts/pages/serve.mjs ${PORT}`,
    port: PORT,
    timeout: 30_000,
    reuseExistingServer: false,
    env: { PAGES_BASE_PATH: BASE_PATH },
  },
});
