import { defineConfig, devices } from "@playwright/test";

// Smoke-Tests gegen einen Produktions-Build mit eigener, frisch geseedeter Test-Datenbank (prisma/e2e.db).
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, locale: "de-DE", timezoneId: "Europe/Berlin", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", testIgnore: /mobil\.spec/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobil", testMatch: /mobil\.spec/, use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: `pnpm prisma db push --skip-generate && pnpm prisma db seed && pnpm next start -p ${PORT}`,
    port: PORT,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { DATABASE_URL: "file:./e2e.db" },
  },
});
