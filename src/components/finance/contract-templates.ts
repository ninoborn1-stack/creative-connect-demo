// Vertragstexte der Demo-Vorlagen mit Platzhaltern ({{partyA}}, {{partyB}}, {{service}}, {{usageRights}},
// {{compensation}}, {{date}} …). Demo-Vorlagen, kein Rechtsrat.
import { CONTRACT_TEMPLATES } from "@/lib/constants";

export type ContractValues = Record<
  "title" | "partyA" | "partyB" | "service" | "usageRights" | "compensation" | "serviceFee" | "serviceFeePct" | "kskRate" | "date",
  string
>;

export interface ContractSection {
  heading: string;
  paragraphs: string[];
}

export const PLACEHOLDER_LABEL: Record<keyof ContractValues, string> = {
  title: "Vertragstitel",
  partyA: "Partei A (Auftraggeber:in)",
  partyB: "Partei B (Auftragnehmer:in)",
  service: "Leistung",
  usageRights: "Nutzungsrechte",
  compensation: "Vergütung netto",
  serviceFee: "Servicegebühr",
  serviceFeePct: "Servicegebühr-Satz",
  kskRate: "KSK-Satz",
  date: "Datum",
};

const LEISTUNG: Record<string, string[]> = {
  werkvertrag: [
    "{{partyB}} verpflichtet sich gegenüber {{partyA}} zur Herstellung folgenden Werks: {{service}}",
    "Der Werkerfolg ist geschuldet. Gestaltung, Arbeitsweise und Arbeitsmittel bestimmt {{partyB}} selbst; abgestimmte Termine und Abgabeformate sind im Projektraum dokumentiert.",
  ],
  nutzungsrechte: [
    "{{partyB}} erstellt für {{partyA}} Foto- und/oder Videoaufnahmen zu folgendem Vorhaben: {{service}}",
    "Bildauswahl, Bearbeitung und Look erfolgen nach dem gemeinsam abgestimmten Briefing; die künstlerische Umsetzung liegt bei {{partyB}}.",
  ],
  studiomiete: [
    "{{partyB}} überlässt {{partyA}} die Studioräume samt der im Profil gelisteten Ausstattung für folgendes Vorhaben: {{service}}",
    "{{partyA}} behandelt Räume und Technik pfleglich. Schäden sind unverzüglich zu melden; die Haftung richtet sich nach den gesetzlichen Vorschriften.",
  ],
  booking: [
    "{{partyB}} wirkt zu dem vereinbarten Termin an folgendem Vorhaben mit: {{service}}",
    "Ablauf, Spielzeit bzw. Drehzeit und technische Anforderungen (Rider) werden spätestens sieben Tage vorher im Projektraum abgestimmt.",
  ],
};

const RECHTE: Record<string, string[]> = {
  werkvertrag: ["Nutzungsrechte am Werk: {{usageRights}}.", "Das Recht auf Namensnennung (Credits) bleibt bei {{partyB}}."],
  nutzungsrechte: [
    "{{partyB}} räumt {{partyA}} folgende Nutzungsrechte ein: {{usageRights}}.",
    "Eine darüber hinausgehende Nutzung (z. B. Print, TV, andere Gebiete) bedarf einer gesonderten Vereinbarung und Vergütung. Das Urheberpersönlichkeitsrecht und das Recht auf Namensnennung bleiben unberührt.",
  ],
  studiomiete: [
    "Rechte an den im Studio entstandenen Aufnahmen: {{usageRights}}.",
    "{{partyB}} erwirbt durch die Überlassung keine Rechte an den Aufnahmen von {{partyA}}.",
  ],
  booking: [
    "Mitschnitte, Fotos und Videos der Mitwirkung: {{usageRights}}.",
    "Werbliche Nutzung von Name und Bild von {{partyB}} ist im Rahmen der Projektkommunikation gestattet.",
  ],
};

export function contractSections(template: string): ContractSection[] {
  return [
    { heading: "§ 1 Leistung", paragraphs: LEISTUNG[template] ?? LEISTUNG.werkvertrag },
    {
      heading: "§ 2 Vergütung",
      paragraphs: [
        "{{partyA}} zahlt an {{partyB}} eine Vergütung von {{compensation}} netto, zuzüglich gesetzlicher Umsatzsteuer, sofern {{partyB}} umsatzsteuerpflichtig ist.",
        "Creative Connect berechnet {{partyA}} zusätzlich eine Servicegebühr von {{serviceFeePct}} % ({{serviceFee}}), die separat ausgewiesen wird. {{partyB}} zahlt keine Provision und erhält das volle Honorar.",
      ],
    },
    { heading: "§ 3 Nutzungsrechte", paragraphs: RECHTE[template] ?? RECHTE.werkvertrag },
    {
      heading: "§ 4 Abnahme & Zahlung",
      paragraphs: [
        "Die Vergütung wird bei Vertragsschluss beim lizenzierten Zahlungsdienstleister reserviert. Das Geld liegt beim Zahlungsdienstleister, nicht bei Creative Connect.",
        "Nach Abnahme durch {{partyA}} im Projektraum wird die Zahlung freigegeben und an {{partyB}} ausgezahlt. Erfolgt innerhalb von 14 Tagen nach Abgabe weder Abnahme noch begründete Mängelrüge, gilt die Leistung als abgenommen. Bei Streitfällen vermittelt das Creative-Connect-Team.",
      ],
    },
    {
      heading: "§ 5 Selbstständigkeit",
      paragraphs: [
        "{{partyB}} handelt als selbstständige:r Unternehmer:in. Es besteht kein Arbeitsverhältnis. {{partyB}} ist bei der Ausführung weisungsfrei, setzt Preise selbst fest, kann Aufträge frei ablehnen und für weitere Auftraggeber:innen tätig sein.",
      ],
    },
    {
      heading: "§ 6 Künstlersozialabgabe",
      paragraphs: [
        "Hinweis: Auf Honorare an selbstständige Künstler:innen und Publizist:innen kann für {{partyA}} eine Künstlersozialabgabe anfallen (Satz 2026: {{kskRate}} %). Die Meldung an die Künstlersozialkasse obliegt {{partyA}}.",
      ],
    },
  ];
}

export function templateTitle(template: string) {
  return CONTRACT_TEMPLATES[template]?.title ?? "Vertrag";
}

// Zerlegt einen Text in Literal- und Platzhalter-Teile
export function splitPlaceholders(text: string): { text: string; key?: keyof ContractValues }[] {
  const parts: { text: string; key?: keyof ContractValues }[] = [];
  const re = /\{\{(\w+)\}\}/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[0], key: m[1] as keyof ContractValues });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
