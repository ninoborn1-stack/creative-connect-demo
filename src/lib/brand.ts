// Zentrale Marken- und Link-Daten der Marketing-Seite. Name, Farben, Store-Links, Formular-Ziele und
// Firmenangaben werden nur hier gepflegt – alle Seiten lesen von hier.
// Alles mit PLATZHALTER im Kommentar muss vor dem Livegang ersetzt werden (Liste auch im README).

export const APP_NAME = "Bubblegum"; // Arbeitstitel – zentral austauschbar

// Farbwelt (siehe docs/design-konzept.md). Die CSS-Tokens in src/app/globals.css nutzen dieselben Werte.
export const COLORS = {
  egyptianBlue: "#03203D",
  stoneBlue: "#639CC5",
  scarlet: "#EB2F33",
} as const;

// Öffentliche Adresse der Marketing-Seite (für canonical/hreflang/Open Graph), ohne Schrägstrich am Ende.
// Beim Build über SITE_URL überschreibbar, z. B. https://ninoborn1-stack.github.io/creative-connect-demo
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bubblegum.example").replace(/\/+$/, ""); // PLATZHALTER-Domain

export const LINKS = {
  appStore: "https://apps.apple.com/app/id0000000000", // PLATZHALTER
  playStore: "https://play.google.com/store/apps/details?id=com.example.app", // PLATZHALTER
  webApp: "https://app.example.com", // PLATZHALTER – Web-App aus dem Monorepo
  apply: "https://app.example.com/bewerben", // PLATZHALTER – Bewerbung führt in die App
  instagram: "https://www.instagram.com/", // PLATZHALTER
} as const;

// Warteliste/Newsletter: Brevo-Formular mit Double-Opt-in (in Brevo unter „Formulare“ angelegt).
// Die Seite schickt das Formular direkt an Brevo – kein eigener Server nötig.
export const NEWSLETTER = {
  brevoFormAction: "", // PLATZHALTER – z. B. "https://xxxx.sibforms.com/serve/MUIF…"; leer = Formular zeigt Hinweis statt abzuschicken
  emailField: "EMAIL",
  localeField: "LOCALE", // optionales Brevo-Attribut für die Sprache
} as const;

// Reichweitenmessung: aus. Erst wenn hier etwas eingetragen wird, braucht die Seite eine Cookie-Einwilligung.
export const ANALYTICS: null | { provider: string } = null;

export const COMPANY = {
  name: "ThreeApesGroup", // PLATZHALTER – vollständige Firmierung mit Rechtsform
  street: "Musterstraße 1", // PLATZHALTER
  city: "10115 Berlin", // PLATZHALTER
  country: "Deutschland",
  representative: "Vertretungsberechtigte Person", // PLATZHALTER
  register: "Registergericht und -nummer", // PLATZHALTER
  vatId: "USt-IdNr.", // PLATZHALTER
  email: "hallo@example.com", // PLATZHALTER
  pressEmail: "presse@example.com", // PLATZHALTER
  phone: "+49 30 0000000", // PLATZHALTER
} as const;
