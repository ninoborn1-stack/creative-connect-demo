import Link from "next/link";
import { subDays } from "date-fns";
import { BadgeCheck, Briefcase, FileSignature, FolderKanban, Plus, Sparkles, Users, Library } from "lucide-react";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { LICENSE_TIERS, industryName } from "@/lib/constants";
import { formatDate, formatEur, formatNumber, formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/companies/company-logo";
import { InviteColleagueDialog } from "@/components/companies/invite-colleague-dialog";
import { OpportunityStatusBadge, budgetRange } from "@/components/opportunities/opportunity-status";
import { DashboardCard, Stat } from "./dashboard-card";
import { FEATURES } from "@/lib/features";

export async function CompanyDashboard({ user }: { user: CurrentUser }) {
  if (!user.companyId) return null;
  const since = subDays(new Date(), 1);
  const company = await db.company.findUnique({
    where: { id: user.companyId },
    include: {
      members: { where: { status: { not: "gesperrt" } }, include: { profile: { select: { slug: true, avatarSeed: true } } } },
      opportunities: {
        where: { status: { in: ["offen", "in_auswahl"] } },
        include: { pitches: { where: { status: { not: "zurueckgezogen" } }, select: { createdAt: true, status: true } } },
        orderBy: { deadline: "asc" },
      },
      _count: { select: { followers: true, licenses: true } },
    },
  });
  if (!company) return null;
  const memberIds = company.members.map((m) => m.id);
  const [licenses, projects, awarded] = await Promise.all([
    db.license.findMany({
      where: { companyId: company.id },
      include: { work: { select: { title: true, type: true, owner: { select: { name: true } } } }, buyer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.project.findMany({
      where: { ownerId: { in: memberIds }, status: { in: ["anfragen", "bestaetigt", "produktion", "abnahme"] } },
      include: { roles: { include: { assignee: { select: { name: true } } } } },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
    db.opportunity.count({ where: { companyId: company.id, status: "vergeben" } }),
  ]);

  const totalPitches = company.opportunities.reduce((s, o) => s + o.pitches.length, 0);
  const newPitches = company.opportunities.reduce((s, o) => s + o.pitches.filter((p) => p.createdAt >= since).length, 0);

  return (
    <div className="space-y-6">
      <section aria-labelledby="firma-kopf" className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo seed={company.logoSeed} name={company.name} className="size-14" />
          <div className="min-w-0">
            <h2 id="firma-kopf" className="flex items-center gap-1.5 text-lg font-semibold">
              {FEATURES.unternehmen ? <Link href={`/unternehmen/${company.slug}`} className="truncate hover:underline">{company.name}</Link> : <span className="truncate">{company.name}</span>}
              {company.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="verifiziert" />}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{industryName(company.industry)} · {company.city} · {formatNumber(company._count.followers)} Follower</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {FEATURES.ausschreibungen && <Button asChild data-testid="opportunity-create"><Link href="/ausschreibungen/neu"><Plus aria-hidden /> Ausschreibung erstellen</Link></Button>}
          {FEATURES.lizenzen && <Button asChild variant="outline"><Link href="/lizenzen"><Library aria-hidden /> Werk lizenzieren</Link></Button>}
          {FEATURES.briefing && <Button asChild variant="outline"><Link href="/briefing"><Sparkles aria-hidden /> Crew per Briefing</Link></Button>}
        </div>
      </section>

      {FEATURES.ausschreibungen && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Offene Ausschreibungen" value={company.opportunities.length} />
        <Stat label="Pitches erhalten" value={totalPitches} hint={newPitches ? `+${newPitches} seit gestern` : "keine neuen seit gestern"} />
        <Stat label="Vergeben" value={awarded} />
        <Stat label="Lizenzen" value={company._count.licenses} />
      </div>}

      {FEATURES.ausschreibungen && <DashboardCard id="firma-ausschreibungen" title="Offene Ausschreibungen" icon={Briefcase} href="/ausschreibungen?ansicht=unsere">
        {company.opportunities.length === 0 ? (
          <EmptyState icon={Briefcase} title="Keine offenen Ausschreibungen" description="Beschreibt euer nächstes Vorhaben – Kreative pitchen mit Preis und Referenzen." action={<Button asChild size="sm"><Link href="/ausschreibungen/neu">Ausschreibung erstellen</Link></Button>} />
        ) : (
          <ul className="divide-y">
            {company.opportunities.map((o) => {
              const fresh = o.pitches.filter((p) => p.createdAt >= since).length;
              const shortlist = o.pitches.filter((p) => p.status === "shortlist").length;
              return (
                <li key={o.id}>
                  <Link href={`/ausschreibungen/${o.slug}#pitches`} className="flex flex-col gap-1 py-2.5 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{o.title}</span>
                      <span className="block text-xs text-muted-foreground">{budgetRange(o.budgetMin, o.budgetMax)} · Deadline {formatRelative(o.deadline)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="tabular-nums">{o.pitches.length} Pitches</span>
                      {shortlist > 0 && <span className="text-muted-foreground tabular-nums">{shortlist} Shortlist</span>}
                      {fresh > 0 && <span className="rounded-full bg-primary px-1.5 font-semibold text-primary-foreground">+{fresh} neu</span>}
                      <OpportunityStatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardCard>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FEATURES.lizenzen && <DashboardCard id="firma-lizenzen" title="Letzte Lizenzen" icon={FileSignature} href="/lizenzen/meine">
          {licenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Lizenzen. Im Katalog findet ihr Musik, Sounds, Artwork und Footage – mit klarer Rechtekette.</p>
          ) : (
            <ul className="space-y-2">
              {licenses.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{l.work.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {LICENSE_TIERS[l.tier as keyof typeof LICENSE_TIERS]?.label ?? l.tier} · {l.work.owner.name} · {l.projectName}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    <span className="block font-medium tabular-nums">{formatEur(l.price)}</span>
                    <span className="text-muted-foreground">{formatDate(l.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>}

        <DashboardCard id="firma-projekte" title="Laufende Projekte" icon={FolderKanban} href="/projekte">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine laufenden Projekte. Zusagen auf Pitches und Crews aus dem Briefing landen hier.</p>
          ) : (
            <ul className="space-y-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projekte/${p.id}`} className="flex items-center justify-between gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.roles.map((r) => r.assignee?.name).filter(Boolean).join(", ") || "Crew offen"} · {formatEur(p.budget)}
                      </span>
                    </span>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <DashboardCard id="firma-team" title="Team" icon={Users} href={FEATURES.unternehmen ? `/unternehmen/${company.slug}#team` : undefined} hrefLabel="Zur Unternehmensseite">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {company.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg border p-2">
              <UserAvatar name={m.name} seed={m.profile?.avatarSeed} className="size-9" />
              <span className="min-w-0">
                {m.profile ? (
                  <Link href={`/mitglieder/${m.profile.slug}`} className="block truncate text-sm font-medium hover:underline">{m.name}</Link>
                ) : (
                  <span className="block truncate text-sm font-medium">{m.name}{m.id === user.id && " (du)"}</span>
                )}
                <span className="block truncate text-xs text-muted-foreground">{m.jobTitle ?? "Teammitglied"}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <InviteColleagueDialog companyId={company.id} companyName={company.name} />
        </div>
      </DashboardCard>
    </div>
  );
}
