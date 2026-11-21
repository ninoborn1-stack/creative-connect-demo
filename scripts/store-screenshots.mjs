// Store-Screenshots aus den Feature-Tafeln der Startseite (components/showcase/feature-panels.tsx).
// Vorbereitet für später: Sobald die Screens aus der echten App kommen, liefert dieses Skript die Bilder in den
// Größen der Stores. Jede Tafel (data-store-panel) wird einzeln und ohne Animation fotografiert.
//
//   pnpm build && pnpm serve &        (oder eine andere laufende Seite)
//   pnpm screenshots:store [basis-url]   → docs/store-screenshots/<sprache>/<größe>/<tafel>.png
//
// Größen: iPhone 6,9" (1320 × 2868, App Store Pflichtgröße) und Android Phone (1080 × 2340, 9 : 19,5).
// Die Tafel hat das Seitenverhältnis 9 : 19,5; das Skript setzt sie auf eine ganzzahlige CSS-Größe und skaliert
// über deviceScaleFactor exakt auf die Zielgröße.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = (process.argv[2] || "http://localhost:4300").replace(/\/+$/, "");
const SIZES = [
  { name: "iphone-6.9", width: 1320, height: 2868, scale: 4 }, // Tafel 330 × 717 CSS-Pixel
  { name: "android-phone", width: 1080, height: 2340, scale: 3 }, // Tafel 360 × 780 CSS-Pixel
];

const browser = await chromium.launch();
for (const lang of ["de", "en"]) {
  for (const size of SIZES) {
    const { scale } = size;
    const cssW = size.width / scale, cssH = size.height / scale; // ganzzahlig, damit die Pixelmaße exakt stimmen
    const page = await browser.newPage({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: scale, reducedMotion: "reduce" });
    await page.goto(`${base}/${lang}/`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: `.sc-panel-item{width:${cssW}px!important;height:${cssH}px!important;aspect-ratio:auto!important;transform:none!important;opacity:1!important}.sc-panel-inner{border-radius:0!important}` });
    const dir = `docs/store-screenshots/${lang}/${size.name}`;
    mkdirSync(dir, { recursive: true });
    for (const panel of await page.locator("[data-store-panel]").all()) {
      const key = await panel.getAttribute("data-store-panel");
      await panel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      // exakter Ausschnitt (Element-Screenshots runden Subpixel-Positionen auf und werden sonst 1 px zu groß)
      const box = await panel.boundingBox();
      await page.screenshot({ path: `${dir}/${key}.png`, animations: "disabled", clip: { x: Math.round(box.x), y: Math.round(box.y), width: cssW, height: cssH } });
      console.log(`${dir}/${key}.png`);
    }
    await page.close();
  }
}
await browser.close();
