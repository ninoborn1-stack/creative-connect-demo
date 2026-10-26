import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, Briefcase, Building2, CalendarDays, CheckCircle2, ExternalLink, FileSignature, FolderCheck, Globe, Handshake, MapPin, Pencil, Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { industryName } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/companies/company-logo";
import { FollowButton } from "@/components/companies/follow-button";
import { InviteColleagueDialog } from "@/components/companies/invite-colleague-dialog";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ConnectButton } from "@/components/network/connect-button";
import { getConnectedIds, getRelations, relationOf } from "@/components/network/network-data";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.company.findUnique({ where: { slug }, select: { name: true } });
  return { title: c ? c.name : "Unternehmen" };
}

function Section({ id, title, icon: Icon, children, count }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode; count?: number }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5">
      <h2 id={`${id}-h`} className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-primary" aria-hidden /> {title}
        {typeof count === "number" && <span className="text-sm font-normal text-muted-foreground tabular-nums">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

export default async function CompanyPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp, me] = await Promise.all([params, searchParams, requireUser()]);
  const company = await db.company.findUnique({
    where: { slug },
    include: {
      members: { where: { status: { not: "gesperrt" } }, include: { profile: { select: { slug: true, avatarSeed: true, headline: true } } }, orderBy: { createdAt: "asc" } },
      opportunities: { include: { _count: { select: { pitches: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { followers: true, licenses: true } },
    },
  });
  if (!company) notFound();

  const memberIds = company.members.map((m) => m.id);
  const isMember = me.companyId === company.id;
  const canEdit = isMember || me.isAdmin;

  const [following, relations, myConnected, followerRows, projects] = await Promise.all([
    db.companyFollow.findUnique({ where: { companyId_userId: { companyId: company.id, userId: me.id } } }),
    getRelations(me.id),
    getConnectedIds(me.id),
    db.companyFollow.findMany({ where: { companyId: company.id }, select: { userId: true } }),
    memberIds.length
      ? db.project.findMany({
          where: { ownerId: { in: memberIds }, status: { in: ["abgeschlossen", "abnahme", "produktion", "bestaetigt"] } },
          include: { roles: { include: { assignee: { select: { id: true, name: true, profile: { select: { slug: true, avatarSeed: true } } } } } } },
          orderBy: { endDate: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  const networkFollowerIds = followerRows.map((f) => f.userId).filter((id) => myConnected.has(id));
  const networkFollowers = networkFollowerIds.length
    ? await db.user.findMany({ where: { id: { in: networkFollowerIds.slice(0, 12) } }, include: { profile: { select: { slug: true, avatarSeed: true, headline: true } } } })
    : [];

  const openOpps = company.opportunities.filter((o) => ["offen", "in_auswahl"].includes(o.status));
  const pastOpps = company.opportunities.filter((o) => !["offen", "in_auswahl"].includes(o.status));
  const finished = projects.filter((p) => p.status === "abgeschlossen");
  const collaborators = new Map<string, { id: string; name: string; slug?: string; avatarSeed?: string | null; count: number }>();
  for (const p of projects)
    for (const r of p.roles)
      if (r.assignee) {
        const prev = collaborators.get(r.assignee.id);
        collaborators.set(r.assignee.id, { id: r.assignee.id, name: r.assignee.name, slug: r.assignee.profile?.slug, avatarSeed: r.assignee.profile?.avatarSeed, count: (prev?.count ?? 0) + 1 });
      }
  const about = company.about.split(/\n{2,}/).filter(Boolean);
  const saved = sp.gespeichert === "1";

  const cardFor = (o: (typeof company.opportunities)[number]) => ({
    ...o, pitchCount: o._count.pitches, company: { name: company.name, slug: company.slug, logoSeed: company.logoSeed, verified: company.verified },
  });

  const tabs = [
    { id: "ueber", label: "Über uns" },
    { id: "ausschreibungen", label: `Ausschreibungen (${openOpps.length})` },
    { id: "team", label: `Team (${company.members.length})` },
    { id: "zusammenarbeit", label: "Zusammenarbeit" },
  ];

  return (
    <div className="space-y-6">
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden /> Unternehmensseite gespeichert.
        </p>
      )}

      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative aspect-[4/1] min-h-28 bg-muted">
          <StockImage seed={company.coverSeed} w={1600} h={400} priority sizes="(max-width: 1200px) 100vw, 1200px" />
        </div>
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 md:flex-row md:items-end md:justify-between">
            <CompanyLogo seed={company.logoSeed} name={company.name} className="size-20 rounded-xl ring-4 ring-card sm:size-24" textClassName="text-2xl" sizes="96px" />
            <div className="flex flex-wrap gap-2 md:pb-1">
              {canEdit && (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/unternehmen/${company.slug}/bearbeiten`}><Pencil aria-hidden /> Seite bearbeiten</Link>
                  </Button>
                  <InviteColleagueDialog companyId={company.id} companyName={company.name} />
                  <Button asChild>
                    <Link href="/ausschreibungen/neu">Ausschreibung erstellen</Link>
                  </Button>
                </>
              )}
              {!isMember && <FollowButton companyId={company.id} companyName={company.name} following={Boolean(following)} size="default" />}
              {company.website && (
                <Button asChild variant="ghost">
                  <a href={company.website} target="_blank" rel="noopener noreferrer"><Globe aria-hidden /> Website <ExternalLink aria-hidden /></a>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
              {company.name}
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <BadgeCheck className="size-4" aria-hidden /> Verifiziert
                </span>
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">{company.tagline}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 className="size-4" aria-hidden />{industryName(company.industry)}</span>
              <span className="inline-flex items-center gap-1"><Users className="size-4" aria-hidden />{company.size} Mitarbeitende</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{company.city}</span>
              {company.founded && <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" aria-hidden />gegründet {company.founded}</span>}
            </p>
            <p className="mt-2 text-sm">
              <strong className="tabular-nums">{formatNumber(company._count.followers)}</strong> Follower
              {networkFollowers.length > 0 && <span className="text-muted-foreground"> · {networkFollowerIds.length} aus deinem Netzwerk</span>}
            </p>
          </div>
        </div>
        <nav aria-label="Bereiche der Unternehmensseite" className="overflow-x-auto border-t">
          <ul className="flex w-max gap-1 px-2 sm:px-4">
            {tabs.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="inline-block border-b-2 border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground hover:border-primary hover:text-foreground">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Section id="ueber" title="Über uns" icon={Building2}>
            <div className="max-w-prose space-y-3 leading-relaxed">
              {about.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted-foreground">Branche</dt><dd>{industryName(company.industry)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Größe</dt><dd>{company.size}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Hauptsitz</dt><dd>{company.city}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Gegründet</dt><dd>{company.founded ?? "–"}</dd></div>
            </dl>
          </Section>

          <Section id="ausschreibungen" title="Offene Ausschreibungen" icon={Briefcase} count={openOpps.length}>
            {openOpps.length === 0 ? (
              <EmptyState icon={Briefcase} title="Gerade keine offenen Ausschreibungen" description={isMember ? "Veröffentliche eine Ausschreibung und erhalte Pitches aus dem Netzwerk." : "Folge dem Unternehmen, um neue Ausschreibungen nicht zu verpassen."} />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {openOpps.map((o) => <li key={o.id}><OpportunityCard o={cardFor(o)} headingLevel={3} /></li>)}
              </ul>
            )}
            {pastOpps.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Frühere Ausschreibungen ({pastOpps.length})</summary>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {pastOpps.map((o) => <li key={o.id}><OpportunityCard o={cardFor(o)} compact headingLevel={3} /></li>)}
                </ul>
              </details>
            )}
          </Section>

          <Section id="team" title="Team" icon={Users} count={company.members.length}>
            {company.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Teammitglieder auf Creative Connect.</p>
            ) : (
              <ul className="divide-y">
                {company.members.map((m) => {
                  const rel = relationOf(relations, m.id);
                  return (
                    <li key={m.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar name={m.name} seed={m.profile?.avatarSeed} className="size-11" />
                        <div className="min-w-0">
                          {m.profile ? (
                            <Link href={`/mitglieder/${m.profile.slug}`} className="font-medium hover:underline">{m.name}</Link>
                          ) : (
                            <p className="font-medium">{m.name}</p>
                          )}
                          <p className="truncate text-sm text-muted-foreground">{m.jobTitle ?? m.profile?.headline ?? "Teammitglied"}</p>
                        </div>
                      </div>
                      {m.id === me.id ? (
                        <span className="text-xs text-muted-foreground">Das bist du</span>
                      ) : (
                        <ConnectButton targetId={m.id} targetName={m.name} state={rel.state} connectionId={rel.connectionId} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section id="zusammenarbeit" title="Zusammenarbeit über Creative Connect" icon={Handshake}>
            <dl className="grid grid-cols-3 gap-3 text-center sm:text-left">
              <div className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">Abgeschlossene Projekte</dt><dd className="text-xl font-bold tabular-nums">{finished.length}</dd></div>
              <div className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">Kreative im Einsatz</dt><dd className="text-xl font-bold tabular-nums">{collaborators.size}</dd></div>
              <div className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">Lizenzierte Werke</dt><dd className="text-xl font-bold tabular-nums">{company._count.licenses}</dd></div>
            </dl>
            {projects.length > 0 ? (
              <ul className="mt-4 divide-y">
                {projects.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><FolderCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{p.title}</span></p>
                      <p className="text-xs text-muted-foreground">{p.endDate.getFullYear()} · {p.status === "abgeschlossen" ? "abgeschlossen" : "läuft"}</p>
                    </div>
                    <ul className="flex flex-wrap gap-1" aria-label="Beteiligte Kreative">
                      {p.roles.filter((r) => r.assignee).map((r) => (
                        <li key={r.id}>
                          {r.assignee!.profile ? (
                            <Link href={`/mitglieder/${r.assignee!.profile.slug}`} className="inline-flex rounded-full border px-2 py-0.5 text-xs hover:border-primary/50">{r.assignee!.name}</Link>
                          ) : (
                            <span className="inline-flex rounded-full border px-2 py-0.5 text-xs">{r.assignee!.name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Noch keine Projekte über die Plattform abgeschlossen.</p>
            )}
            {company._count.licenses > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileSignature className="size-3.5" aria-hidden /> Alle Lizenzen mit Zertifikat und klarer Rechtekette.
              </p>
            )}
          </Section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section aria-labelledby="netzwerk-follower" className="rounded-xl border bg-card p-4">
            <h2 id="netzwerk-follower" className="text-base font-semibold">Aus deinem Netzwerk</h2>
            {networkFollowers.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Noch keine deiner Kontakte folgen {company.name}.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">{networkFollowerIds.length} Kontakt{networkFollowerIds.length === 1 ? "" : "e"} folg{networkFollowerIds.length === 1 ? "t" : "en"} diesem Unternehmen.</p>
                <ul className="mt-3 space-y-2">
                  {networkFollowers.map((f) => (
                    <li key={f.id}>
                      <Link href={f.profile ? `/mitglieder/${f.profile.slug}` : "/netzwerk"} className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted/50">
                        <UserAvatar name={f.name} seed={f.profile?.avatarSeed} className="size-8" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{f.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{f.profile?.headline ?? f.jobTitle}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {collaborators.size > 0 && (
            <section aria-labelledby="kreative-team" className="rounded-xl border bg-card p-4">
              <h2 id="kreative-team" className="text-base font-semibold">Kreative, die für {company.name} gearbeitet haben</h2>
              <ul className="mt-3 space-y-2">
                {[...collaborators.values()].sort((a, b) => b.count - a.count).slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link href={c.slug ? `/mitglieder/${c.slug}` : "/mitglieder"} className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted/50">
                      <UserAvatar name={c.name} seed={c.avatarSeed} className="size-8" />
                      <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{c.count}×</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="branche-info" className="rounded-xl border bg-card p-4 text-sm">
            <h2 id="branche-info" className="text-base font-semibold">Mit {company.name} arbeiten</h2>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>· Pitches direkt auf Ausschreibungen</li>
              <li>· Verträge, Nutzungsrechte und Zahlung über die Plattform</li>
              <li>· 0 % Provision für Kreative</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Firmenangaben stammen vom Unternehmen selbst{company.verified ? " und wurden von Creative Connect geprüft" : ""}.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
