import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { LEGAL_PATHS, PAGES_BY_LANG } from "./pages";

// Rechtliches: Platzhalter-Check, keine Fremdanfragen und keine Cookies, Footer-Links, Impressum, Datenschutz,
// Einwilligung in den Formularen, Bildnachweise.

const ALL = (["de", "en"] as const).flatMap((lang) => PAGES_BY_LANG[lang].map((p) => `${lang}/${p}`)).concat(["gibt-es-nicht/"]);

test("LEGAL enthält keine Platzhalter", () => {
  test.skip(test.info().project.name !== "desktop", "einmal reicht");
  const out = execFileSync("node", ["scripts/check-legal.mjs"], { encoding: "utf8" });
  expect(out).toContain("LEGAL ok");
  const brand = readFileSync("src/lib/brand.ts", "utf8");
  const block = brand.slice(brand.indexOf("export const LEGAL"), brand.indexOf("} as const;", brand.indexOf("export const LEGAL")));
  expect(block).not.toContain("<<");
});

for (const path of ALL) {
  test(`/${path}: keine Anfragen an fremde Hosts, keine Cookies, kein Browser-Speicher`, async ({ page, context, baseURL }) => {
    const own = new URL(baseURL!).host;
    const foreign: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (["http:", "https:"].includes(u.protocol) && u.host !== own) foreign.push(r.url());
    });
    await page.goto(path);
    // bis unten scrollen, damit Vorschau und Bilder nachladen
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForLoadState("networkidle");
    expect(foreign).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  });
}

for (const lang of ["de", "en"] as const) {
  for (const p of PAGES_BY_LANG[lang]) {
    test(`/${lang}/${p}: Footer mit Impressum, Datenschutz, Kontakt und Sprachwechsel`, async ({ page }) => {
      await page.goto(`${lang}/${p}`);
      const legal = page.getByTestId("footer-legal");
      const imprint = legal.getByRole("link", { name: lang === "de" ? "Impressum" : "Imprint", exact: true });
      const privacy = legal.getByRole("link", { name: lang === "de" ? "Datenschutz" : "Privacy", exact: true });
      await expect(imprint).toHaveAttribute("href", new RegExp(`${LEGAL_PATHS[lang].imprint}$`));
      await expect(privacy).toHaveAttribute("href", new RegExp(`${LEGAL_PATHS[lang].privacy}$`));
      await expect(legal.getByRole("link", { name: lang === "de" ? "Kontakt" : "Contact" })).toHaveAttribute("href", "mailto:kontakt@threeapesgroup.com");
      await expect(page.locator("footer")).toContainText(`© ${new Date().getFullYear()} ThreeApesGroup`);
      await expect(imprint).toBeVisible();
    });
  }
}

test("404 hat Impressum und Datenschutz in beiden Sprachen", async ({ page, request }) => {
  await page.goto("gibt-es-nicht/");
  const legal = page.getByTestId("footer-legal");
  for (const name of ["Impressum", "Datenschutz", "Imprint", "Privacy"]) {
    const url = await legal.getByRole("link", { name, exact: true }).getAttribute("href");
    expect((await request.get(url!)).status(), name).toBe(200);
  }
});

test("Rechtsseiten liefern 200, Sprachwechsel springt auf den richtigen Slug", async ({ page, request }) => {
  for (const lang of ["de", "en"] as const) {
    for (const path of Object.values(LEGAL_PATHS[lang])) expect((await request.get(path)).status(), path).toBe(200);
  }
  await page.goto("de/impressum/");
  await page.getByRole("banner").getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/imprint\/$/);
  await page.goto("en/privacy/");
  await page.getByRole("banner").getByRole("link", { name: "DE", exact: true }).click();
  await expect(page).toHaveURL(/\/de\/datenschutz\/$/);
});

test("Rechtsseiten: hreflang gesetzt, nicht noindex", async ({ page }) => {
  await page.goto("de/impressum/");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en\/imprint\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await page.goto("en/privacy/");
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute("href", /\/de\/datenschutz\/$/);
});

test("Impressum DE: Pflichtangaben nach § 5 DDG", async ({ page }) => {
  await page.goto("de/impressum/");
  const main = page.getByRole("main");
  await expect(main).toContainText("Angaben gemäß § 5 DDG");
  await expect(page.getByTestId("legal-address")).toContainText("Nino Bornhäußer");
  await expect(page.getByTestId("legal-address")).toContainText("handelnd unter ThreeApesGroup (Einzelunternehmen)");
  await expect(page.getByTestId("legal-address")).toContainText("Am Schlachtensee 122A");
  await expect(main.getByRole("link", { name: "+49 163 8699289" })).toHaveAttribute("href", "tel:+491638699289");
  await expect(main.getByRole("link", { name: "kontakt@threeapesgroup.com" }).first()).toHaveAttribute("href", "mailto:kontakt@threeapesgroup.com");
  await expect(main).toContainText("Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV");
  await expect(main).toContainText("Wir sind nicht bereit und nicht verpflichtet");
  await expect(main).not.toContainText("TMG");
  await expect(main).not.toContainText("Umsatzsteuer"); // vatId ist null
  await expect(page.locator('a[href*="ec.europa.eu/consumers/odr"]')).toHaveCount(0);
  const photos = Object.keys(JSON.parse(readFileSync("src/lib/images.json", "utf8")));
  await expect(page.getByTestId("image-credits").getByRole("listitem")).toHaveCount(photos.length);
  // Telefon nur im Impressum, nicht im Footer
  await expect(page.locator("footer")).not.toContainText("8699289");
});

