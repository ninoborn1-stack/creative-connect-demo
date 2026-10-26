import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Inbox, Send, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { industryName } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/companies/company-logo";
import { UrlFilters } from "@/components/companies/url-filters";
import { ConnectButton } from "@/components/network/connect-button";
import { PersonRow } from "@/components/network/person-row";
import { getSuggestions } from "@/components/network/network-data";

export const metadata: Metadata = { title: "Netzwerk" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const PAGE = 40;

const personInclude = { profile: { select: { slug: true, avatarSeed: true, headline: true, city: true } } } as const;
type Person = { id: string; name: string; company: string | null; jobTitle: string | null; profile: { slug: string; avatarSeed: string; headline: string; city: string } | null };
const subtitleOf = (p: Person) => (p.jobTitle && p.company ? `${p.jobTitle} · ${p.company}` : p.profile?.headline ?? p.company ?? "Mitglied");

function Card({ id, title, icon: Icon, children, count, action }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode; count?: number; action?: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
          <Icon className="size-4 text-primary" aria-hidden /> {title}
          {typeof count === "number" && <span className="text-sm font-normal text-muted-foreground tabular-nums">({count})</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function NetzwerkPage({ searchParams }: { searchParams: SearchParams }) {
  const [me, sp] = await Promise.all([requireUser(), searchParams]);
  const q = one(sp.q).trim();
  const alle = one(sp.alle) === "1";

  const [incoming, outgoing, connected, follows, suggestions] = await Promise.all([
    db.connection.findMany({ where: { toId: me.id, status: "angefragt" }, include: { from: { include: personInclude } }, orderBy: { createdAt: "desc" } }),
    db.connection.findMany({ where: { fromId: me.id, status: "angefragt" }, include: { to: { include: personInclude } }, orderBy: { createdAt: "desc" } }),
    db.connection.findMany({
      where: { status: "verbunden", OR: [{ fromId: me.id }, { toId: me.id }] },
      include: { from: { include: personInclude }, to: { include: personInclude } },
      orderBy: { createdAt: "desc" },
    }),
    db.companyFollow.findMany({
      where: { userId: me.id },
      include: { company: { include: { _count: { select: { opportunities: { where: { status: { in: ["offen", "in_auswahl"] } } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getSuggestions(me.id, 9),
  ]);

  const contacts = connected
    .map((c) => ({ since: c.createdAt, person: (c.fromId === me.id ? c.to : c.from) as Person }))
    .filter((c) => !q || norm(`${c.person.name} ${subtitleOf(c.person)} ${c.person.profile?.city ?? ""}`).includes(norm(q)))
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "de"));
  const shown = alle ? contacts : contacts.slice(0, PAGE);

  return (
    <>
      <PageHeader
        title="Netzwerk"
        description="Deine Kontakte zu Kreativen und Unternehmen. Vernetzte Personen sehen gemeinsame Kontakte und finden dich schneller für Projekte."
        actions={<Button asChild variant="outline"><Link href="/mitglieder"><UserPlus aria-hidden /> Leute finden</Link></Button>}
      />

      <dl className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Kontakte</dt><dd className="text-2xl font-bold tabular-nums">{connected.length}</dd></div>
        <div className="rounded-xl border bg-card p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Offene Anfragen</dt><dd className="text-2xl font-bold tabular-nums">{incoming.length}</dd></div>
        <div className="rounded-xl border bg-card p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Gefolgte Unternehmen</dt><dd className="text-2xl font-bold tabular-nums">{follows.length}</dd></div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card id="eingehend" title="Kontaktanfragen" icon={Inbox} count={incoming.length}>
            {incoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine offenen Anfragen.</p>
            ) : (
              <ul className="divide-y">
                {incoming.map((c) => (
                  <li key={c.id}>
                    <PersonRow
                      name={c.from.name} slug={c.from.profile?.slug} avatarSeed={c.from.profile?.avatarSeed} subtitle={subtitleOf(c.from)}
                      meta={<>{formatRelative(c.createdAt)}{c.note && <> · „{c.note}“</>}</>}
                      action={<ConnectButton targetId={c.fromId} targetName={c.from.name} state="pending_in" connectionId={c.id} showDecline />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card id="vorschlaege" title="Leute, die du kennen könntest" icon={UserPlus}>
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Gerade keine Vorschläge – vernetze dich mit Leuten aus deinen Projekten.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center">
                    <UserAvatar name={s.name} seed={s.avatarSeed} className="size-14" />
                    <div className="min-w-0 w-full">
                      {s.slug ? (
                        <Link href={`/mitglieder/${s.slug}`} className="block truncate font-medium hover:underline">{s.name}</Link>
                      ) : (
                        <p className="truncate font-medium">{s.name}</p>
                      )}
                      <p className="line-clamp-2 text-xs text-muted-foreground">{s.headline}</p>
                      <p className="mt-1 text-xs text-primary">{s.reason}</p>
                    </div>
                    <ConnectButton targetId={s.id} targetName={s.name} state="none" className="mt-auto w-full" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card id="kontakte" title="Meine Kontakte" icon={Users} count={connected.length}>
            <UrlFilters className="mb-2 border-0 bg-transparent p-0 sm:p-0" search={{ name: "q", label: "Kontakte durchsuchen", placeholder: "Name, Position oder Stadt …" }} />
            {contacts.length === 0 ? (
              <EmptyState icon={Users} title={q ? "Keine Kontakte gefunden" : "Noch keine Kontakte"} description={q ? "Andere Schreibweise probieren." : "Vernetze dich mit Kreativen und Unternehmen, mit denen du arbeitest."} />
            ) : (
              <>
                <ul className="divide-y">
                  {shown.map(({ person: p, since }) => (
                    <li key={p.id}>
                      <PersonRow
                        name={p.name} slug={p.profile?.slug} avatarSeed={p.profile?.avatarSeed} subtitle={subtitleOf(p)}
                        meta={<>verbunden {formatRelative(since)}{p.profile?.city && <> · {p.profile.city}</>}</>}
                        action={<ConnectButton targetId={p.id} targetName={p.name} state="connected" />}
                      />
                    </li>
                  ))}
                </ul>
                {!alle && contacts.length > PAGE && (
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/netzwerk?alle=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Alle {contacts.length} Kontakte anzeigen</Link>
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card id="gesendet" title="Gesendete Anfragen" icon={Send} count={outgoing.length}>
            {outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine ausstehenden Anfragen.</p>
            ) : (
              <ul className="divide-y">
                {outgoing.map((c) => (
                  <li key={c.id}>
                    <PersonRow
                      name={c.to.name} slug={c.to.profile?.slug} avatarSeed={c.to.profile?.avatarSeed} subtitle={subtitleOf(c.to)}
                      meta={<>angefragt {formatRelative(c.createdAt)}</>}
                      action={<ConnectButton targetId={c.toId} targetName={c.to.name} state="pending_out" connectionId={c.id} />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card id="unternehmen" title="Gefolgte Unternehmen" icon={Building2} count={follows.length} action={<Link href="/unternehmen" className="text-xs text-muted-foreground hover:text-foreground">Entdecken</Link>}>
            {follows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Folge Unternehmen, um neue Ausschreibungen zuerst zu sehen.</p>
            ) : (
              <ul className="space-y-1">
                {follows.map((f) => (
                  <li key={f.id}>
                    <Link href={`/unternehmen/${f.company.slug}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                      <CompanyLogo seed={f.company.logoSeed} name={f.company.name} className="size-10" sizes="40px" textClassName="text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{f.company.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {industryName(f.company.industry)}
                          {f.company._count.opportunities > 0 && <> · <span className="text-primary">{f.company._count.opportunities} offen</span></>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
