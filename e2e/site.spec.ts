import { expect, test } from "@playwright/test";

const PAGES = ["", "artists/", "veranstalter/", "unternehmen/", "download/", "warteliste/", "presse/", "impressum/", "datenschutz/"];

for (const lang of ["de", "en"]) {
  for (const page of PAGES) {
    test(`/${lang}/${page} lädt ohne Fehler und ohne seitliches Scrollen`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      p.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
      await p.emulateMedia({ reducedMotion: "reduce" });
      const res = await p.goto(`${lang}/${page}`);
      expect(res?.status()).toBe(200);
      await expect(p.locator("html")).toHaveAttribute("lang", lang);
      await expect(p.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await p.waitForLoadState("networkidle");
      expect(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}

test("Einstieg leitet auf eine Sprache weiter", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveURL(/\/(de|en)\/$/);
});

test("Sprachwechsel behält die Seite", async ({ page }) => {
  await page.goto("de/artists/");
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/artists\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Hero passt auf kleine Handys (320 × 640)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("de/");
  await expect(page.locator(".hero__foot")).toBeVisible();
  const { footBottom, barTop, overflow } = await page.evaluate(() => ({
    footBottom: document.querySelector(".hero__foot")!.getBoundingClientRect().bottom,
    barTop: document.querySelector(".hero__bar")!.getBoundingClientRect().top,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(footBottom, "Buttons laufen in die Leiste").toBeLessThanOrEqual(barTop);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Wartelisten-Formular ist barrierefrei beschriftet", async ({ page }) => {
  await page.goto("de/warteliste/");
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  await expect(page.getByRole("link", { name: /Datenschutzerklärung/ })).toHaveAttribute("href", /datenschutz\/$/);
});