test("Impressum und Datenschutz EN: Übersetzung mit Hinweis auf die deutsche Fassung", async ({ page }) => {
  for (const path of ["en/imprint/", "en/privacy/"]) {
    await page.goto(path);
    await expect(page.getByTestId("legal-binding")).toContainText("The German version is legally binding.");
  }
});

test("Datenschutz DE: alle Pflichtabschnitte", async ({ page }) => {
  await page.goto("de/datenschutz/");
  const main = page.getByRole("main");
  for (const text of ["GitHub Pages", "Data Privacy Framework", "Sendinblue SAS", "Art. 28 DSGVO", "Double-Opt-in", "16 Jahren", "Widerspruchsrecht", "Art. 21 DSGVO", "§ 25 Abs. 2 TDDDG", "sechs Monate", "eigene Datenschutzerklärung"]) {
    await expect(main, text).toContainText(text);
  }
  await expect(main.getByRole("link", { name: "Berliner Beauftragte für Datenschutz und Informationsfreiheit" })).toHaveAttribute("href", "https://www.datenschutz-berlin.de");
  await expect(main).toContainText("21. November 2026");
});

test("Jedes Foto hat einen Bildnachweis", () => {
  const photos = Object.keys(JSON.parse(readFileSync("src/lib/images.json", "utf8")));
  const credits = readFileSync("src/content/image-credits.ts", "utf8");
  for (const p of photos) expect(credits, p).toContain(`u("${p}"`);
});

test("Sitemap: vier Rechtsseiten ja, Bestätigungsseiten nein", async ({ request }) => {
  const xml = await (await request.get("sitemap.xml")).text();
  for (const p of ["/de/impressum/", "/en/imprint/", "/de/datenschutz/", "/en/privacy/"]) expect(xml).toContain(p);
  expect(xml).not.toMatch(/bestaetigt|confirmed|\/en\/impressum\/|\/en\/datenschutz\//);
});

for (const c of [
  { name: "Warteliste DE", url: "de/warteliste/", form: "waitlist-form", fill: { "E-Mail-Adresse": "test@example.com" }, select: ["Ich bin …", "fan"], submit: "Eintragen", error: "Bitte setz das Häkchen", hint: "Du bekommst eine E-Mail zur Bestätigung." },
  { name: "Waitlist EN", url: "en/warteliste/", form: "waitlist-form", fill: { "Email address": "test@example.com" }, select: ["I am …", "fan"], submit: "Sign up", error: "Please tick the box", hint: "You’ll get an email to confirm." },
]) {
  test(`${c.name}: ohne Häkchen kein Absenden, mit Häkchen Erfolg`, async ({ page }) => {
    const sent: string[] = [];
    await page.route("https://*.sibforms.com/**", async (route) => { sent.push(route.request().url()); await route.fulfill({ status: 200, body: "ok" }); });
    await page.goto(c.url);
    const form = page.getByTestId(c.form);
    for (const [label, value] of Object.entries(c.fill)) await form.getByLabel(label).fill(value);
    await form.getByLabel(c.select[0]).selectOption(c.select[1]);
    await expect(form.getByTestId("consent")).not.toBeChecked();
    await expect(form.getByTestId("confirm-hint")).toHaveText(c.hint);
    await form.getByRole("button", { name: c.submit, exact: true }).click();
    await expect(form.getByTestId("consent-error")).toContainText(c.error);
    await expect(form.getByTestId("consent")).toHaveAttribute("aria-describedby", /consent-error/);
    expect(sent).toHaveLength(0);
    await form.getByTestId("consent").check();
    await expect(form.getByTestId("consent-error")).toHaveCount(0);
    await form.getByRole("button", { name: c.submit, exact: true }).click();
    await expect(page.getByTestId("form-success")).toBeVisible();
    expect(sent).toHaveLength(1);
  });
}

test("Backstage: Einwilligung mit Mindestalter, Link auf die Datenschutzseite der Sprache", async ({ page }) => {
  await page.goto("en/backstage/");
  const form = page.getByTestId("backstage-form");
  await expect(form).toContainText("I am at least 16");
  await expect(form.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", /\/en\/privacy\/$/);
  await page.goto("de/backstage/");
  await expect(page.getByTestId("backstage-form")).toContainText("Ich bin mindestens 16 Jahre alt");
  await expect(page.getByTestId("backstage-form").getByRole("link", { name: "Datenschutzerklärung" })).toHaveAttribute("href", /\/de\/datenschutz\/$/);
});
