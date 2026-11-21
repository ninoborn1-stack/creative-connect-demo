import { Fragment } from "react";

// Überschrift mit höchstens einem kursiven Akzentwort: „Die Szene, *zusammengehalten*.“ → <em class="accent">.
// Das Akzentwort ist Instrument Serif Italic (siehe layout.tsx), der Rest bleibt im Plakat-Look.
export function Accent({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/);
  return <>{parts.map((p, i) => (i % 2 ? <em key={i} className="accent">{p}</em> : <Fragment key={i}>{p}</Fragment>))}</>;
}

// Für Stellen ohne Markup (aria-label, title): Sternchen entfernen
export const plain = (text: string) => text.replace(/\*/g, "");
