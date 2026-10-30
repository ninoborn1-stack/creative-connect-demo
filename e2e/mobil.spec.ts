import { expect, test } from "@playwright/test";

// Nur lesend: prüft, dass die Kernseiten bei 375 px ohne horizontales Scrollen und ohne Fehler rendern.
// relative Pfade (ohne führenden Slash), damit sie auch unter einem basePath (GitHub Pages) funktionieren
const PAGES = ["entdecken", "pakete", "paket-anfrage", "ausschreibungen", "lizenzen", "unternehmen", "netzwerk", "branchen/gaming", "fuer-unternehmen", "bewerben", "dashboard", "mitglieder", "mitglieder?ansicht=karte", "briefing", "projekte", "studios", "finanzen", "community", "einladen", "sessions", "punkte"];

test("Kernseiten mobil (375 px)", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1, name: /Creative Connect/ })).toBeVisible();
  await page.goto("login");
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

test("Hero passt auf kleine Handys (320 × 640)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" }); // ohne Intro-Animation messen
  await page.goto("./");
  await expect(page.getByRole("link", { name: "Als Artist anbieten" }).first()).toBeVisible();
  const { footBottom, barTop, menuRight, overflow } = await page.evaluate(() => ({
    footBottom: document.querySelector(".hero__foot")!.getBoundingClientRect().bottom,
    barTop: document.querySelector(".hero__bar")!.getBoundingClientRect().top,
    menuRight: document.querySelector("[aria-label='Menü öffnen']")!.getBoundingClientRect().right,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(footBottom, "Buttons laufen in die Leiste").toBeLessThanOrEqual(barTop);
  expect(menuRight, "Menü-Button ragt aus dem Bild").toBeLessThanOrEqual(320);
  expect(overflow).toBeLessThanOrEqual(1);
});
