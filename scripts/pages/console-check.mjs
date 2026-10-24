#!/usr/bin/env node
// Klickt den statischen Export einmal durch und meldet Browser-Konsolenfehler, Seitenfehler und fehlgeschlagene
// Requests. Voraussetzung: pnpm build:pages und ein laufender Server (pnpm pages:serve).
// Aufruf: PAGES_BASE_PATH=/creative-connect-demo node scripts/pages/console-check.mjs [port]
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = (process.env.PAGES_BASE_PATH ?? "").replace(/\/+$/, "");
const origin = `http://localhost:${process.argv[2] ?? 4100}`;
const B = origin + base;

// alle exportierten Seiten (out/**/*.html)
function htmlPages(dir, prefix = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "_next") out.push(...htmlPages(p, `${prefix}/${name}`));
    } else if (name.endsWith(".html") && name !== "index.html" && !["404.html", "_not-found.html"].includes(name)) {
      out.push(`${prefix}/${name.replace(/\.html$/, "")}`);
    }
  }
  return out;
}
const all = ["/", ...htmlPages(path.join(ROOT, "out"))].filter((p) => !p.includes("__demo"));
const isAdmin = (p) => p.startsWith("/admin");
const isPublic = (p) => ["/", "/agb", "/datenschutz", "/impressum", "/ki-hinweis", "/login", "/passwort-vergessen", "/registrieren", "/verzeichnis", "/warteliste"].includes(p) || p.startsWith("/invite/");

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "de-DE", timezoneId: "Europe/Berlin", acceptDownloads: true });
const page = await context.newPage();
const problems = [];
let where = "";
// Erwartet: Seiten zu im Browser angelegten Datensätzen gibt es nicht als Datei → GitHub Pages liefert 404.html
// (Status 404), die Seite wird im Browser gerendert. Diese Dokument-404 werden nur als Info gezählt.
const fallbackDocs = new Set();
const infos = [];
page.on("console", (m) => {
  if (m.type() !== "error" && m.type() !== "warning") return;
  if (fallbackDocs.has(m.location()?.url) && m.text().startsWith("Failed to load resource")) return;
  problems.push(`[console.${m.type()}] ${m.text()}  ${m.location()?.url ?? ""} (${where})`);
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message}  (${where})`));
page.on("response", (r) => {
  if (r.status() < 400) return;
  if (r.status() === 404 && r.request().resourceType() === "document") {
    fallbackDocs.add(r.url());
    infos.push(`[404.html-Fallback] ${r.url().replace(origin, "")}  (${where})`);
    return;
  }
  problems.push(`[http ${r.status()}] ${r.url().replace(origin, "")}  (${where})`);
});

async function visit(p) {
  where = p;
  await page.goto(B + p);
  // fertig, sobald kein Lade-Skeleton der Demo mehr sichtbar ist
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"]') && document.querySelector("main, h1"), null, { timeout: 15_000 })
    .catch(() => problems.push(`[lädt nicht fertig] ${p}`));
  await page.waitForTimeout(300);
}

async function login(email) {
  where = `login ${email}`;
  await page.goto(`${B}/login`);
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.waitForURL(/\/(dashboard|admin|onboarding)/);
}

async function download(p, linkName) {
  await visit(p);
  where = `${p} → Download ${linkName}`;
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20_000 }), page.getByRole("link", { name: linkName }).first().click()]);
  console.log(`  Download ok: ${dl.suggestedFilename()}`);
}

async function downloadHref(p, href) {
  await visit(p);
  where = `${p} → Download ${href}`;
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20_000 }), page.locator(`a[href="${base}${href}"]`).first().click()]);
  console.log(`  Download ok: ${dl.suggestedFilename()}`);
}

console.log(`Prüfe ${all.length} Seiten unter ${B}/`);
for (const p of all.filter(isPublic)) await visit(p);

await login("kreativ@demo.cc");
for (const p of all.filter((p) => !isPublic(p) && !isAdmin(p))) await visit(p);

await login("kunde@demo.cc");
await download("/finanzen", /KSK-Jahresübersicht|CSV/i).catch((e) => problems.push(`[download] KSK-CSV: ${e.message}`));
await download("/finanzen", /als PDF herunterladen/).catch((e) => problems.push(`[download] Rechnung PDF: ${e.message}`));
// Briefing → neues Projekt (neue ID → 404.html-Fallback)
where = "briefing → projekt";
await page.goto(`${B}/briefing`);
await page.getByRole("button", { name: "Musikvideo für Single-Release" }).click();
await page.getByTestId("briefing-submit").click();
await page.getByTestId("create-project").click();
await page.waitForURL(/\/projekte\/[^/?]+/);
await page.getByTestId("simulate-accept-all").click();
await page.getByTestId("column-bestaetigt").getByTestId("role-card").first().waitFor();
console.log(`  neues Projekt: ${page.url().replace(B, "")}`);
await page.getByRole("link", { name: "Projekte" }).first().click();
await page.waitForURL(/\/projekte$/);

// Rollenwechsler → Admin
where = "rollenwechsler";
await page.getByRole("combobox", { name: "Demo-Rolle wechseln" }).click();
await page.getByRole("option", { name: /Admin/ }).click();
await page.waitForURL(/\/admin$/);
for (const p of all.filter(isAdmin)) await visit(p);
await downloadHref("/admin/exporte", "/admin/exporte/dac7").catch((e) => problems.push(`[download] DAC7: ${e.message}`));
where = "reset";
await page.goto(`${B}/admin`);
await page.getByTestId("reset-demo").click();
await page.getByTestId("reset-demo-confirm").click();
await page.getByText("Demo zurückgesetzt").first().waitFor();

// Abmelden
where = "logout";
await page.getByRole("button", { name: "Abmelden" }).first().click();
await page.waitForURL((u) => u.pathname === `${base}/` || u.pathname === base);

await browser.close();
if (infos.length) console.log(`\nInfo (erwartet):\n${infos.join("\n")}`);
if (problems.length) {
  console.log(`\n${problems.length} Auffälligkeiten:\n` + problems.join("\n"));
  process.exit(1);
}
console.log("Keine Konsolenfehler.");
