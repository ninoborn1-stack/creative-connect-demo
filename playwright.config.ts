import { defineConfig, devices } from "@playwright/test";

// Smoke-Tests gegen den statischen Export (out/). Vorher: pnpm build (optional mit BASE_PATH).
const PORT = 4300;
const BASE_PATH = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}${BASE_PATH}/`, locale: "de-DE" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobil", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: { command: `node scripts/serve.mjs ${PORT}`, port: PORT, reuseExistingServer: false, env: { BASE_PATH } },
});
