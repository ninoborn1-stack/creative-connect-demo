import { expect, test, type Page } from "@playwright/test";

// Smoke-Tests der Hauptpfade. Laufen gegen eine frisch geseedete Test-DB (siehe playwright.config.ts).

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.waitForURL(/\/(dashboard|admin)/);
}

test("Einladung einlösen → Onboarding", async ({ page }) => {
  await page.goto("/invite/CC-ALT-2023");
  await expect(page.getByRole("link", { name: /Warteliste/ }).first()).toBeVisible();

  await page.goto("/invite/CC-DEMO-2026");
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

test("Briefing → Crew → Buchung → Abnahme → Bewertung", async ({ page }) => {
  await login(page, "kunde@demo.cc");
  await page.goto("/briefing");
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
  await page.goto("/studios/raum-404");
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
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Projekt starten" })).toHaveCount(0);

  await login(page, "admin@demo.cc");
  await page.goto("/admin/einstellungen");
  await setMode(page, "clients");

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Projekt starten" }).first()).toBeVisible();
  await page.goto("/registrieren");
  await expect(page.getByLabel("Firma", { exact: false }).first()).toBeVisible();

  // zurück auf Phase 1, damit die Demo-Daten im Ausgangszustand bleiben
  await page.goto("/admin/einstellungen");
  await setMode(page, "closed");
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
