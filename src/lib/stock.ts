// Zentrale Bildquelle der Demo. Austauschbar (z. B. Unsplash-API oder eigener CDN) – nur hier ändern.
// Seeds der Form "id:123" wählen ein festes Motiv statt eines zufälligen.
export function stockImage(seed: string, w = 1200, h = 800) {
  if (seed.startsWith("id:")) return `https://picsum.photos/id/${seed.slice(3)}/${w}/${h}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function avatarImage(seed: string, size = 256) {
  return stockImage(`avatar-${seed}`, size, size);
}

// Fest ausgewähltes Stock-Motiv (statt zufälligem Seed), z. B. für den Hero
export function stockPhoto(id: number, w = 1200, h = 800) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}
