import { FileWarning } from "lucide-react";

export const COMPANY = {
  name: "Creative Connect UG (haftungsbeschränkt) i. G.",
  street: "Musterstraße 1",
  city: "10115 Berlin",
  email: "hallo@creative-connect.example",
  phone: "+49 30 0000000 (Demo)",
};

export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Rechtliches</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Stand: {updated}</p>
      <div role="note" className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
        <FileWarning className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        <p>
          <strong>Platzhalter – kein Rechtstext.</strong> Diese Seite gehört zur Klick-Demo und zeigt nur, welche Inhalte hier später stehen.
          Vor dem Start bitte durch eine Rechtsberatung erstellen lassen.
        </p>
      </div>
      {intro && <p className="mt-8 text-base text-muted-foreground">{intro}</p>}
      <div className="mt-8 space-y-10">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20" aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined} className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
        {children}
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
