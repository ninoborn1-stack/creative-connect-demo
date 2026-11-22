import { expect, test, type Page } from "@playwright/test";

// Interaktive App-Vorschau auf der Startseite (Desktop und 375 px)
async function openPreview(page: Page) {
  await page.goto("de/");
  await page.locator("#vorschau").scrollIntoViewIfNeeded(); // Vorschau lädt erst im Viewport
  const preview = page.getByTestId("preview");
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  return preview;
}

async function dragCard(page: Page, dx: number) {
  const card = page.getByTestId("swipe-card");
  const box = (await card.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y + 4);
  await page.mouse.up();
}

test("Swipe per Maus-Drag nach links zeigt die nächste Karte", async ({ page }) => {
  await openPreview(page);
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "mila");
  await expect(page.getByTestId("preview-hint")).toBeVisible();
  await dragCard(page, -220);
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "warehouse");
  await expect(page.getByTestId("preview-hint")).toBeHidden();
});

test("Kurzer Drag federt zurück", async ({ page }) => {
  await openPreview(page);
  await dragCard(page, 40);
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "mila");
});

test("Swipe per Button und Rückgängig", async ({ page }) => {
  const preview = await openPreview(page);
  await preview.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "warehouse");
  await preview.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "mila");
});

test("Match → Chat → Nachricht senden mit Antwort", async ({ page }) => {
  const preview = await openPreview(page);
  await dragCard(page, 240);
  const match = page.getByTestId("preview-match");
  await expect(match).toBeVisible();
  await match.getByRole("button", { name: "Nachricht schreiben" }).click();
  const chat = page.getByTestId("preview-chat");
  await expect(chat).toContainText("Mila Sternberg");
  await chat.getByLabel("Nachricht schreiben …").fill("Freitag passt!");
  await chat.getByRole("button", { name: "Senden" }).click();
  await expect(chat.getByTestId("msg-me").last()).toHaveText("Freitag passt!");
  await expect(chat.getByTestId("msg-them")).toHaveCount(3, { timeout: 5000 });
  await expect(preview).toBeVisible();
});

test("Moduswechsel zu Scroll, Doppeltipp liked", async ({ page }) => {
  const preview = await openPreview(page);
  await preview.getByRole("button", { name: "Scroll", exact: true }).click();
  const feed = page.getByTestId("preview-feed");
  await expect(feed).toBeVisible();
  const count = feed.getByTestId("feed-like-count").first();
  const before = Number(await count.textContent());
  await feed.getByTestId("feed-image").first().dblclick();
  await expect(count).toHaveText(String(before + 1));
});

test("Filter zeigt nur Events, Algorithmus-Schalter zeigt Hinweis", async ({ page }) => {
  const preview = await openPreview(page);
  await preview.getByRole("button", { name: "Events", exact: true }).first().click();
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "warehouse");
  await preview.getByRole("button", { name: "Neu entdecken" }).click();
  await expect(page.getByTestId("preview-toast")).toContainText("Algorithmus aus");
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "ateliers");
});

test("Event merken zeigt Erinnerung und „Deine Events“", async ({ page }) => {
  const preview = await openPreview(page);
  await preview.getByRole("navigation").getByRole("button", { name: "Events" }).click();
  await page.getByTestId("preview-event-save").first().click();
  await expect(page.getByTestId("preview-toast")).toContainText("7 Tage, 1 Tag und 3 Stunden");
  await expect(page.getByTestId("preview-my-events")).toContainText("Beat-Workshop");
});

test("Vorschau zurücksetzen", async ({ page }) => {
  const preview = await openPreview(page);
  await preview.getByRole("button", { name: "Weiter" }).click();
  await preview.getByRole("button", { name: "Weiter" }).click();
  await page.getByTestId("preview-reset").click();
  await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-card", "mila");
  await expect(page.getByTestId("preview-hint")).toBeVisible();
});

test("Englische Vorschau", async ({ page }) => {
  await page.goto("en/");
  await page.locator("#vorschau").scrollIntoViewIfNeeded();
  const preview = page.getByRole("region", { name: "Interactive app preview" });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.getByRole("button", { name: "Pass" })).toBeVisible();
});

test("Handy-Rahmen behält seine Höhe, lange Listen scrollen innen", async ({ page }) => {
  const preview = await openPreview(page);
  const frame = page.getByRole("region", { name: "Interaktive App-Vorschau" });
  const before = (await frame.boundingBox())!.height;
  await preview.getByRole("navigation").getByRole("button", { name: "Events" }).click();
  await expect(page.getByTestId("preview-events")).toBeVisible();
  expect(Math.abs((await frame.boundingBox())!.height - before)).toBeLessThan(2);
});
