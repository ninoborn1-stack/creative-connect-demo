#!/usr/bin/env node
// Erzeugt Favicon, App-Icons und Social-Share-Bilder (Open Graph/Twitter) im Bubblegum-Design als PNG/SVG
// nach public/icons und public/og. Die Dateien sind versioniert – nach einer Namens- oder Farbänderung
// in src/lib/brand.ts einmal neu erzeugen: pnpm brand-assets
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = readFileSync(path.join(ROOT, "src/lib/brand.ts"), "utf8");
const pick = (re, fallback) => brand.match(re)?.[1] ?? fallback;
const NAME = pick(/APP_NAME = "([^"]+)"/, "Bubblegum");
const BLUE = pick(/egyptianBlue: "([^"]+)"/, "#03203D");
const STONE = pick(/stoneBlue: "([^"]+)"/, "#639CC5");
const RED = pick(/scarlet: "([^"]+)"/, "#EB2F33");
const INK = "#000F26";
const BONE = "#EFF4F8";

mkdirSync(path.join(ROOT, "public/icons"), { recursive: true });
mkdirSync(path.join(ROOT, "public/og"), { recursive: true });

// Bildmarke (Platzhalter): Kaugummiblase mit Glanzpunkt auf Scarlet
const icon = (size, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" rx="${radius}" fill="${RED}"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="${BONE}" stroke-width="48"/>
  <circle cx="206" cy="206" r="34" fill="${BONE}"/>
</svg>`;
writeFileSync(path.join(ROOT, "public/icons/icon.svg"), icon(512, 112));
for (const [file, size, radius] of [["icon-192.png", 192, 112], ["icon-512.png", 512, 112], ["apple-touch-icon.png", 180, 0], ["favicon-32.png", 32, 112], ["maskable-512.png", 512, 0]]) {
  await sharp(Buffer.from(icon(size, radius))).png().toFile(path.join(ROOT, "public/icons", file));
}

// Social-Share-Bild 1200 × 630 je Sprache
const og = (claim, sub) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  <rect x="0" y="560" width="1200" height="70" fill="${STONE}"/>
  <rect x="80" y="86" width="18" height="18" fill="${RED}"/>
  <text x="114" y="104" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="24" letter-spacing="4" fill="${STONE}">${sub.toUpperCase()}</text>
  <g transform="translate(76 330) scale(0.72 1)">
    <text font-family="'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="900" font-size="200" letter-spacing="-4" fill="${BONE}">${NAME.toUpperCase().slice(0, -1)}<tspan fill="${RED}">${NAME.toUpperCase().slice(-1)}</tspan></text>
  </g>
  <text x="80" y="440" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="700" font-size="54" fill="${BONE}">${claim}</text>
  <text x="80" y="606" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="24" letter-spacing="4" fill="${BLUE}">ARTISTS · EVENTS · MUSIK · STUDIOS</text>
</svg>`;
await sharp(Buffer.from(og("Swipe dich durch die Szene.", "Die Szene, zusammengehalten."))).png().toFile(path.join(ROOT, "public/og/og-de.png"));
await sharp(Buffer.from(og("Swipe through the scene.", "The glue of the scene."))).png().toFile(path.join(ROOT, "public/og/og-en.png"));
console.log(`Marken-Assets für „${NAME}“ erzeugt: public/icons, public/og`);
