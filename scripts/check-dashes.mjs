#!/usr/bin/env node
// Prüft, dass in Quelltext und Ausgabe keine Gedankenstriche (U+2013 und U+2014) stehen.
// Durchsucht src/ und die Textdateien in public/, nach einem Build zusätzlich out/ (Sitemap, Manifest, robots, HTML).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = /\.(tsx?|mjs|css|json|md|svg|xml|txt|webmanifest|html)$/;
const DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"); // Halbgeviert- und Geviertstrich
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "_next") walk(p); // gebündelte Bibliotheken nicht prüfen, nur eigene Ausgabe
    } else if (TEXT.test(name)) {
      readFileSync(p, "utf8").split("\n").forEach((line, i) => DASH.test(line) && hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${line.trim().slice(0, 100)}`));
    }
  }
}
for (const dir of ["src", "public", "out"]) if (existsSync(path.join(ROOT, dir))) walk(path.join(ROOT, dir));

if (hits.length) {
  console.error(`Gedankenstriche gefunden (${hits.length}):\n` + hits.join("\n"));
  process.exit(1);
}
console.log("Keine Gedankenstriche in src/, public/ und out/.");
