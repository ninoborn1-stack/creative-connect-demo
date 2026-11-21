// Platzhalter-Check für die Betreiberdaten: bricht den Build ab, solange im Block LEGAL in src/lib/brand.ts
// noch „<<“ oder „<Datum“ steht oder lastUpdated kein gültiges Datum ist. vatId: null ist erlaubt.
// Läuft vor jedem Build (prebuild) und in e2e/legal.spec.ts.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/brand.ts", import.meta.url), "utf8");
const start = src.indexOf("export const LEGAL = {");
const end = src.indexOf("} as const;", start);
if (start < 0 || end < 0) fail("Block LEGAL in src/lib/brand.ts nicht gefunden.");
const block = src.slice(start, end);
// Kommentare ignorieren, nur Werte prüfen
const values = block.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
const bad = values.split("\n").filter((l) => l.includes("<<") || l.includes("<Datum"));
if (bad.length) fail(`Platzhalter in LEGAL:\n${bad.map((l) => `  ${l.trim()}`).join("\n")}`);
const date = values.match(/lastUpdated:\s*"(\d{4}-\d{2}-\d{2})"/);
if (!date || Number.isNaN(Date.parse(date[1]))) fail("LEGAL.lastUpdated fehlt oder ist kein Datum im Format JJJJ-MM-TT.");
for (const key of ["owner", "street", "zip", "city", "email"]) {
  if (!new RegExp(`${key}:\\s*"[^"]+"`).test(values)) fail(`LEGAL.${key} ist leer.`);
}
console.log(`LEGAL ok (Stand ${date[1]}).`);

function fail(msg) {
  console.error(`check-legal: ${msg}`);
  process.exit(1);
}
