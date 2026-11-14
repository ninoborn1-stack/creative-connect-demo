#!/usr/bin/env node
// Lädt die Stock-Fotos der Demo einmalig nach public/stock/, damit die Seite nicht von einem fremden
// Bilderdienst abhängt (picsum.photos war zeitweise nicht erreichbar → leere Bildflächen beim Kunden).
// Quelle: Unsplash-CDN (Unsplash-Lizenz, frei nutzbar). Auswahl in src/lib/stock-pool.json.
// Aufruf: node scripts/download-stock.mjs   (vorhandene Dateien werden übersprungen)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "stock");
const pool = JSON.parse(readFileSync(path.join(ROOT, "src", "lib", "stock-pool.json"), "utf8"));
mkdirSync(OUT, { recursive: true });

const url = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&fm=jpg`;
const square = new Set([...Object.values(pool.fixed), ...pool.scene, ...pool.portraitF, ...pool.portraitM]);
const jobs = [
  ...[...square].map((id) => ({ file: `${id}.jpg`, url: url(id, 1000, 1000) })),
  ...Object.values(pool.hero).map((id) => ({ file: `hero-${id}.jpg`, url: url(id, 2400, 1600) })),
];

let failed = 0;
for (const job of jobs) {
  const target = path.join(OUT, job.file);
  if (existsSync(target)) continue;
  try {
    const res = await fetch(job.url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    console.log("✓", job.file);
  } catch (e) {
    failed++;
    console.log("✗", job.file, e.message);
  }
}
console.log(failed ? `${failed} Bilder fehlen – Skript erneut starten.` : "Alle Bilder vorhanden.");
process.exit(failed ? 1 : 0);
