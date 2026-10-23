import { expect, test } from "@playwright/test";

// Nur lesend: prüft, dass die Kernseiten bei 375 px ohne horizontales Scrollen und ohne Fehler rendern.
const PAGES = ["/dashboard", "/mitglieder", "/mitglieder?ansicht=karte", "/briefing", "/projekte", "/studios", "/finanzen", "/community", "/einladen"];

test("Kernseiten mobil (375 px)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Deine Crew");
  await page.goto("/login");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click(); // vorausgefüllt mit kreativ@demo.cc
  await page.waitForURL("**/dashboard");
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} scrollt horizontal`).toBeLessThanOrEqual(1);
  }
  await expect(page.getByRole("navigation", { name: "Mobile Navigation" })).toBeVisible();
});
