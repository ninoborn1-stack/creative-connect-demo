import { Eyebrow } from "@/components/site/bits";
import { Rich } from "@/components/site/rich";
import { LEGAL } from "@/lib/brand";
import type { Dict, Locale } from "@/lib/i18n";
import type { LegalSectionText } from "@/content/legal-de";
import { cn } from "@/lib/utils";

// Rechtstexte im Plakat-Look: große Headline, Stand-Datum aus LEGAL, nummerierte Abschnitte mit Meta-Spalte
export const formatDate = (lang: Locale, iso: string) =>
  new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export function LegalPage({ lang, t, title, children }: { lang: Locale; t: Dict["legal"]; title: string; children: React.ReactNode }) {
  return (
    <article>
      <header className="gutter pt-16 pb-12 sm:pt-24 sm:pb-16">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 className="poster mt-8 text-[clamp(2.2rem,10vw,9rem)]">{title}</h1>
        <p className="meta mt-10 border-t pt-6 text-muted-foreground">
          {t.updated}: <time dateTime={LEGAL.lastUpdated}>{formatDate(lang, LEGAL.lastUpdated)}</time>
        </p>
        {t.binding && <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground" data-testid="legal-binding">{t.binding}</p>}
      </header>
      <div className="gutter pt-4 pb-24 sm:pb-32 [counter-reset:legal]">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, highlight, children }: { id?: string; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-4 border-b py-10 [counter-increment:legal] sm:py-12 lg:grid-cols-12 lg:gap-10">
      <span aria-hidden className="meta text-primary before:content-[counter(legal,decimal-leading-zero)] lg:col-span-3" />
      <div className={cn("min-w-0 lg:col-span-9", highlight && "border-l-4 border-primary pl-5")}>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        <div className="mt-4 max-w-[68ch] space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}

// Abschnitte aus den Textdateien (legal-de.ts / legal-en.ts); address: true fügt die Anschrift nach dem ersten Absatz ein
export function LegalSections({ sections, t }: { sections: LegalSectionText[]; t: Dict["legal"] }) {
  return sections.map((s) => (
    <LegalSection key={s.id} id={s.id} title={s.title} highlight={s.highlight}>
      {s.paras.map((p, i) => (
        <div key={i} className="space-y-3">
          <p><Rich text={p} /></p>
          {s.address && i === 0 && <OwnerAddress t={t} />}
        </div>
      ))}
    </LegalSection>
  ));
}

export function OwnerAddress({ t }: { t: Dict["legal"] }) {
  return (
    <address className="not-italic text-foreground" data-testid="legal-address">
      {LEGAL.owner}<br />
      {t.actingAs} {LEGAL.company} ({LEGAL.legalForm}{t.legalFormNote && `, ${t.legalFormNote}`})<br />
      {LEGAL.street}<br />
      {LEGAL.zip} {LEGAL.city}<br />
      {LEGAL.country}
    </address>
  );
}
