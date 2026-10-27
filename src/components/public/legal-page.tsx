import { Eyebrow } from "@/components/public/landing-bits";

export const COMPANY = {
  name: "Creative Connect UG (haftungsbeschränkt) i. G.",
  street: "Musterstraße 1",
  city: "10115 Berlin",
  email: "hallo@creative-connect.example",
  phone: "+49 30 0000000 (Demo)",
};

// Rechtstexte im Plakat-Look: große Headline, darunter volle Breite mit Meta-Spalte links
// und lesbarer Zeilenlänge für den Fließtext.
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro?: string; children: React.ReactNode }) {
  return (
    <article>
      <header className="gutter pt-16 pb-12 sm:pt-24 sm:pb-16">
        <Eyebrow>Rechtliches</Eyebrow>
        <h1 className="poster mt-8 text-[clamp(2.6rem,9vw,10rem)] break-words hyphens-auto text-balance">{title}</h1>
        <div className="mt-10 grid gap-6 border-t pt-6 lg:grid-cols-12 lg:gap-10">
          <p className="meta text-muted-foreground lg:col-span-3">Stand: {updated}</p>
          {intro && <p className="max-w-[62ch] text-base text-pretty text-muted-foreground sm:text-lg lg:col-span-9">{intro}</p>}
        </div>
      </header>
      <div role="note" className="gutter grid gap-2 bg-[var(--signal)] py-5 text-white sm:py-6 lg:grid-cols-12 lg:gap-10">
        <p className="meta lg:col-span-3">Hinweis zur Demo</p>
        <p className="max-w-[72ch] text-sm sm:text-base lg:col-span-9">
          <strong>Platzhalter – kein Rechtstext.</strong> Diese Seite gehört zur Klick-Demo und zeigt nur, welche Inhalte hier später stehen.
          Vor dem Start bitte durch eine Rechtsberatung erstellen lassen.
        </p>
      </div>
      <div className="gutter pt-4 pb-24 sm:pb-32 [counter-reset:legal]">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="grid scroll-mt-20 gap-4 border-b py-10 [counter-increment:legal] sm:py-12 lg:grid-cols-12 lg:gap-10"
      aria-labelledby={id ? `${id}-h` : undefined}
    >
      {/* laufende Nummer per CSS-Counter, damit die Seiten nichts durchzählen müssen */}
      <span aria-hidden className="meta text-primary before:content-[counter(legal,decimal-leading-zero)] lg:col-span-3" />
      <div className="min-w-0 lg:col-span-9">
        <h2 id={id ? `${id}-h` : undefined} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        <div className="mt-4 max-w-[68ch] space-y-3 text-base leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
          {children}
        </div>
      </div>
    </section>
  );
}

export function CompanyAddress() {
  return (
    <address className="not-italic">
      {COMPANY.name}<br />
      {COMPANY.street}<br />
      {COMPANY.city}<br />
      E-Mail: {COMPANY.email}
    </address>
  );
}
