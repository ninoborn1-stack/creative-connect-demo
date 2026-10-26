import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, CalendarDays, CheckCircle2, ExternalLink, FileSignature, FolderOpen, Link2, MapPin, Send, Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { categoryName, industryName } from "@/lib/constants";
import { formatDate, formatEur, formatRelative, parseJson } from "@/lib/format";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { Rating } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/companies/company-logo";
import { OpportunityStatusBadge, PitchStatusBadge } from "@/components/opportunities/opportunity-status";
import { PitchForm } from "@/components/opportunities/pitch-form";
import { OpportunityStatusControl, PitchActions, WithdrawPitchButton } from "@/components/opportunities/pitch-actions";
import { canManageOpportunity } from "@/components/opportunities/permissions";
import { matchOpportunity } from "@/components/opportunities/matching";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const o = await db.opportunity.findUnique({ where: { slug }, select: { title: true } });
  return { title: o ? o.title : "Ausschreibung" };
}

const COLUMNS = [
  { key: "eingereicht", label: "Eingereicht" },
  { key: "shortlist", label: "Shortlist" },
  { key: "angenommen", label: "Zusage" },
  { key: "abgelehnt", label: "Abgelehnt" },
] as const;

export default async function OpportunityPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp, me] = await Promise.all([params, searchParams, requireUser()]);
  const opp = await db.opportunity.findUnique({
    where: { slug },
    include: {
      company: true,
      author: { include: { profile: { select: { slug: true, avatarSeed: true } } } },
      pitches: {
        include: { creative: { include: { profile: { select: { slug: true, avatarSeed: true, headline: true, ratingAvg: true, ratingCount: true, verified: true, city: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!opp) notFound();

  const manage = canManageOpportunity(me, opp);
  const cats = parseJson<string[]>(opp.categories, []);
  const skills = parseJson<string[]>(opp.skills, []);
  const paragraphs = opp.description.split(/\n{2,}/).filter(Boolean);
  const myPitch = opp.pitches.find((p) => p.creativeId === me.id);
  const activePitches = opp.pitches.filter((p) => p.status !== "zurueckgezogen");
  const accepting = (opp.status === "offen" || opp.status === "in_auswahl") && opp.deadline > new Date();
  const isCreative = me.isCreative && Boolean(me.profile);
  const match = isCreative ? matchOpportunity(me.profile, opp) : null;
  const myLinks = me.profile?.website ? me.profile.website : "";
  const created = sp.neu === "1";

  return (
    <div className="space-y-6">
      <Link href="/ausschreibungen" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Alle Ausschreibungen
      </Link>
      {created && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden /> Ausschreibung veröffentlicht. Follower von {opp.company.name} wurden benachrichtigt.
        </p>
      )}

      <header className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Link href={`/unternehmen/${opp.company.slug}`} aria-label={`Unternehmensseite ${opp.company.name}`}>
            <CompanyLogo seed={opp.company.logoSeed} name={opp.company.name} className="size-16" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link href={`/unternehmen/${opp.company.slug}`} className="font-medium text-foreground hover:underline">{opp.company.name}</Link>
              {opp.company.verified && <BadgeCheck className="size-4 text-primary" aria-label="verifiziert" />}
              <span aria-hidden>·</span> {industryName(opp.industry)} <span aria-hidden>·</span> {opp.company.city}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{opp.title}</h1>
            <p className="mt-2 text-muted-foreground">{opp.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OpportunityStatusBadge status={opp.status} />
              {opp.licensing && <Badge variant="outline"><FileSignature aria-hidden /> Licensing / Buyout inklusive</Badge>}
              {opp.remote && <Badge variant="outline">Remote</Badge>}
              <span className="text-xs text-muted-foreground">veröffentlicht {formatRelative(opp.createdAt)} · {activePitches.length} Pitch{activePitches.length === 1 ? "" : "es"}</span>
            </div>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm lg:grid-cols-4">
          <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Wallet className="size-3.5" aria-hidden />Budget</dt><dd className="font-semibold">{formatEur(opp.budgetMin)} – {formatEur(opp.budgetMax)}</dd></div>
          <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden />Deadline</dt><dd>{formatDate(opp.deadline)} <span className="text-muted-foreground">({formatRelative(opp.deadline)})</span></dd></div>
          <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden />Start</dt><dd>{opp.startDate ? formatDate(opp.startDate) : "nach Absprache"}</dd></div>
          <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden />Ort</dt><dd>{opp.remote ? "Remote" : opp.location}</dd></div>
        </dl>
        {manage && opp.status !== "vergeben" && (
          <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Status verwalten</p>
            <OpportunityStatusControl opportunityId={opp.id} status={opp.status} />
          </div>
        )}
        {opp.projectId && (manage || myPitch?.status === "angenommen") && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">Vergeben – Vertrag, Zahlung und Abstimmung laufen im Projektraum.</p>
            <Button asChild size="sm"><Link href={`/projekte/${opp.projectId}`}><FolderOpen aria-hidden /> Zum Projektraum</Link></Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="beschreibung" className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 id="beschreibung" className="mb-3 text-lg font-semibold">Beschreibung</h2>
            <div className="max-w-prose space-y-3 leading-relaxed">
              {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
            </div>
          </section>
          <section aria-labelledby="anforderungen" className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 id="anforderungen" className="mb-3 text-lg font-semibold">Anforderungen</h2>
            <h3 className="text-xs font-medium text-muted-foreground">Kategorien</h3>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">{cats.map((c) => <li key={c}><Badge variant="secondary">{categoryName(c)}</Badge></li>)}</ul>
            {skills.length > 0 && (
              <>
                <h3 className="mt-4 text-xs font-medium text-muted-foreground">Skills</h3>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">{skills.map((s) => <li key={s}><Badge variant="outline">{s}</Badge></li>)}</ul>
              </>
            )}
            {opp.licensing && (
              <p role="note" className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                <FileSignature className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Nutzungsrechte bzw. Buyout sind Teil der Leistung. Umfang, Gebiet und Dauer werden bei Zusage in der Vertragsvorlage festgehalten – bitte im Preis berücksichtigen.
              </p>
            )}
          </section>

        </div>

        <aside className="min-w-0 space-y-6">
          {!manage || me.isAdmin ? (
            <section aria-labelledby="pitch-h" className="rounded-xl border bg-card p-4 sm:p-5 lg:sticky lg:top-20">
              <h2 id="pitch-h" className="mb-1 text-lg font-semibold">{myPitch && myPitch.status !== "zurueckgezogen" ? "Dein Pitch" : "Jetzt pitchen"}</h2>
              {match?.reason && !myPitch && <p className="mb-3 text-xs font-medium text-primary">{match.reason}</p>}
              {myPitch && myPitch.status !== "zurueckgezogen" ? (
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-2">Status: <PitchStatusBadge status={myPitch.status} /></p>
                  <p>Angebot: <strong>{formatEur(myPitch.price)}</strong> · {formatRelative(myPitch.createdAt)}</p>
                  <p className="rounded-lg bg-muted/50 p-3 whitespace-pre-line">{myPitch.message}</p>
                  {myPitch.status === "angenommen" && opp.projectId && (
                    <Button asChild className="w-full"><Link href={`/projekte/${opp.projectId}`}>Zum Projektraum <ArrowRight aria-hidden /></Link></Button>
                  )}
                  {["eingereicht", "shortlist"].includes(myPitch.status) && <WithdrawPitchButton pitchId={myPitch.id} />}
                </div>
              ) : !isCreative ? (
                <p className="text-sm text-muted-foreground">Pitchen können Kreative mit Profil im Netzwerk.</p>
              ) : !accepting ? (
                <p className="text-sm text-muted-foreground">Diese Ausschreibung nimmt keine Pitches mehr an.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">Kurz, konkret, mit Preis. Das Unternehmen sieht dein Profil mit Bewertungen und Referenzen.</p>
                  <PitchForm opportunityId={opp.id} budgetMin={opp.budgetMin} budgetMax={opp.budgetMax} defaultLinks={myLinks} />
                </>
              )}
            </section>
          ) : null}

          <section aria-labelledby="ansprech" className="rounded-xl border bg-card p-4">
            <h2 id="ansprech" className="text-base font-semibold">Ansprechperson</h2>
            <div className="mt-3 flex items-center gap-3">
              <UserAvatar name={opp.author.name} seed={opp.author.profile?.avatarSeed} className="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{opp.author.name}</p>
                <p className="truncate text-xs text-muted-foreground">{opp.author.jobTitle ?? "Team"} · {opp.company.name}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={`/unternehmen/${opp.company.slug}`}>Unternehmensseite <ExternalLink aria-hidden /></Link>
            </Button>
          </section>
        </aside>
      </div>

          {manage && (
            <section id="pitches" aria-labelledby="pitches-h" className="scroll-mt-24">
              <h2 id="pitches-h" className="mb-3 text-lg font-semibold">Pitches ({activePitches.length})</h2>
              {activePitches.length === 0 ? (
                <EmptyState icon={Send} title="Noch keine Pitches" description="Kreative, deren Profil passt, sehen die Ausschreibung unter „Für dich passend“." />
              ) : (
                <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {COLUMNS.map((col) => {
                      const list = activePitches.filter((p) => p.status === col.key);
                      return (
                        <section key={col.key} aria-labelledby={`col-${col.key}`} className="min-w-0 rounded-xl border bg-muted/30 p-3">
                          <h3 id={`col-${col.key}`} className="mb-2 flex items-center justify-between text-sm font-semibold">
                            {col.label} <span className="rounded-full bg-background px-2 text-xs tabular-nums">{list.length}</span>
                          </h3>
                          {list.length === 0 ? (
                            <p className="py-4 text-center text-xs text-muted-foreground">Leer</p>
                          ) : (
                            <ul className="space-y-3">
                              {list.map((p) => {
                                const pr = p.creative.profile;
                                const links = parseJson<string[]>(p.links, []);
                                return (
                                  <li key={p.id} className="rounded-lg border bg-card p-3" data-pitch-status={p.status}>
                                    <div className="flex items-start gap-2.5">
                                      <UserAvatar name={p.creative.name} seed={pr?.avatarSeed} className="size-10" />
                                      <div className="min-w-0 flex-1">
                                        {pr ? (
                                          <Link href={`/mitglieder/${pr.slug}`} className="block truncate text-sm font-semibold hover:underline">{p.creative.name}</Link>
                                        ) : (
                                          <p className="truncate text-sm font-semibold">{p.creative.name}</p>
                                        )}
                                        <p className="truncate text-xs text-muted-foreground">{pr?.headline}</p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-2">
                                          {pr && <Rating value={pr.ratingAvg} count={pr.ratingCount} />}
                                          {pr?.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="verifiziert" />}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="mt-2 line-clamp-4 text-sm">{p.message}</p>
                                    {links.length > 0 && (
                                      <ul className="mt-1.5 space-y-0.5">
                                        {links.map((l) => (
                                          <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"><Link2 className="size-3 shrink-0" aria-hidden /><span className="truncate">{l.replace(/^https?:\/\//, "")}</span></a></li>
                                        ))}
                                      </ul>
                                    )}
                                    <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="text-sm font-semibold text-foreground">{formatEur(p.price)}</span>
                                      <span>{formatRelative(p.createdAt)}</span>
                                    </p>
                                    {(p.status === "eingereicht" || p.status === "shortlist") && opp.status !== "vergeben" && opp.status !== "geschlossen" && (
                                      <div className="mt-2 border-t pt-2">
                                        <PitchActions pitchId={p.id} status={p.status} creativeName={p.creative.name} price={p.price} opportunityTitle={opp.title} />
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
    </div>
  );
}
