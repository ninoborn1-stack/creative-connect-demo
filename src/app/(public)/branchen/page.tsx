import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { INDUSTRIES } from "@/lib/constants";
import { parseJson } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { CtaLink, Eyebrow, PageHero } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS } from "@/components/public/industry-data";

export const metadata: Metadata = {
  title: "Branchen",
  description: "Kreative Leistungen und Lizenzen für Gaming, Marken & Werbung, Film & TV, Musik, Corporate und Events.",
};

export default async function IndustriesPage() {
  const [companies, works, opps] = await Promise.all([
    db.company.findMany({ select: { industry: true } }),
    db.licensableWork.findMany({ select: { industries: true } }),
    db.opportunity.findMany({ where: { status: "offen" }, select: { industry: true } }),
  ]);
  const stats = (slug: string) => ({
    companies: companies.filter((c) => c.industry === slug).length,
    works: works.filter((w) => parseJson<string[]>(w.industries, []).includes(slug)).length,
    opps: opps.filter((o) => o.industry === slug).length,
  });

  return (
    <>
      <PageHero
        eyebrow="Branchen"
        title="Kreative Leistungen, zugeschnitten auf euren Markt."
        text="Jede Branche hat eigene Formate, Rechtefragen und Abläufe. Wählt eure Branche – mit passenden Talenten, Werken aus dem Katalog und offenen Ausschreibungen."
        imageSeed="cc-branchen-uebersicht"
      />

      {/* ---------- Branchen als Plakatzeilen; die erste (Schwerpunkt) als Split über die volle Breite ---------- */}
      <section aria-labelledby="ind-list-title" className="pt-20 sm:pt-32">
        <div className="gutter flex flex-col gap-4 pb-10 sm:flex-row sm:items-end sm:justify-between sm:pb-14">
          <Eyebrow>01 — Alle Branchen</Eyebrow>
          <h2 id="ind-list-title" className="sr-only">Alle Branchen</h2>
          <p className="meta text-muted-foreground">{String(INDUSTRIES.length).padStart(2, "0")} Märkte</p>
        </div>
        <ul className="border-t">
          {INDUSTRIES.map((ind, i) => {
            const s = stats(ind.slug);
            const highlight = i === 0;
            const facts = `${s.companies} Unternehmen · ${s.works} Werke im Katalog · ${s.opps} offene Ausschreibungen`;

            if (highlight) {
              return (
                <li key={ind.slug} className="group relative grid bg-[var(--ink)] text-[var(--bone)] lg:grid-cols-2">
                  <div className="relative min-h-[45svh] overflow-hidden lg:min-h-[75svh]">
                    <StockImage
                      seed={INDUSTRY_DETAILS[ind.slug].imageSeed}
                      w={1400}
                      h={1200}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="grayscale-[30%] transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="meta absolute top-4 left-4 bg-[var(--signal)] px-2 py-1 text-white sm:top-6 sm:left-6">Schwerpunkt</span>
                  </div>
                  <div className="gutter flex flex-col justify-between gap-10 py-12 sm:py-16">
                    <span className="meta text-white/50">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="poster text-[clamp(3.2rem,9vw,9.5rem)] text-balance transition-colors group-hover:text-[var(--signal)]">
                        <Link href={`/branchen/${ind.slug}`} className="after:absolute after:inset-0">{ind.name}</Link>
                      </h3>
                      <p className="mt-6 max-w-lg text-pretty text-white/75 sm:text-lg">{ind.tagline}</p>
                      <ul className="mt-6 flex flex-wrap gap-1.5">
                        {ind.needs.map((n) => <li key={n} className="meta border border-white/25 px-2 py-1 text-white/70">{n}</li>)}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
                      <p className="meta text-white/55">{facts}</p>
                      <span className="meta inline-flex items-center gap-2 text-[var(--signal)]">
                        Zur Branche <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                      </span>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li key={ind.slug} className="gutter group relative border-b">
                <div className="grid gap-5 py-8 sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-8">
                  <span className="meta text-muted-foreground lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:col-span-2 lg:aspect-[4/3]">
                    <StockImage
                      seed={INDUSTRY_DETAILS[ind.slug].imageSeed}
                      w={600}
                      h={450}
                      sizes="(max-width: 1024px) 100vw, 16vw"
                      className="grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="min-w-0 lg:col-span-5">
                    <h3 className="poster text-[clamp(2.6rem,6vw,6rem)] text-balance transition-colors group-hover:text-primary">
                      <Link href={`/branchen/${ind.slug}`} className="after:absolute after:inset-0">{ind.name}</Link>
                    </h3>
                    <p className="mt-3 max-w-md text-pretty text-muted-foreground">{ind.tagline}</p>
                  </div>
                  <div className="lg:col-span-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {ind.needs.map((n) => <li key={n} className="meta border px-2 py-1 text-muted-foreground">{n}</li>)}
                    </ul>
                    <p className="meta mt-4 text-muted-foreground">{facts}</p>
                  </div>
                  <span className="meta inline-flex items-center gap-2 text-primary lg:col-span-1 lg:justify-self-end">
                    <span className="lg:sr-only">Zur Branche</span> <ArrowUpRight className="size-6 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Keine passende Branche: rote Fläche über die volle Breite ---------- */}
      <section aria-labelledby="ind-other-title" className="gutter bg-primary py-20 text-primary-foreground sm:py-28">
        <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />02 — Und sonst?</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 id="ind-other-title" className="poster text-[clamp(2.8rem,7vw,7.5rem)] text-balance lg:col-span-8">Eure Branche ist nicht dabei?</h2>
          <div className="lg:col-span-4 lg:pb-2">
            <p className="max-w-md text-primary-foreground/85 sm:text-lg">Mode, Sport, Tourismus, Bildung – das Netzwerk deckt alle kreativen Gewerke ab.</p>
            <CtaLink href="/fuer-unternehmen#kontakt" variant="light" className="mt-8">Sprecht mit uns <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
