import STOCK from "./stock-pool.json";

// Zentrale Bildquelle der Demo. Die Fotos liegen lokal unter public/stock/ (geladen mit scripts/download-stock.mjs),
// damit die Seite nicht von einem fremden Bilderdienst abhängt. Für den Livebetrieb: eigene Fotos hier einhängen.
// Seeds der Form "id:39" wählen ein festes Motiv; Avatare und Artist-Cover kommen aus dem Porträt-Pool
// (passend zum Vornamen im Seed, z. B. "cc-cover-thea-klein"), alle anderen Seeds landen stabil auf einer Szene.
// w/h bleiben in der Signatur, damit Aufrufer unverändert bleiben – die Dateien sind 1000 × 1000.

// next/image und <img> setzen den basePath (GitHub Pages) nicht selbst davor
const BASE = process.env.NEXT_PUBLIC_DEMO_BASE_PATH ?? "";
const FIXED: Record<string, string> = STOCK.fixed;
const HERO: Record<string, string> = STOCK.hero;
const FEMALE = new Set(STOCK.femaleNames);
const MALE = new Set(STOCK.maleNames);

function portraits(seed: string) {
  const first = seed.replace(/^avatar-/, "").replace(/^cc-(cover-)?/, "").split("-")[0].toLowerCase();
  if (FEMALE.has(first)) return STOCK.portraitF;
  if (MALE.has(first)) return STOCK.portraitM;
  return [...STOCK.portraitF, ...STOCK.portraitM];
}

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function stockImage(seed: string, _w = 1200, _h = 800) {
  const fixed = seed.startsWith("id:") ? FIXED[seed.slice(3)] : undefined;
  const list = /^(avatar-|cc-cover-)/.test(seed) ? portraits(seed) : STOCK.scene;
  return `${BASE}/stock/${fixed ?? list[hash(seed) % list.length]}.jpg`;
}

export function avatarImage(seed: string, size = 256) {
  return stockImage(`avatar-${seed}`, size, size);
}

// Großformatiges Motiv für den Hero (eigene Datei in hoher Auflösung)
export function stockPhoto(id: number, _w = 1200, _h = 800) {
  return HERO[id] ? `${BASE}/stock/hero-${HERO[id]}.jpg` : stockImage(`id:${id}`);
}
