import { expect, test } from "@playwright/test";
import { PAGES_BY_LANG } from "./pages";

// Alle Seiten in DE und EN auf allen Zielbreiten: kein horizontales Überlaufen (auch während Animationen und nach
// dem Scrollen), unter 768 px keine Touch-Ziele kleiner als 44 × 44 px.
// Ausgenommen vom Touch-Check: Links mitten im Fließtext (WCAG 2.5.8), nur für Screenreader Sichtbares, die simulierte
// Handy-Oberfläche der Vorschau und die 3D-Szene der Explosionsansicht (dort gibt es die Liste darunter).
const SIZES = [[320, 700], [360, 740], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [844, 390], [1180, 820]] as const;
const PAGES = (["de", "en"] as const).flatMap((l) => PAGES_BY_LANG[l].map((p) => `${l}/${p}`)).concat(["gibt-es-nicht/"]);

test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "setzt Größen selbst"));

for (const path of PAGES) {
  test(`/${path}: responsiv auf allen Breiten`, async ({ page }) => {
    test.setTimeout(180_000);
    const problems: string[] = [];
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(path);
      const overflow = async (when: string) => {
        const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        if (sw > iw + 1) problems.push(`${w}×${h} ${when}: Seite ${sw} px breit`);
      };
      await overflow("nach dem Laden");
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < total; y += Math.round(h * 1.5)) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(60);
        await overflow(`bei ${y} px`);
      }
      if (w < 768) {
        const small = await page.evaluate(() => {
          const out: string[] = [];
          const els = document.querySelectorAll<HTMLElement>("a, button, input:not([type=hidden]), select, textarea, summary, [role=button]");
          for (const el of els) {
            if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue;
            if (el.closest('[aria-hidden="true"], .sr-only, [data-testid="preview"], .sc-layers-stage, [data-intro]')) continue;
            const parentText = (el.parentElement?.textContent ?? "").trim().length;
            const inSentence = getComputedStyle(el).display === "inline" && parentText > (el.textContent ?? "").trim().length + 3;
            if (el.tagName === "A" && inSentence) continue;
            const box = (el.matches("input[type=checkbox], input[type=radio]") ? el.closest("label") ?? el : el).getBoundingClientRect();
            if (box.width === 0 || box.height === 0) continue;
            if (box.width < 43.5 || box.height < 43.5) out.push(`${el.tagName.toLowerCase()} „${(el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().slice(0, 30)}“ ${Math.round(box.width)}×${Math.round(box.height)}`);
          }
          return out;
        });
        for (const s of small) problems.push(`${w}×${h} Touch-Ziel: ${s}`);
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });
}
