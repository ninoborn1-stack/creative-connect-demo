// Ausbaustufe 1 (Start): drei Funktionen für alle – Paket buchen, Artist finden & anfragen, sich als Artist anbieten –
// plus Profil, einfaches Dashboard und Punkte. Alles andere bleibt im Code und wird hier Schritt für Schritt freigeschaltet
// (true = sichtbar in Navigation, Dashboard und auf den öffentlichen Seiten). Die Routen selbst bleiben erreichbar.
export const FEATURES = {
  ausschreibungen: false,
  musik: true, // Ausbaustufe 2: Musik & Stock – Werke anhören/ansehen und Nutzung beim Artist anfragen
  lizenzen: true, // Ausbaustufe 2: lizenzfrei nutzen – Werk direkt lizenzieren (einmal zahlen), mit Zertifikat
  unternehmen: false,
  netzwerk: false,
  briefing: false,
  studios: true, // Ausbaustufe 2: Studios & Locations stunden- oder tageweise buchen, eigene Räume anbieten
  finanzen: false,
  sessions: false,
  entdecken: true, // Ausbaustufe 2: App-Ansicht mit Swipe (merken/weiter) und Feed über Artists, Werke, Pakete, Studios
  feed: false,
  events: false,
  wissen: false,
  equipment: false,
  einladen: false,
  branchen: false,
} as const;

export type Feature = keyof typeof FEATURES;

export function isOn(feature?: Feature) {
  return !feature || FEATURES[feature];
}

// „Bald verfügbar“ – was als Nächstes kommt (Reihenfolge = Fahrplan)
export const ROADMAP: { feature: Feature | "app"; label: string; text: string }[] = [
  { feature: "ausschreibungen", label: "Ausschreibungen", text: "Projekt posten, Pitches von Artists bekommen" },
];

// Nesto (Gründer) steht in Artist-Listen bei Standard-Sortierung auf Platz 3 – sichtbar, aber nicht aufdringlich.
// Offen ausgewiesen in den AGB (Ranking-Kriterien).
export function placeFounder<T>(list: T[], isFounder: (item: T) => boolean, slot = 2) {
  const i = list.findIndex(isFounder);
  if (i < 0 || i === slot) return list;
  const rest = list.filter((_, j) => j !== i);
  return [...rest.slice(0, slot), list[i], ...rest.slice(slot)];
}
