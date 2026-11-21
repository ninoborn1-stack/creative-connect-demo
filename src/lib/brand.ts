// Zentrale Marken- und Link-Daten der Marketing-Seite. Name, Farben, Store-Links, Formular-Ziele und
// Firmenangaben werden nur hier gepflegt, alle Seiten lesen von hier.
// Alles mit PLATZHALTER im Kommentar muss vor dem Livegang ersetzt werden (Liste auch im README).

export const APP_NAME = "Bubblegum"; // Arbeitstitel, zentral austauschbar

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
  appStore: "", // PLATZHALTER, z. B. "https://apps.apple.com/app/id…"
  playStore: "", // PLATZHALTER, z. B. "https://play.google.com/store/apps/details?id=…"
  webApp: "", // PLATZHALTER, Web-App aus dem Monorepo
  apply: "", // PLATZHALTER, Bewerbung in der App; leer = Warteliste
} as const;

// Formulare über Brevo (Free-Plan, Double-Opt-in), je Formular und Sprache eine eigene Brevo-Formular-Adresse.
// Einrichtung Schritt für Schritt: docs/brevo-setup.md. Dort aus dem Einbettungscode jedes Formulars die
// action-URL (https://….sibforms.com/serve/…) kopieren und hier eintragen.
// Leer = Formular sichtbar, Absenden zeigt „Öffnet in Kürze“ (kein Fehler).
export const BREVO = {
  waitlist: {
    de: "https://84f491e4.sibforms.com/serve/MUIFAMUld2IfxBsn6cAyBqJjK1Z8oZ2kwva8L7y5BALNEKSJ1SLDUbzsjwac5_bGuZngot-mT64QnPbTgG03dC8HMQUTaQ3UzaHkV36XtFi7p8NWT8YFkJ2abp8o7h3gCIwO9wsz6qAquEYbGNcGYJJW8eep7LEUepklsCxPJEG8Sj32Tn8W2aGMBYeUwzxu9mDJgs3l9vKbmVgl9Q==",
    en: "https://84f491e4.sibforms.com/serve/MUIFAFoMJevjJ1W8QHv1okIgQQ_KEv15yOUa6cNRelg-PTKTW9S-srodSL9JRDAkvWRyjd2_6AFDz2wQ5jDKKxn3vEGsHaSBDSOBHM9vuL3Ea2283bKFE-ctsGyRYbLgaX6ZfnG0yDH-gHk8ZYetFS0TnOHry89iG4vEf1sp1ayvsfReDdxQZ_dczwxDBTeACQRkIJM53K99ip83nw==",
  },
  backstage: {
    de: "https://84f491e4.sibforms.com/serve/MUIFAATuZ9W4vQsPMBlQkzAuzIZdVT9NgEPd7PMBWzNFWChOaYiKa9d1Wi7NGsI1XJXwGGByNx0afLlBbJaaCIAxBGvBUQTVuHHZdI8faCZtK9yvc4ZpeNAdl0I5PmVmIuXj2iroeiqZXQt9fvJ258g0IIl_MGdLGGRNEtf934Ka6WwH-zNJN4UX2r1LY2iMTBfOGHwK8GeCP28D2A==",
    en: "https://84f491e4.sibforms.com/serve/MUIFAPzra0ZQ5Dy4WcxBFRDJTKqYV15W2CSfslDRJysLwfEQO5Qr7FgXLrM4dcL5fN0Akrj1EsM7p5SK3LttAfnZe4CzRD1E4ifpvR4-3zfZrVB-CaCGVhH7gJQa_T-iZKGGjjYPA3hh6swuoTYWEjyRFWmJGlmrTRMoCU235Rp9Zmv00Y6Ut7eNB1qpN2K6nQMRS_k7ELvbsQce4g==",
  },
} as const;

// Feldnamen genau wie im Brevo-Einbettungscode: EMAIL, Kontaktattribute in Großbuchstaben,
// dazu „locale“ und das Brevo-Honeypot-Feld „email_address_check“ (muss leer bleiben).
export const BREVO_FIELDS = {
  email: "EMAIL", role: "ROLLE", city: "STADT", language: "SPRACHE", source: "QUELLE",
  name: "NAME", artistName: "KUENSTLERNAME", country: "LAND", links: "LINKS", referredBy: "EMPFOHLEN_VON", message: "NACHRICHT",
  brevoHoneypot: "email_address_check", locale: "locale",
} as const;

// Reichweitenmessung: aus. Die Seite setzt keine Cookies und lädt nichts von Dritten, deshalb kein Cookie-Banner.
// Erst wenn hier etwas eingetragen wird, braucht die Seite eine Einwilligung (Banner) und einen Datenschutz-Abschnitt.
export const ANALYTICS: null | { provider: string } = null;

// Betreiberdaten. Impressum, Datenschutz, Footer, Presse und strukturierte Daten lesen nur von hier.
// Ein Test (e2e/legal.spec.ts) und scripts/check-legal.mjs schlagen fehl, solange hier „<<“ oder „<Datum“ steht.
export const LEGAL = {
  owner: "Nino Bornhäußer", // Inhaber (Einzelunternehmen: voller Name Pflicht)
  company: "ThreeApesGroup", // Geschäftsbezeichnung
  legalForm: "Einzelunternehmen",
  street: "Am Schlachtensee 122A",
  zip: "14129",
  city: "Berlin",
  country: "Deutschland",
  email: "nino@threeapesgroup.com",
  phone: "+49 163 8699289", // zweiter schneller Kontaktweg, im Impressum als tel:-Link
  vatId: null as string | null, // USt-IdNr. folgt; die Zeile im Impressum erscheint automatisch, sobald sie gesetzt ist
  supervisoryAuthority: {
    name: "Berliner Beauftragte für Datenschutz und Informationsfreiheit",
    url: "https://www.datenschutz-berlin.de",
  },
  lastUpdated: "2026-11-21", // Stand der Rechtstexte (JJJJ-MM-TT), bei jeder inhaltlichen Änderung anpassen
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
