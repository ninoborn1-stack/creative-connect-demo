import { expect, test, type Page } from "@playwright/test";
import { FEATURES } from "../src/lib/features";

// Smoke-Tests der Hauptpfade. Laufen gegen eine frisch geseedete Test-DB (siehe playwright.config.ts)
// bzw. gegen den statischen Pages-Export (playwright.pages.config.ts) – daher relative Pfade ohne führenden Slash.

async function login(page: Page, email: string) {
  await page.goto("login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.waitForURL(/\/(dashboard|admin)/);
}

test("Einladung einlösen → Onboarding", async ({ page }) => {
  await page.goto("invite/CC-ALT-2023");
  await expect(page.getByRole("link", { name: /Warteliste/ }).first()).toBeVisible();

  await page.goto("invite/CC-DEMO-2026");
  await page.getByLabel("Name").fill("Test Auftraggeberin");
  await page.getByLabel("E-Mail").fill(`e2e-${Date.now()}@demo.cc`);
  await page.getByLabel("Passwort").fill("demo");
  await page.getByRole("button", { name: "Einladung annehmen" }).click();

  await page.waitForURL("**/onboarding");
  // Nur Auftraggeber:in wählen (Kreative:r ist vorausgewählt) → Kreativ-Schritte entfallen
  const creative = page.getByRole("checkbox", { name: /Kreative:r/ });
  if ((await creative.getAttribute("aria-checked")) === "true") await creative.click();
  const client = page.getByRole("checkbox", { name: /Auftraggeber:in/ });
  if ((await client.getAttribute("aria-checked")) !== "true") await client.click();
  await page.getByRole("button", { name: "Weiter" }).click(); // → Steuer
  await page.getByRole("button", { name: "Weiter" }).click(); // → KSK
  await page.getByRole("button", { name: "Abschließen" }).click();
  await page.getByRole("link", { name: /Dashboard/ }).first().click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
});

test("Ausbaustufe 1: Paket anfragen und Artist direkt anfragen", async ({ page }) => {
  await login(page, "kunde@demo.cc");
  await page.goto("paket-anfrage?paket=song-video");
  await page.getByLabel("Worum geht es?").fill("Single mit Video");
  await page.getByLabel("Ort").fill("Hamburg");
  await page.getByRole("button", { name: "Paket anfragen" }).click();
  await page.waitForURL(/\/projekte\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Song + Video");

  await page.goto("mitglieder");
  await page.getByRole("button", { name: "Nesto anfragen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Projekt").fill("Beat für Kampagne");
  await dialog.getByLabel("Ort").fill("Berlin");
  await dialog.getByRole("button", { name: "Anfrage senden" }).click();
  await page.waitForURL(/\/projekte\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Beat für Kampagne");
});

test("Musik & Stock: reinhören und Nutzung anfragen", async ({ page }) => {
  test.skip(!FEATURES.musik, "Musik & Stock ist ausgeschaltet (src/lib/features.ts)");
  await login(page, "kunde@demo.cc");
  await page.goto("lizenzen?bereich=musik");
  await expect(page.getByRole("heading", { name: "Musik & Stock" })).toBeVisible();
  await page.goto("lizenzen/hafenlichter");
  await page.getByTestId("work-request").getByRole("button", { name: /Nutzung anfragen|Individuell anfragen/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Wofür?").fill("Imagefilm Frühjahr");
  await dialog.getByRole("button", { name: "Anfrage senden" }).click();
  await page.waitForURL(/\/projekte\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Imagefilm Frühjahr");
});

test("Entdecken: wischen, merken, Feed", async ({ page }) => {
  test.skip(!FEATURES.entdecken, "Entdecken ist ausgeschaltet (src/lib/features.ts)");
  await login(page, "kunde@demo.cc");
  await page.goto("entdecken");
  const first = await page.getByTestId("swipe-card").getByRole("heading", { level: 2 }).textContent();
  await page.getByRole("button", { name: "Merken", exact: true }).click();
  await expect(page.getByTestId("swipe-card").getByRole("heading", { level: 2 })).not.toHaveText(first!);
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("tab", { name: /Gemerkt \(1\)/ }).click();
  await expect(page.getByRole("list", { name: "Gemerkt" })).toContainText(first!);
  await page.getByRole("tab", { name: "Feed" }).click();
  await expect(page.getByRole("list", { name: "Feed" }).getByRole("article").first()).toBeVisible();
});

test("Briefing → Crew → Buchung → Abnahme → Bewertung", async ({ page }) => {
  await login(page, "kunde@demo.cc");
  await page.goto("briefing");
  await page.getByRole("button", { name: "Musikvideo für Single-Release" }).click();
  await page.getByTestId("briefing-submit").click();
  await expect(page.getByTestId("briefing-role").first()).toBeVisible();
  await expect(page.getByText(/KI-Vorschlag/).first()).toBeVisible();

  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/projekte\/[^/?]+/);

  await page.getByTestId("simulate-accept-all").click();
  await expect(page.getByTestId("column-bestaetigt").getByTestId("role-card").first()).toBeVisible();

  await page.getByTestId("tab-uebersicht").click();
  await page.getByTestId("start-production").click();
  await page.getByTestId("to-acceptance").click();

  await page.getByTestId("tab-abnahme").click();
  await page.getByTestId("accept-delivery").click();
  await page.getByTestId("accept-delivery-confirm").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByTestId("review-item").first()).toBeVisible();
  for (const star of await dialog.getByTestId("star-5").all()) await star.click();
  await dialog.getByTestId("submit-review").click();
  await expect(page.getByText("Abgeschlossen").first()).toBeVisible();
});

test("Studio sofort buchen", async ({ page }) => {
  await login(page, "kreativ@demo.cc");
  await page.goto("studios/raum-404");
  const dateSelect = page.locator("#b-date");
  const lastDay = await dateSelect.locator("option").last().getAttribute("value");
  await dateSelect.selectOption(lastDay!);
  await page.locator("#b-start").selectOption("20");
  await page.locator("#b-end").selectOption("22");
  await page.getByTestId("book-venue").click();
  await page.getByTestId("confirm-payment").click();
  await expect(page.getByTestId("booking-confirmed")).toBeVisible();
});

test("Admin schaltet marketplaceMode um", async ({ page }) => {
  await login(page, "admin@demo.cc");
  await page.goto("admin/einstellungen");
  await setMode(page, "closed");
  await page.goto("./");
  await expect(page.getByRole("link", { name: "Projekt starten" })).toHaveCount(0);

  await page.goto("admin/einstellungen");
  await setMode(page, "clients"); // Standard der Demo (Phase 2: Unternehmen können sich registrieren)
  await page.goto("./");
  await expect(page.getByRole("link", { name: "Projekt starten" }).first()).toBeVisible();
  await page.context().clearCookies(); // Registrierung als neue Firma, nicht als eingeloggter Admin
  await page.goto("registrieren");
  await expect(page.getByLabel("Firmenname").first()).toBeVisible();
});

test("Unternehmen lizenziert ein Werk → Zertifikat", async ({ page }) => {
  test.skip(!FEATURES.lizenzen, "Direkt-Lizenzierung ist ausgeschaltet (src/lib/features.ts)");
  await login(page, "kunde@demo.cc");
  await page.goto("lizenzen/hafenlichter");
  await page.getByTestId("license-tier-erweitert").click();
  await page.getByLabel("Projektname").fill("Imagefilm Test");
  await page.getByTestId("license-buy").click();
  await page.getByTestId("license-confirm-payment").click();
  await expect(page.getByTestId("license-confirmed")).toBeVisible();
  await expect(page.getByTestId("license-certificate")).toBeVisible();
});

test("Kreative:r pitcht → Gaming-Studio sagt zu → Projekt", async ({ page }) => {
  await login(page, "kreativ@demo.cc");
  await page.goto("ausschreibungen/soundtrack-fuer-das-story-game-ashfall");
  await page.getByLabel("Deine Nachricht").fill("Ich bringe Erfahrung mit Trailer-Musik und adaptiven Soundtracks mit.");
  await page.getByLabel("Dein Preis (€, netto)").fill("21000");
  await page.getByTestId("pitch-submit").click();
  await expect(page.getByText("Eingereicht").first()).toBeVisible();

  await login(page, "pixelfjord-games@demo.cc");
  await page.goto("ausschreibungen/soundtrack-fuer-das-story-game-ashfall");
  await page.getByRole("button", { name: "Jule Brandt auf die Shortlist setzen" }).click();
  // warten, bis der Pitch in der Shortlist steht (das Board lädt danach neu)
  await expect(page.getByRole("button", { name: "Jule Brandt von der Shortlist nehmen" })).toBeVisible();
  await page.getByRole("button", { name: "Jule Brandt zusagen" }).click();
  await page.getByTestId("pitch-accept-confirm").click();
  await page.waitForURL(/\/projekte\/[^/?]+/);
});

test("Bewerbung mit Auto-Analyse → Admin nimmt auf", async ({ page }) => {
  const email = `bewerbung-${Date.now()}@example.org`;
  await page.goto("bewerben");
  await page.getByTestId("apply-track-standard").click();
  await page.getByTestId("apply-next").click();
  await page.getByLabel("Name").fill("Test Produzentin");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Stadt").fill("Hamburg");
  await page.getByRole("button", { name: "Musikproduktion" }).click();
  await page.getByRole("button", { name: /Beispiel einfügen/ }).click();
  await page.getByTestId("apply-analyze").click();
  await page.getByTestId("apply-submit").click({ timeout: 20_000 });
  await expect(page.getByTestId("apply-status")).toBeVisible();

  await login(page, "admin@demo.cc");
  await page.goto("admin/bewerbungen");
  await page.getByRole("link", { name: /Test Produzentin/ }).first().click();
  await page.getByTestId("admin-application-accept").click();
  await expect(page.getByText(/Aufgenommen/).first()).toBeVisible();
});

// Klickt erst, wenn die Seite hydriert ist (sonst geht der Klick auf das Radio ins Leere)
async function setMode(page: Page, mode: "closed" | "clients" | "open") {
  const save = page.getByTestId("save-marketplace-mode");
  await expect(async () => {
    await page.getByTestId(`marketplace-mode-${mode}`).click();
    await expect(save).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await save.click();
  await expect(save).toBeDisabled();
  await expect(page.getByTestId(`marketplace-mode-${mode}`).getByText("aktiv")).toBeVisible();
}

test("Session mit Nesto buchen → Teilnahme → Punkte → Belohnung einlösen", async ({ page }) => {
  await login(page, "kreativ@demo.cc");
  const balance = async () => {
    await page.goto("punkte");
    const text = await page.getByRole("heading", { name: "Dein Kontostand" }).locator("..").innerText();
    return Number(text.match(/([\d.]+)\s*Punkte/)?.[1].replace(".", "") ?? NaN);
  };
  const before = await balance();

  await page.goto("sessions?woche=1");
  const card = page.getByRole("button", { name: /frei/ }).first();
  // Titel + Uhrzeit identifizieren die Karte auch, nachdem sich „x/y frei“ geändert hat
  const lines = (await card.innerText()).split("\n").map((l) => l.trim()).filter(Boolean);
  const title = lines.reduce((a, b) => (b.length > a.length ? b : a));
  const time = lines.find((l) => /Uhr$/.test(l)) ?? "";
  await card.click();
  await page.getByTestId("book-session").click();
  await page.getByTestId("confirm-booking").click();
  await expect(page.getByTestId("demo-checkin").or(page.getByText(/gebucht/i).first())).toBeVisible();
  if (!(await page.getByTestId("demo-checkin").isVisible())) {
    await page.keyboard.press("Escape");
    await page.getByRole("button").filter({ hasText: title }).filter({ hasText: time }).first().click();
  }
  await page.getByTestId("demo-checkin").click();
  await expect(page.getByText(/Punkte/).first()).toBeVisible();

  const afterSession = await balance();
  expect(afterSession).toBeGreaterThan(before);

  const spotlight = page.locator("article, li, div").filter({ has: page.getByText("Spotlight im Netzwerk", { exact: true }) }).filter({ has: page.getByTestId("redeem-reward") }).last();
  await spotlight.getByTestId("redeem-reward").click();
  await page.getByTestId("confirm-redeem").click();
  await expect.poll(balance).toBe(afterSession - 200);
});
