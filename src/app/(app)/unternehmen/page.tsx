import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Gamepad2, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CompanyCard, type CompanyCardData } from "@/components/companies/company-card";
import { UrlFilters } from "@/components/companies/url-filters";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Unternehmen" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export default async function UnternehmenPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const q = one(sp.q).trim();
  const branche = one(sp.branche);
  const groesse = one(sp.groesse);
  const stadt = one(sp.stadt);
  const verifiziert = one(sp.verifiziert) === "1";

  const [companies, follows] = await Promise.all([
    db.company.findMany({
      include: { _count: { select: { followers: true, opportunities: { where: { status: { in: ["offen", "in_auswahl"] } } } } } },
      orderBy: { name: "asc" },
    }),
    db.companyFollow.findMany({ where: { userId: user.id }, select: { companyId: true } }),
  ]);
  const followed = new Set(follows.map((f) => f.companyId));
  const cities = [...new Set(companies.map((c) => c.city))].sort((a, b) => a.localeCompare(b, "de"));
  const byIndustry = new Map<string, number>();
  for (const c of companies) byIndustry.set(c.industry, (byIndustry.get(c.industry) ?? 0) + 1);

  const filtered = companies
    .filter((c) => !q || norm(`${c.name} ${c.tagline} ${c.about} ${c.city}`).includes(norm(q)))
    .filter((c) => !branche || c.industry === branche)
    .filter((c) => !groesse || c.size === groesse)
    .filter((c) => !stadt || c.city === stadt)
    .filter((c) => !verifiziert || c.verified)
    .sort((a, b) => b._count.opportunities - a._count.opportunities || b._count.followers - a._count.followers || a.name.localeCompare(b.name, "de"));

  const cards: CompanyCardData[] = filtered.map((c) => ({
    id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, industry: c.industry, size: c.size, city: c.city, logoSeed: c.logoSeed, verified: c.verified,
    followers: c._count.followers, openOpportunities: c._count.opportunities, following: followed.has(c.id), isMember: user.companyId === c.id,
  }));

  const chip = (slug: string) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (k !== "branche" && typeof v === "string" && v) params.set(k, v);
    if (slug && slug !== branche) params.set("branche", slug);
    const qs = params.toString();
    return qs ? `/unternehmen?${qs}` : "/unternehmen";
  };

  return (
    <>
      <PageHeader
        title="Unternehmen"
        description="Marken, Agenturen, Gaming-Studios, Labels und Produktionsfirmen, die mit Kreativen aus dem Netzwerk arbeiten. Folge Unternehmen, um neue Ausschreibungen zuerst zu sehen."
        actions={
          user.companyId || user.isAdmin ? (
            <Button asChild>
              <Link href="/ausschreibungen/neu">Ausschreibung erstellen</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/ausschreibungen">Zu den Ausschreibungen</Link>
            </Button>
          )
        }
      />

      <nav aria-label="Branchen" className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {INDUSTRIES.map((i) => (
            <li key={i.slug}>
              <Link
                href={chip(i.slug)}
                aria-current={branche === i.slug ? "true" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap hover:border-primary/50",
                  branche === i.slug && "border-primary bg-primary/10 text-primary",
                )}
              >
                {i.slug === "gaming" && <Gamepad2 className="size-3.5" aria-hidden />}
                {i.name} <span className="text-xs text-muted-foreground tabular-nums">{byIndustry.get(i.slug) ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <UrlFilters
        className="mb-6"
        search={{ name: "q", label: "Unternehmen suchen", placeholder: "Name, Thema oder Stadt …" }}
        selects={[
          { name: "branche", label: "Branche", all: "Alle Branchen", options: INDUSTRIES.map((i) => ({ value: i.slug, label: i.name })) },
          { name: "groesse", label: "Größe", all: "Alle Größen", options: COMPANY_SIZES.map((s) => ({ value: s, label: `${s} Mitarbeitende` })) },
          { name: "stadt", label: "Stadt", all: "Alle Städte", options: cities.map((c) => ({ value: c, label: c })) },
        ]}
        toggles={[{ name: "verifiziert", label: "Nur verifiziert" }]}
      />

      <p className="mb-3 text-sm text-muted-foreground" role="status">
        {cards.length === 1 ? "1 Unternehmen" : `${cards.length} Unternehmen`}
      </p>
      {cards.length === 0 ? (
        <EmptyState
          icon={companies.length ? SearchX : Building2}
          title={companies.length ? "Keine Unternehmen gefunden" : "Noch keine Unternehmen"}
          description="Passe Suche oder Filter an."
          action={<Button asChild variant="outline"><Link href="/unternehmen">Filter zurücksetzen</Link></Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <li key={c.id} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><CompanyCard company={c} /></div></li>
          ))}
        </ul>
      )}
    </>
  );
}
