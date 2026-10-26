import type { Metadata } from "next";
import Link from "next/link";
import { subDays } from "date-fns";
import { Briefcase, Plus, SearchX, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CATEGORIES, INDUSTRIES, OPPORTUNITY_STATUS } from "@/lib/constants";
import { parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { UrlFilters } from "@/components/companies/url-filters";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/opportunity-card";
import { matchOpportunity } from "@/components/opportunities/matching";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ausschreibungen" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

const BUDGETS: Record<string, { label: string; test: (min: number, max: number) => boolean }> = {
  bis10: { label: "bis 10.000 €", test: (min) => min <= 10000 },
  "10bis25": { label: "10.000–25.000 €", test: (min, max) => max >= 10000 && min <= 25000 },
  ab25: { label: "ab 25.000 €", test: (_, max) => max >= 25000 },
};

export default async function AusschreibungenPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const isCompany = Boolean(user.companyId) || user.isAdmin;
  const isCreative = user.isCreative && Boolean(user.profile);
  const view = one(sp.ansicht) === "unsere" && user.companyId ? "unsere" : "alle";

  const q = one(sp.q).trim();
  const branche = one(sp.branche);
  const kategorie = one(sp.kategorie);
  const budget = one(sp.budget);
  const status = one(sp.status);
  const remote = one(sp.remote) === "1";
  const licensing = one(sp.licensing) === "1";

  const since = subDays(new Date(), 1);
  const opps = await db.opportunity.findMany({
    where: view === "unsere" ? { companyId: user.companyId! } : undefined,
    include: {
      company: { select: { name: true, slug: true, logoSeed: true, verified: true } },
      pitches: { select: { creativeId: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const toCard = (o: (typeof opps)[number], match?: string | null): OpportunityCardData => ({
    ...o,
    pitchCount: o.pitches.filter((p) => p.status !== "zurueckgezogen").length,
    myPitchStatus: o.pitches.find((p) => p.creativeId === user.id)?.status ?? null,
    newPitches: view === "unsere" ? o.pitches.filter((p) => p.createdAt >= since && p.status !== "zurueckgezogen").length : 0,
    match: match ?? undefined,
  });

  const statusOk = (s: string) => (status ? s === status : view === "unsere" ? true : ["offen", "in_auswahl"].includes(s));
  const filtered = opps
    .filter((o) => statusOk(o.status))
    .filter((o) => !q || norm(`${o.title} ${o.summary} ${o.company.name} ${o.skills}`).includes(norm(q)))
    .filter((o) => !branche || o.industry === branche)
    .filter((o) => !kategorie || parseJson<string[]>(o.categories, []).includes(kategorie))
    .filter((o) => !remote || o.remote)
    .filter((o) => !licensing || o.licensing)
    .filter((o) => !budget || !BUDGETS[budget] || BUDGETS[budget].test(o.budgetMin, o.budgetMax));

  // „Für dich passend“: nur offene, noch nicht gepitchte Ausschreibungen
  const now = new Date();
  const matches =
    isCreative && view === "alle"
      ? opps
          .filter((o) => ["offen", "in_auswahl"].includes(o.status) && o.deadline > now && !o.pitches.some((p) => p.creativeId === user.id) && o.companyId !== user.companyId)
          .map((o) => ({ o, m: matchOpportunity(user.profile, o) }))
          .filter((x) => x.m.score > 0)
          .sort((a, b) => b.m.score - a.m.score)
          .slice(0, 3)
      : [];

  const tabHref = (v: "alle" | "unsere") => (v === "unsere" ? "/ausschreibungen?ansicht=unsere" : "/ausschreibungen");

  return (
    <>
      <PageHeader
        title="Ausschreibungen"
        description="Projekte von Unternehmen, Studios und Marken – pitche mit Preis und Referenzen. Zusagen laufen mit Vertrag und treuhänderischer Zahlung über Creative Connect."
        actions={
          isCompany ? (
            <Button asChild data-testid="opportunity-create">
              <Link href="/ausschreibungen/neu"><Plus aria-hidden /> Ausschreibung erstellen</Link>
            </Button>
          ) : undefined
        }
      />

      {user.companyId && (
        <nav aria-label="Ansicht" className="mb-4 inline-flex rounded-lg bg-muted p-1">
          {(["alle", "unsere"] as const).map((v) => (
            <Link
              key={v}
              href={tabHref(v)}
              aria-current={view === v ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground", view === v && "bg-background text-foreground shadow-sm")}
            >
              {v === "alle" ? "Alle Ausschreibungen" : "Unsere Ausschreibungen"}
            </Link>
          ))}
        </nav>
      )}

      {matches.length > 0 && (
        <section aria-labelledby="passend" className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h2 id="passend" className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" aria-hidden /> Für dich passend</h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {matches.map(({ o, m }) => <li key={o.id}><OpportunityCard o={toCard(o, m.reason)} compact headingLevel={3} /></li>)}
          </ul>
        </section>
      )}

      <UrlFilters
        className="mb-6"
        keep={["ansicht"]}
        search={{ name: "q", label: "Ausschreibungen durchsuchen", placeholder: "Titel, Skill oder Unternehmen …" }}
        selects={[
          { name: "branche", label: "Branche", all: "Alle Branchen", options: INDUSTRIES.map((i) => ({ value: i.slug, label: i.name })) },
          { name: "kategorie", label: "Kategorie", all: "Alle Kategorien", options: CATEGORIES.map((c) => ({ value: c.slug, label: c.name })) },
          { name: "budget", label: "Budget", all: "Jedes Budget", options: Object.entries(BUDGETS).map(([k, b]) => ({ value: k, label: b.label })) },
          { name: "status", label: "Status", all: view === "unsere" ? "Alle Status" : "Offen & in Auswahl", options: Object.entries(OPPORTUNITY_STATUS).map(([k, l]) => ({ value: k, label: l })) },
        ]}
        toggles={[{ name: "remote", label: "Remote" }, { name: "licensing", label: "Mit Licensing" }]}
      />

      <p className="mb-3 text-sm text-muted-foreground" role="status">
        {filtered.length === 1 ? "1 Ausschreibung" : `${filtered.length} Ausschreibungen`}
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          icon={opps.length ? SearchX : Briefcase}
          title={view === "unsere" && !opps.length ? "Noch keine Ausschreibungen" : "Keine Ausschreibungen gefunden"}
          description={view === "unsere" && !opps.length ? "Beschreibt euer Vorhaben – Kreative aus dem Netzwerk pitchen mit Preis und Referenzen." : "Passe Suche oder Filter an."}
          action={
            view === "unsere" && !opps.length ? (
              <Button asChild><Link href="/ausschreibungen/neu">Erste Ausschreibung erstellen</Link></Button>
            ) : (
              <Button asChild variant="outline"><Link href={tabHref(view)}>Filter zurücksetzen</Link></Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((o) => <li key={o.id}><OpportunityCard o={toCard(o)} /></li>)}
        </ul>
      )}
    </>
  );
}
