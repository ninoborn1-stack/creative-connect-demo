#!/usr/bin/env node
// Erzeugt aus assets/photos/*.jpg responsive AVIF- und WebP-Dateien unter public/img/ plus ein kleines Manifest
// (src/lib/images.json mit Breiten und Seitenverhältnis). Läuft automatisch vor dem Build (prebuild).
// Vorhandene Dateien werden übersprungen, zum Neuerzeugen public/img löschen.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets", "photos");
const OUT = path.join(ROOT, "public", "img");
mkdirSync(OUT, { recursive: true });

// Hero läuft über die volle Breite, alles andere höchstens halb so breit
const WIDTHS = { hero: [828, 1600, 2400], default: [480, 720, 960] };
const manifest = {};

for (const file of readdirSync(SRC).filter((f) => f.endsWith(".jpg")).sort()) {
  const name = file.replace(/\.jpg$/, "");
  const input = sharp(path.join(SRC, file));
  const { width, height } = await input.metadata();
  const widths = (WIDTHS[name] ?? WIDTHS.default).filter((w) => w <= width);
  for (const w of widths) {
    for (const [ext, opts] of [["avif", { quality: 50 }], ["webp", { quality: 72 }]]) {
      const target = path.join(OUT, `${name}-${w}.${ext}`);
      if (!existsSync(target)) await sharp(path.join(SRC, file)).resize({ width: w })[ext](opts).toFile(target);
    }
  }
  manifest[name] = { widths, ratio: Number((width / height).toFixed(4)) };
}

writeFileSync(path.join(ROOT, "src", "lib", "images.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Bilder: ${Object.keys(manifest).length} Motive → public/img`);
