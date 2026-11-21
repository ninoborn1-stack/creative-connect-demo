import { expect, test, type Page } from "@playwright/test";

// Brevo-Formulare (Warteliste, Backstage), Bestätigungsseiten und Backstage in der Vorschau.
// Erfolg wird mit einer Test-URL simuliert: window.__BREVO_URL_OVERRIDE__ + abgefangener Request.
const FAKE = "https://test.sibforms.com/serve/fake";

async function mockBrevo(page: Page) {
  const bodies: string[] = [];
  await page.addInitScript((url) => { window.__BREVO_URL_OVERRIDE__ = url; }, FAKE);
  await page.route(`${FAKE}**`, async (route) => {
    bodies.push(route.request().postData() ?? "");
    await route.fulfill({ status: 200, body: "ok" });
  });
  return bodies;
}

test("Warteliste: Pflichtfelder werden geprüft, nichts wird gesendet", async ({ page }) => {
  const bodies = await mockBrevo(page);
  await page.goto("de/warteliste/");
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByTestId("form-success")).toHaveCount(0);
  await page.getByLabel("E-Mail-Adresse").fill("keine-mail");
  await page.getByRole("button", { name: "Eintragen" }).click();
  expect(await page.getByLabel("E-Mail-Adresse").evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  expect(bodies).toHaveLength(0);
});

test("Warteliste: Rolle per URL vorbelegt, Erfolg mit Brevo-Feldern", async ({ page }) => {
  const bodies = await mockBrevo(page);
  await page.goto("de/warteliste/?rolle=artist");
  await expect(page.getByLabel("Ich bin …")).toHaveValue("artist");
  await page.getByLabel("E-Mail-Adresse").fill("test@example.com");
  await page.getByLabel("Stadt (optional)").fill("Hamburg");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByTestId("form-success")).toContainText("Bitte bestätige deine E-Mail");
  const sent = new URLSearchParams(bodies[0]);
  expect(Object.fromEntries(sent)).toMatchObject({ EMAIL: "test@example.com", ROLLE: "artist", STADT: "Hamburg", SPRACHE: "de", QUELLE: "warteliste", locale: "de", email_address_check: "" });
  expect([...sent.keys()].sort()).toEqual(["EMAIL", "ROLLE", "STADT", "SPRACHE", "QUELLE", "locale", "email_address_check"].sort());
});

test("Startseite: „Als Kreative:r bewerben“ führt zur Warteliste mit Rolle", async ({ page }) => {
  await page.goto("de/");
  await page.getByRole("link", { name: /Als Kreative:r bewerben/ }).click();
  await expect(page).toHaveURL(/warteliste\/\?rolle=artist$/);
  await expect(page.getByLabel("Ich bin …")).toHaveValue("artist");
});

test("Backstage: Bewerbung mit allen Feldern, englisch", async ({ page }) => {
  const bodies = await mockBrevo(page);
  await page.goto("en/backstage/");
  await expect(page.getByText("Backstage launches after the app.").first()).toBeVisible();
  const form = page.getByTestId("backstage-form");
  await form.getByLabel("Name", { exact: true }).fill("Juno Vale");
  await form.getByLabel("Artist or company name").fill("Juno Vale Music");
  await form.getByLabel("Email address").fill("juno@example.com");
  await form.getByLabel("Role").selectOption("producer");
  await form.getByLabel("City").fill("Hamburg");
  await form.getByLabel("Country").fill("Germany");
  await form.getByLabel("Links").fill("instagram.com/junovale\nopen.spotify.com/artist/x");
  await form.getByLabel("Referred by (optional)").fill("Mila Sternberg");
  await form.getByLabel("Message (optional)").fill("Touring Europe in spring.");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByTestId("form-success")).toContainText("Please confirm your email");
  expect(Object.fromEntries(new URLSearchParams(bodies[0]))).toMatchObject({
    NAME: "Juno Vale", KUENSTLERNAME: "Juno Vale Music", EMAIL: "juno@example.com", ROLLE: "producer", STADT: "Hamburg",
    LAND: "Germany", EMPFOHLEN_VON: "Mila Sternberg", SPRACHE: "en", QUELLE: "backstage", locale: "en",
  });
  expect([...new URLSearchParams(bodies[0]).keys()].sort()).toEqual(
    ["EMAIL", "NAME", "KUENSTLERNAME", "ROLLE", "STADT", "LAND", "LINKS", "EMPFOHLEN_VON", "NACHRICHT", "SPRACHE", "QUELLE", "locale", "email_address_check"].sort(),
  );
});

test("Echte Brevo-Adressen: jedes Formular sendet an sein eigenes Brevo-Formular", async ({ page }) => {
  // Abgefangen, es geht nichts an Brevo raus
  const hits: string[] = [];
  await page.route("https://*.sibforms.com/**", async (route) => { hits.push(route.request().url()); await route.fulfill({ status: 200, body: "ok" }); });
  const cases = [
    { url: "de/warteliste/", key: "MUIFAMUld2" }, { url: "en/warteliste/", key: "MUIFAFoMJe" },
    { url: "de/backstage/", key: "MUIFAATuZ9" }, { url: "en/backstage/", key: "MUIFAPzra0" },
  ];
  for (const c of cases) {
    await page.goto(c.url);
    const form = page.locator("form").last();
    for (const input of await form.locator("input[required]:not([type=checkbox]), textarea[required]").all()) {
      await input.fill((await input.getAttribute("type")) === "email" ? "test@example.com" : "Test");
    }
    for (const select of await form.locator("select").all()) await select.selectOption({ index: 1 });
    await form.getByRole("checkbox").check();
    await form.getByRole("button").last().click();
    await expect(page.getByTestId("form-success")).toBeVisible();
    expect(hits.pop()).toContain(c.key);
  }
});

test("Bestätigungsseiten: Warteliste und Backstage, noindex", async ({ page }) => {
  await page.goto("de/bestaetigt/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Danke. Du bist dabei.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("en/confirmed/?backstage=1");
  await expect(page.getByTestId("confirm-text")).toHaveText("Your application is in. We’ll get back to you.");
});

test("Bestätigungsseiten stehen nicht in der Sitemap, Backstage schon", async ({ request }) => {
  const xml = await (await request.get("sitemap.xml")).text();
  expect(xml).toContain("/de/backstage/");
  expect(xml).not.toMatch(/bestaetigt|confirmed/);
});

test("Vorschau: Geprüft-Badge im Profil, Backstage gesperrt", async ({ page }) => {
  await page.goto("de/");
  await page.getByText("So wird Bubblegum aussehen").scrollIntoViewIfNeeded();
  const preview = page.getByTestId("preview");
  await preview.getByRole("navigation").getByRole("button", { name: "Profil" }).click();
  await expect(page.getByTestId("preview-verified")).toHaveText("Geprüft");
  await preview.getByRole("navigation").getByRole("button", { name: "Erstellen" }).click();
  await page.getByTestId("preview-backstage-entry").click();
  await expect(page.getByTestId("preview-backstage")).toContainText("Nur auf Einladung.");
});
