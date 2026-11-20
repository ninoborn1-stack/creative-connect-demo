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

// Externe Ziele. Leer = noch nicht verfügbar: Store-Buttons führen dann zur Warteliste („Bald verfügbar“),
// es gibt keine toten Links. Sobald eine URL eingetragen ist, zeigt die Seite den echten Link.
export const LINKS = {
  appStore: "", // PLATZHALTER – z. B. "https://apps.apple.com/app/id…"
  playStore: "", // PLATZHALTER – z. B. "https://play.google.com/store/apps/details?id=…"
  webApp: "", // PLATZHALTER – Web-App aus dem Monorepo
  apply: "", // PLATZHALTER – Bewerbung in der App; leer = Warteliste
} as const;

// Warteliste/Newsletter über Brevo (Free-Plan, Double-Opt-in). In Brevo unter „Kontakte → Formulare“ ein
// Anmeldeformular mit Double-Opt-in anlegen, unter „Teilen → HTML-Code“ die action-URL des <form> kopieren
// (https://….sibforms.com/serve/…) und hier eintragen. Leer = Formular sichtbar, Absenden zeigt „öffnet in Kürze“.
// Die Feldnamen müssen zu den Kontaktattributen in Brevo passen (siehe README, Abschnitt Warteliste).
export const WAITLIST = {
  waitlistFormUrl: "", // PLATZHALTER
  fields: { email: "EMAIL", role: "ROLLE", city: "STADT", locale: "SPRACHE", honeypot: "email_address_check" },
} as const;

// Reichweitenmessung: aus. Die Seite setzt keine Cookies und lädt nichts von Dritten – deshalb kein Cookie-Banner.
// Erst wenn hier etwas eingetragen wird, braucht die Seite eine Einwilligung (Banner) und einen Datenschutz-Abschnitt.
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
