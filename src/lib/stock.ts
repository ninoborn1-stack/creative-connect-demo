// Zentrale Bildquelle der Demo. Austauschbar (z. B. Unsplash-API oder eigener CDN) – nur hier ändern.
export function stockImage(seed: string, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function avatarImage(seed: string, size = 256) {
  return stockImage(`avatar-${seed}`, size, size);
}
