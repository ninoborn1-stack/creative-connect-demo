import { expect, test, type Page } from "@playwright/test";

// Showcase-Animationen: statisch bei reduzierter Bewegung, kein horizontales Überlaufen, Hero-Handy ganz sichtbar,
// Schalter „Bewegung reduzieren“ im Footer.

const scrollThrough = async (page: Page, check?: () => Promise<void>) => {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 450) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(40);
    if (check) await check();
  }
};

test("Bewegung reduzieren (Gerät): alle Showcase-Elemente sichtbar und statisch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("de/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await expect(page.getByTestId("deck-intro")).toBeHidden();
  await scrollThrough(page);
  const state = await page.evaluate(() => {
    const running = document.getAnimations().filter((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return t?.closest(".sc-scope, .sc-orbit, .sc-city, [data-reveal]") && a.playState === "running";
    }).length;
    const hidden = [...document.querySelectorAll(".sc-fly, [data-reveal], .sc-orbit-face, .sc-wordmark-text")].filter((el) => Number(getComputedStyle(el).opacity) < 0.85).length; // hintere Kartenebene ist absichtlich leicht transparent (0,88)
    const p = [...document.querySelectorAll<HTMLElement>(".sc-scope")].map((el) => getComputedStyle(el).getPropertyValue("--p").trim());
    return { running, hidden, p: [...new Set(p)] };
  });
  expect(state).toEqual({ running: 0, hidden: 0, p: ["1"] });
  // Karten stehen an ihren Endpositionen, nichts dreht sich mit der Maus
  await page.mouse.move(50, 50);
  await page.mouse.move(900, 600);
  await expect(page.locator(".sc-hero-tilt")).toHaveCSS("transform", /matrix3d\(1, 0, 0, 0, 0, 1|none|matrix\(1, 0, 0, 1, 0, 0\)/);
  await expect(page.getByTestId("hero-cards").locator(".sc-hero-card")).toHaveCount(6);
});

for (const width of [375, 768, 1280, 1440]) {
  test(`Kein horizontales Überlaufen bei ${width} px, auch während der Animationen`, async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "setzt Breiten selbst");
    test.setTimeout(120_000); // drei Seiten komplett durchscrollen
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["de/", "en/", "de/backstage/"]) {
      await page.goto(path);
      const check = async () => {
        const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        expect(sw, `${path} scrollWidth`).toBeLessThanOrEqual(iw + 1);
      };
      await check(); // gleich nach dem Laden, während Intro und Einflug laufen
      await scrollThrough(page, check);
    }
  });
}

test("Schalter „Bewegung reduzieren“: speichert nur auf Klick, wirkt nach Neuladen, lässt sich zurücknehmen", async ({ page }) => {
  await page.goto("de/");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  const toggle = page.getByTestId("motion-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  expect(await page.evaluate(() => localStorage.getItem("bg-motion"))).toBe("reduce");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await expect(page.getByTestId("deck-intro")).toBeHidden();
  await page.getByTestId("motion-toggle").click();
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "reduce");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("Akzentwörter: kursives Serif, höchstens eins je Überschrift", async ({ page }) => {
  await page.goto("de/");
  await expect(page.locator("h1 em.accent")).toHaveText("zusammengehalten");
  await expect(page.locator("h1 em.accent")).toHaveCSS("font-style", "italic");
  const counts = await page.evaluate(() => [...document.querySelectorAll("h1, h2, h3")].map((h) => h.querySelectorAll("em.accent").length));
  expect(Math.max(...counts)).toBeLessThanOrEqual(1);
});

for (const [width, height] of [[1280, 720], [1920, 1080]]) {
  test(`Hero bei ${width}×${height}: Handy samt Karten ganz im sichtbaren Bereich`, async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "setzt die Größe selbst");
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" }); // Karten an ihrer Endposition
    await page.goto("de/");
    const box = await page.evaluate(() => {
      const els = [document.querySelector('[data-testid="hero-phone"] .sc-phone')!, ...document.querySelectorAll('[data-testid="hero-cards"] .sc-fly')];
      const rects = els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
    });
    expect(box.top).toBeGreaterThanOrEqual(64); // unter der Navigation
    expect(box.bottom).toBeLessThanOrEqual(height);
  });
}

test("Nichts hält das Scrollen an: kein sticky oder fixed in den Showcase-Bereichen", async ({ page }) => {
  await page.goto("de/#vorschau"); // ohne DJ-Pult-Vorhang
  await scrollThrough(page);
  const pinned = await page.evaluate(() => {
    const areas = document.querySelectorAll('[data-testid="hero-showcase"], [data-testid="orbit-scene"], [data-testid="try-section"], [data-testid="city-motion"]');
    const hits: string[] = [];
    areas.forEach((a) => [a, ...a.querySelectorAll("*")].forEach((el) => {
      const pos = getComputedStyle(el).position;
      if (pos === "sticky" || pos === "fixed") hits.push(`${el.tagName}.${(el as HTMLElement).className}`.slice(0, 80));
    }));
    return { areas: areas.length, hits };
  });
  expect(pinned).toEqual({ areas: 4, hits: [] });
});
