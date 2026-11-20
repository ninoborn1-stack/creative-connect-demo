import { Eyebrow } from "@/components/site/bits";
import type { Dict } from "@/lib/i18n";

// Rechtstexte im Plakat-Look: große Headline, Entwurfs-Hinweis, nummerierte Abschnitte mit Meta-Spalte
export function LegalPage({ t, title, updated, children }: { t: Dict["legal"]; title: string; updated: string; children: React.ReactNode }) {
  return (
    <article>
      <header className="gutter pt-16 pb-12 sm:pt-24 sm:pb-16">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 className="poster mt-8 text-[clamp(2.2rem,10vw,9rem)]">{title}</h1>
        <p className="meta mt-10 border-t pt-6 text-muted-foreground">{t.updated}: {updated}</p>
      </header>
      <div role="note" className="gutter grid gap-2 bg-primary py-5 text-primary-foreground sm:py-6 lg:grid-cols-12 lg:gap-10">
        <p className="meta lg:col-span-3">{t.draftTitle}</p>
        <p className="max-w-[72ch] text-sm sm:text-base lg:col-span-9">{t.draftText}</p>
      </div>
      <div className="gutter pt-4 pb-24 sm:pb-32 [counter-reset:legal]">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-10 [counter-increment:legal] sm:py-12 lg:grid-cols-12 lg:gap-10">
      <span aria-hidden className="meta text-primary before:content-[counter(legal,decimal-leading-zero)] lg:col-span-3" />
      <div className="min-w-0 lg:col-span-9">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        <div className="mt-4 max-w-[68ch] space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}
