// Datenfluss-Prüfung: lädt jede Seite in DE und EN, scrollt bis unten (damit die Handy-Vorschau und alle
// Bilder nachladen), spielt die Vorschau kurz an und listet danach alle Anfragen an fremde Hosts sowie
// Cookies, localStorage, sessionStorage und IndexedDB. Ergebnis als Markdown auf stdout.
//
//   node scripts/datenfluss.mjs https://ninoborn1-stack.github.io/creative-connect-demo > docs/legal/datenfluss-roh.md
//
// Formulare werden nicht abgeschickt.
import { chromium } from "@playwright/test";

const base = (process.argv[2] || "http://localhost:4300").replace(/\/+$/, "");
const own = new URL(base).host;
const PATHS = [
  "", "artists/", "veranstalter/", "unternehmen/", "backstage/", "download/", "warteliste/", "presse/",
].flatMap((p) => [`/de/${p}`, `/en/${p}`]).concat(["/de/impressum/", "/en/imprint/", "/de/datenschutz/", "/en/privacy/", "/de/bestaetigt/", "/en/confirmed/", "/gibt-es-nicht/"]);

const browser = await chromium.launch();
const rows = [];
for (const path of PATHS) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const foreign = new Set();
  let total = 0;
  page.on("request", (r) => {
    total++;
    const u = new URL(r.url());
    if (!["http:", "https:"].includes(u.protocol)) return;
    if (u.host !== own) foreign.add(`${r.method()} ${u.host}${u.pathname}`);
  });
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  // bis unten scrollen, damit Lazy-Inhalte laden
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  });
  // Handy-Vorschau anspielen (Ton, Tabs), falls vorhanden
  const preview = page.getByTestId("preview");
  if (await preview.count()) {
    await preview.scrollIntoViewIfNeeded();
    for (const btn of await preview.getByRole("navigation").getByRole("button").all()) await btn.click().catch(() => {});
    await preview.getByRole("button", { name: /Ton|Sound|Play|Abspielen/i }).first().click({ timeout: 1000 }).catch(() => {});
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage), session: Object.keys(sessionStorage),
    idb: indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : [],
  }));
  const cookies = (await context.cookies()).map((c) => `${c.domain} ${c.name}`);
  rows.push({ path, status: res?.status(), total, foreign: [...foreign], cookies, ...storage });
  await context.close();
}
await browser.close();

const list = (a) => (a.length ? a.join("<br>") : "keine");
console.log(`Gemessen am ${new Date().toISOString().slice(0, 10)} gegen \`${base}\` mit Chromium (Playwright).\n`);
console.log("| Seite | Status | Anfragen | Fremde Hosts | Cookies | localStorage | sessionStorage | IndexedDB |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const r of rows) console.log(`| \`${r.path}\` | ${r.status} | ${r.total} | ${list(r.foreign)} | ${list(r.cookies)} | ${list(r.local)} | ${list(r.session)} | ${list(r.idb)} |`);
const anyForeign = rows.some((r) => r.foreign.length), anyStore = rows.some((r) => r.cookies.length || r.local.length || r.session.length || r.idb.length);
console.log(`\nErgebnis: ${anyForeign ? "Es gibt Anfragen an fremde Hosts." : "Keine Anfrage an fremde Hosts."} ${anyStore ? "Es wird etwas im Browser gespeichert." : "Nichts wird im Browser gespeichert."}`);
