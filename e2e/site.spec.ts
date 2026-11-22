import { expect, test } from "@playwright/test";
import { PAGES_BY_LANG } from "./pages";


for (const lang of ["de", "en"] as const) {
  for (const page of PAGES_BY_LANG[lang]) {
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
  await page.getByRole("banner").getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/artists\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Startseite auf kleinen Handys (320 × 640): Warteliste sofort sichtbar, nichts zu breit", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("de/");
  await expect(page.getByRole("link", { name: /Auf die Warteliste/ }).first()).toBeInViewport();
  await page.locator("#vorschau").scrollIntoViewIfNeeded(); // lädt die Vorschau nach
  await expect(page.getByTestId("preview")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("Ohne Store-Einträge keine Store-Badges, nur der neutrale Hinweis", async ({ page }) => {
  await page.goto("de/download/");
  await expect(page.getByTestId("platforms-soon").first()).toContainText("iOS, Android und Web");
  await expect(page.getByText(/App Store|Google Play/)).toHaveCount(0);
});

test("Warteliste mit Brevo-URL: Absenden zeigt nicht mehr „Öffnet in Kürze“", async ({ page }) => {
  // Request an Brevo abfangen, damit Tests keine echten Kontakte anlegen
  await page.route("https://*.sibforms.com/**", (route) => route.fulfill({ status: 200, body: "ok" }));
  await page.goto("de/warteliste/");
  await page.getByLabel("E-Mail-Adresse").fill("test@example.com");
  await page.getByLabel("Ich bin …").selectOption("artist");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByTestId("form-success")).toBeVisible();
  await expect(page.getByText("Öffnet in Kürze")).toHaveCount(0);
});

test("SEO-Dateien sind da", async ({ page, request }) => {
  for (const file of ["sitemap.xml", "robots.txt", "manifest.webmanifest", "og/og-de.png", "icons/icon-192.png"]) {
    expect((await request.get(file)).status(), file).toBe(200);
  }
  await page.goto("de/");
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og-de\.png$/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("Unbekannte Adresse zeigt die 404-Seite", async ({ page }) => {
  const res = await page.goto("gibt-es-nicht/");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("404");
});

test("Wartelisten-Formular ist barrierefrei beschriftet", async ({ page }) => {
  await page.goto("de/warteliste/");
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  await expect(page.getByLabel("Ich bin …")).toBeVisible();
  await expect(page.getByRole("link", { name: /Datenschutzerklärung/ })).toHaveAttribute("href", /datenschutz\/$/);
});

test("DJ-Pult-Intro: läuft beim Laden der Startseite, blendet sich aus, nicht bei reduzierter Bewegung", async ({ page }) => {
  // Nicht auf „load“ warten: Der Vorhang dauert knapp 3 Sekunden, das Laden aller Bilder kann länger brauchen
  await page.goto("de/", { waitUntil: "domcontentloaded" });
  const intro = page.getByTestId("deck-intro");
  await expect(page.locator("html")).toHaveAttribute("data-intro-played", "");
  // Klicks gehen durch den Vorhang hindurch (Regel prüfen statt Zeitpunkt abzupassen)
  expect(await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules]).some((r) => r.cssText.includes("intro-on") && r.cssText.includes("pointer-events: none")))).toBe(true);
  await expect(intro).toBeHidden({ timeout: 6000 });
  await expect(page.locator("html")).not.toHaveClass(/intro-on/);
  // Interne Navigation zurück zur Startseite spielt es nicht noch einmal
  await page.goto("de/artists/");
  await page.getByRole("banner").getByRole("link", { name: /Bubblegum/ }).first().click();
  await expect(page).toHaveURL(/\/de\/$/);
  await expect(intro).toBeHidden();
  // Bewegung reduzieren: kein Intro
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  await expect(page.getByTestId("deck-intro")).toBeHidden();
});
