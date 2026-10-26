import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { INDUSTRIES } from "@/lib/constants";
import { parseJson } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StockImage } from "@/components/stock-image";
import { PageHero, Section } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS, INDUSTRY_ICONS } from "@/components/public/industry-data";
import { cn } from "@/lib/utils";

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
      <Section labelledBy="ind-list-title">
        <h2 id="ind-list-title" className="sr-only">Alle Branchen</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {INDUSTRIES.map((ind, i) => {
            const Icon = INDUSTRY_ICONS[ind.icon];
            const s = stats(ind.slug);
            const highlight = i === 0;
            return (
              <li key={ind.slug} className={cn("group relative flex flex-col overflow-hidden rounded-3xl border bg-card", highlight && "md:col-span-2 md:flex-row")}>
                <div className={cn("relative aspect-[16/9] shrink-0", highlight && "md:aspect-auto md:w-1/2")}>
                  <StockImage seed={INDUSTRY_DETAILS[ind.slug].imageSeed} w={900} h={520} sizes="(max-width: 768px) 100vw, 50vw" className="transition-transform duration-500 group-hover:scale-105" />
                  {highlight && <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Schwerpunkt</span>}
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="size-5" aria-hidden /></span>
                  <h3 className={cn("mt-4 font-semibold", highlight ? "text-3xl" : "text-xl")}>
                    <Link href={`/branchen/${ind.slug}`} className="after:absolute after:inset-0">{ind.name}</Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{ind.tagline}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {ind.needs.map((n) => <li key={n} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{n}</li>)}
                  </ul>
                  <p className="mt-auto pt-6 text-xs text-muted-foreground">
                    {s.companies} Unternehmen · {s.works} Werke im Katalog · {s.opps} offene Ausschreibungen
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Zur Branche <ArrowRight className="size-4" aria-hidden /></span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 flex flex-col items-start gap-3 rounded-3xl border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-semibold">Eure Branche ist nicht dabei?</p>
            <p className="text-sm text-muted-foreground">Mode, Sport, Tourismus, Bildung – das Netzwerk deckt alle kreativen Gewerke ab.</p>
          </div>
          <Button asChild className="rounded-full"><Link href="/fuer-unternehmen#kontakt">Sprecht mit uns</Link></Button>
        </div>
      </Section>
    </>
  );
}
