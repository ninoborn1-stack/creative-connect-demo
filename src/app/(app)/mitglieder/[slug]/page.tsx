import { CreatorWorksSection } from "@/components/licensing/creator-works";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { subHours } from "date-fns";
import {
  CalendarDays, Camera, CheckCircle2, Clapperboard, ExternalLink, Film, AtSign, Globe, MapPin, Music, Pencil, Ruler,
  Sparkles, Star, Wrench, Briefcase, Building2, Trophy, Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { VENUE_TYPES } from "@/lib/constants";
import { formatDate, formatEur, formatRelative, parseJson } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { AvailabilityDot, CategoryBadge, Rating, VerifiedBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCrewDialog } from "@/components/members/add-to-crew-dialog";
import { AudioPlayer } from "@/components/members/audio-player";
import { AvailabilityCalendar } from "@/components/members/availability-calendar";
import { getCrewTargets } from "@/components/members/crew-targets";
import { ShowreelPoster } from "@/components/members/showreel-poster";
import { FreeSlotsBlock, NestoCalendarBlock } from "@/components/sessions/profile-blocks";
import { LevelBadge, PointsCard } from "@/components/points/points-card";
import { getPointSummary, sessionsAttended } from "@/components/points/points-data";
import { ConnectButton } from "@/components/network/connect-button";
import { getConnectedIds, getRelations, relationOf } from "@/components/network/network-data";
import { CompanyLogo } from "@/components/companies/company-logo";
import { PitchStatusBadge } from "@/components/opportunities/opportunity-status";
import { ArtistRequestDialog } from "@/components/starter/artist-request-dialog";
import { FEATURES } from "@/lib/features";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.profile.findUnique({ where: { slug }, include: { user: { select: { name: true } } } });
  return { title: p ? p.user.name : "Profil" };
}

function Section({ id, title, icon: Icon, children, className }: { id: string; title: string; icon?: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="mb-3 flex items-center gap-2 text-lg font-semibold">
        {Icon && <Icon className="size-5 text-primary" aria-hidden />} {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProfilePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, sp, me] = await Promise.all([params, searchParams, requireUser()]);
  const profile = await db.profile.findUnique({
    where: { slug },
    include: {
      user: {
        include: {
          invitedBy: { include: { profile: { select: { slug: true } } } },
          portfolio: { orderBy: { sort: "asc" } },
          credits: {
            orderBy: { year: "desc" },
            include: { project: { select: { id: true, owner: { select: { company: true, companyRef: { select: { slug: true, name: true, logoSeed: true } } } } } } },
          },
          companyRef: { select: { slug: true, name: true, logoSeed: true, verified: true } },
          reviewsReceived: { orderBy: { createdAt: "desc" }, include: { author: { include: { profile: { select: { slug: true, avatarSeed: true } } } } } },
          venues: true,
          equipment: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!profile || profile.user.status === "gesperrt") notFound();

  const user = profile.user;
  const isOwn = user.id === me.id;

  // Profilaufruf protokollieren (max. einmal pro Stunde je Betrachter:in)
  if (!isOwn) {
    const recent = await db.profileView.findFirst({ where: { viewedId: user.id, viewerId: me.id, createdAt: { gte: subHours(new Date(), 1) } } });
    if (!recent) await db.profileView.create({ data: { viewedId: user.id, viewerId: me.id } });
  }

  const isHost = user.isAdmin; // Nesto: Gastgeber der Sessions, sammelt selbst keine Punkte
  const [crewTargets, pointSummary, sessionCount, theirContacts, myContacts, relations, pitches] = await Promise.all([
    isOwn ? Promise.resolve([]) : getCrewTargets(me.id),
    getPointSummary(user.id),
    sessionsAttended(user.id),
    getConnectedIds(user.id),
    isOwn ? Promise.resolve(new Set<string>()) : getConnectedIds(me.id),
    isOwn ? Promise.resolve(null) : getRelations(me.id),
    db.pitch.findMany({
      where: { creativeId: user.id, status: { not: "zurueckgezogen" } },
      include: { opportunity: { select: { slug: true, title: true, projectId: true, company: { select: { slug: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const mutualIds = isOwn ? [] : [...theirContacts].filter((id) => myContacts.has(id));
  const mutualPeople = mutualIds.length
    ? await db.user.findMany({ where: { id: { in: mutualIds.slice(0, 3) } }, select: { id: true, name: true, profile: { select: { avatarSeed: true } } } })
    : [];
  const relation = relations ? relationOf(relations, user.id) : null;
  const wonPitches = pitches.filter((p) => p.status === "angenommen");
  const showPitches = isOwn ? pitches : wonPitches;

  // Erfahrung: Credits nach Unternehmen gruppieren (über das Projekt der Auftraggeber:in)
  type ExpGroup = { key: string; name: string; slug?: string; logoSeed?: string; credits: typeof user.credits };
  const expGroups = new Map<string, ExpGroup>();
  for (const c of user.credits) {
    const ref = c.project?.owner.companyRef;
    const label = ref?.name ?? c.project?.owner.company ?? null;
    const key = ref?.slug ?? (label ? `name:${label}` : "_frei");
    if (!expGroups.has(key)) expGroups.set(key, { key, name: label ?? "Eigene & weitere Projekte", slug: ref?.slug, logoSeed: ref?.logoSeed, credits: [] });
    expGroups.get(key)!.credits.push(c);
  }
  const experience = [...expGroups.values()].sort((a, b) => (a.key === "_frei" ? 1 : b.key === "_frei" ? -1 : b.credits[0].year - a.credits[0].year));
  const cats = parseJson<string[]>(profile.categories, []);
  const skills = parseJson<string[]>(profile.skills, []);
  const busy = parseJson<string[]>(profile.busyDates, []);
  const equipment = parseJson<string[]>(profile.equipment, []);
  const images = user.portfolio.filter((i) => i.type === "bild");
  const audios = user.portfolio.filter((i) => i.type === "audio");
  const videos = user.portfolio.filter((i) => i.type === "video");
  const hasSedcard = profile.heightCm || profile.hairColor || profile.eyeColor || profile.playingAge || profile.languages;
  const saved = sp.gespeichert === "1";

  return (
    <div className="space-y-8">
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden /> Profil gespeichert.
        </p>
      )}

      {/* Kopfbereich */}
      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative aspect-[3/1] min-h-36 bg-muted">
          <StockImage seed={profile.coverSeed} w={1600} h={530} priority sizes="(max-width: 1200px) 100vw, 1200px" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" aria-hidden />
        </div>
        <div className="relative -mt-14 flex flex-col gap-4 px-4 pb-5 sm:-mt-16 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <UserAvatar name={user.name} seed={profile.avatarSeed} className="size-24 ring-4 ring-card sm:size-28" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
                {profile.isPro && <Badge>PRO</Badge>}
              </div>
              <p className="text-muted-foreground">{profile.headline}</p>
              {user.companyRef && (
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Building2 className="size-4 text-muted-foreground" aria-hidden />
                  {user.jobTitle ? `${user.jobTitle} bei ` : ""}
                  {FEATURES.unternehmen ? (
                    <Link href={`/unternehmen/${user.companyRef.slug}`} className="font-medium text-primary hover:underline">{user.companyRef.name}</Link>
                  ) : (
                    <span className="font-medium">{user.companyRef.name}</span>
                  )}
                </p>
              )}
              {FEATURES.netzwerk && <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {isOwn ? (
                  <Link href="/netzwerk" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <Users className="size-4" aria-hidden /> {theirContacts.size} Kontakt{theirContacts.size === 1 ? "" : "e"}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Users className="size-4 text-muted-foreground" aria-hidden /> {theirContacts.size} Kontakt{theirContacts.size === 1 ? "" : "e"}
                  </span>
                )}
                {mutualIds.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="flex -space-x-2" aria-hidden>
                      {mutualPeople.map((m) => <UserAvatar key={m.id} name={m.name} seed={m.profile?.avatarSeed} className="size-5 ring-2 ring-card" />)}
                    </span>
                    {mutualIds.length} gemeinsame{mutualIds.length === 1 ? "r Kontakt" : " Kontakte"}
                  </span>
                )}
              </p>}
              {!isHost && (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <LevelBadge label={pointSummary.level.label} />
                  {FEATURES.sessions && <span>{sessionCount === 1 ? "1 Session" : `${sessionCount} Sessions`} mit Nesto</span>}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cats.map((c) => <CategoryBadge key={c} slug={c} />)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwn ? (
              <Button asChild>
                <Link href="/profil"><Pencil aria-hidden /> Profil bearbeiten</Link>
              </Button>
            ) : (
              <>
              {FEATURES.netzwerk && relation && (
                <ConnectButton targetId={user.id} targetName={user.name} state={relation.state} connectionId={relation.connectionId} size="lg" showDecline />
              )}
              <ArtistRequestDialog creative={{ id: user.id, name: user.name }} suggestedBudget={profile.dayRateMin} defaultCity={me.profile?.city} />
              {FEATURES.briefing && crewTargets.length > 0 && (
                <AddToCrewDialog creative={{ id: user.id, name: user.name, categories: cats }} projects={crewTargets} label="Zu Projekt hinzufügen" size="lg" />
              )}
              </>
            )}
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-3 border-t px-4 py-4 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Ort</dt>
            <dd className="flex items-center gap-1"><MapPin className="size-4 text-muted-foreground" aria-hidden />{profile.city}, {profile.state} · reist bis {profile.travelRadiusKm} km</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Preisrahmen (Tagessatz)</dt>
            <dd className="font-semibold">{formatEur(profile.dayRateMin)} – {formatEur(profile.dayRateMax)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="flex flex-wrap items-center gap-3">
              <AvailabilityDot value={profile.availability} showLabel />
              {profile.verified && <VerifiedBadge />}
              <Rating value={profile.ratingAvg} count={profile.ratingCount} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Im Netzwerk seit</dt>
            <dd>
              {formatDate(profile.memberSince)}
              {user.invitedBy && (
                <>
                  {" · eingeladen von "}
                  {user.invitedBy.profile ? (
                    <Link href={`/mitglieder/${user.invitedBy.profile.slug}`} className="text-primary hover:underline">{user.invitedBy.name}</Link>
                  ) : (
                    user.invitedBy.name
                  )}
                </>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <Section id="ueber" title="Über mich">
            <p className="max-w-prose leading-relaxed whitespace-pre-line">{profile.bio}</p>
            {skills.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
                {skills.map((s) => (
                  <li key={s}>
                    <Link href={`/mitglieder?skill=${encodeURIComponent(s)}`} className="inline-flex rounded-full border px-2.5 py-0.5 text-xs hover:border-primary/50">{s}</Link>
                  </li>
                ))}
              </ul>
            )}
            {(profile.instagram || profile.website) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.instagram && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                      <AtSign aria-hidden /> {profile.instagram}
                    </a>
                  </Button>
                )}
                {profile.website && (
                  <Button asChild variant="outline" size="sm">
                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                      <Globe aria-hidden /> Website <ExternalLink aria-hidden />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Section>

          {audios.length > 0 && (
            <Section id="hoerproben" title="Hörproben" icon={Music}>
              <div className="grid gap-3">
                {audios.map((a) => (
                  <AudioPlayer key={a.id} src={a.audioUrl ?? "/demo-audio/demo-1.wav"} title={a.title} subtitle={a.credits ?? undefined} />
                ))}
              </div>
            </Section>
          )}

          {videos.length > 0 && (
            <Section id="showreel" title="Showreel & Videos" icon={Film}>
              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((v) => <ShowreelPoster key={v.id} title={v.title} seed={v.imageSeed ?? v.id} />)}
              </div>
            </Section>
          )}

          {images.length > 0 && (
            <Section id="galerie" title="Galerie" icon={Camera}>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((img) => (
                  <li key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {img.url?.startsWith("/uploads/") ? (
                      // eslint-disable-next-line @next/next/no-img-element -- lokale Uploads der Demo
                      <img src={img.url} alt={img.title} className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <StockImage seed={img.imageSeed ?? img.id} w={600} h={600} alt={img.title} sizes="(max-width: 640px) 50vw, 25vw" className="transition-transform duration-300 group-hover:scale-105" />
                    )}
                    {img.aiMarked && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Sparkles className="size-3" aria-hidden /> KI-generiert
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-xs text-white">{img.title}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {hasSedcard && (
            <Section id="sedcard" title="Sedcard" icon={Clapperboard}>
              <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3">
                {[
                  ["Größe", profile.heightCm ? `${profile.heightCm} cm` : null],
                  ["Haarfarbe", profile.hairColor],
                  ["Augenfarbe", profile.eyeColor],
                  ["Spielalter", profile.playingAge],
                  ["Sprachen", profile.languages],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {(equipment.length > 0 || (FEATURES.studios && user.venues.length > 0)) && (
            <Section id="studio" title="Studio-Ausstattung" icon={Ruler}>
              {equipment.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {equipment.map((e) => <li key={e}><Badge variant="outline">{e}</Badge></li>)}
                </ul>
              )}
              {FEATURES.studios && user.venues.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {user.venues.map((v) => {
                    const seeds = parseJson<string[]>(v.imageSeeds, []);
                    return (
                      <li key={v.id}>
                        <Link href={`/studios/${v.slug}`} className="group flex gap-3 rounded-xl border bg-card p-3 hover:border-primary/40">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <StockImage seed={seeds[0] ?? v.slug} w={200} h={200} sizes="64px" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium group-hover:underline">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{VENUE_TYPES[v.type] ?? v.type} · {v.city}</p>
                            <p className="text-xs">ab {formatEur(v.pricePerHour)}/Std.</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          {FEATURES.lizenzen && <CreatorWorksSection userId={user.id} limit={6} />}

          <Section id="credits" title="Erfahrung & Credits" icon={Briefcase}>
            {user.credits.length === 0 ? (
              <EmptyState title="Noch keine Credits" description="Credits entstehen automatisch aus abgeschlossenen Projekten." />
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {experience.map((g) => (
                  <li key={g.key} className="flex gap-3 p-4">
                    {g.logoSeed ? (
                      <CompanyLogo seed={g.logoSeed} name={g.name} className="size-11" sizes="44px" textClassName="text-xs" />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg border bg-muted" aria-hidden><Briefcase className="size-5 text-muted-foreground" /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">
                        {g.slug && FEATURES.unternehmen ? <Link href={`/unternehmen/${g.slug}`} className="hover:underline">{g.name}</Link> : g.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {g.credits.length} Projekt{g.credits.length === 1 ? "" : "e"} · {Math.min(...g.credits.map((c) => c.year))}
                        {Math.max(...g.credits.map((c) => c.year)) !== Math.min(...g.credits.map((c) => c.year)) && `–${Math.max(...g.credits.map((c) => c.year))}`}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {g.credits.map((c) => (
                          <li key={c.id} className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="min-w-0">
                              {c.project ? (
                                <Link href={`/projekte/${c.project.id}`} className="font-medium hover:underline">{c.title}</Link>
                              ) : (
                                <span className="font-medium">{c.title}</span>
                              )}
                              <span className="text-muted-foreground"> · {c.role}</span>
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">{c.year}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {FEATURES.ausschreibungen && <Section id="pitches" title="Pitches & Aufträge" icon={Trophy}>
            <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-xl border bg-card p-3"><dt className="text-xs text-muted-foreground">Zusagen über Ausschreibungen</dt><dd className="text-2xl font-bold tabular-nums">{wonPitches.length}</dd></div>
              <div className="rounded-xl border bg-card p-3"><dt className="text-xs text-muted-foreground">Projekte über Creative Connect</dt><dd className="text-2xl font-bold tabular-nums">{user.credits.filter((c) => c.project).length}</dd></div>
            </dl>
            {showPitches.length > 0 ? (
              <ul className="mt-3 divide-y rounded-xl border bg-card">
                {showPitches.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <Link href={`/ausschreibungen/${p.opportunity.slug}`} className="font-medium hover:underline">{p.opportunity.title}</Link>
                      <span className="text-muted-foreground"> · </span>
                      <Link href={`/unternehmen/${p.opportunity.company.slug}`} className="text-muted-foreground hover:underline">{p.opportunity.company.name}</Link>
                    </span>
                    <PitchStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{isOwn ? <>Noch keine Pitches – <Link href="/ausschreibungen" className="text-primary hover:underline">passende Ausschreibungen ansehen</Link>.</> : "Noch keine Zusagen über Ausschreibungen."}</p>
            )}
          </Section>}

          <Section id="bewertungen" title={`Bewertungen (${user.reviewsReceived.length})`} icon={Star}>
            {user.reviewsReceived.length === 0 ? (
              <EmptyState icon={Star} title="Noch keine Bewertungen" />
            ) : (
              <ul className="grid gap-3">
                {user.reviewsReceived.slice(0, 8).map((r) => (
                  <li key={r.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={r.author.name} seed={r.author.profile?.avatarSeed} className="size-9" />
                      <div className="min-w-0 flex-1">
                        {r.author.profile ? (
                          <Link href={`/mitglieder/${r.author.profile.slug}`} className="text-sm font-medium hover:underline">{r.author.name}</Link>
                        ) : (
                          <p className="text-sm font-medium">{r.author.company ?? r.author.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</p>
                      </div>
                      <span className="flex" aria-label={`${r.rating} von 5 Sternen`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={i < r.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-muted-foreground/40"} aria-hidden />
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="space-y-8">
          {isHost ? (
            FEATURES.sessions && <FreeSlotsBlock own={isOwn} />
          ) : (
            isOwn && (
              <div className="space-y-4">
                {FEATURES.sessions && <NestoCalendarBlock userId={user.id} />}
                <PointsCard summary={pointSummary} />
              </div>
            )
          )}
          <Section id="kalender" title="Verfügbarkeit" icon={CalendarDays} className="rounded-xl border bg-card p-4">
            <AvailabilityCalendar busyDates={busy} fullyBooked={profile.availability === "ausgebucht"} />
            {!isOwn && (
              <p className="mt-3 text-xs text-muted-foreground">Angefragte Termine bestätigt {user.name.split(" ")[0]} selbst – Preise und Zusagen sind frei verhandelbar.</p>
            )}
          </Section>

          {FEATURES.equipment && <Section id="equipment" title="Equipment-Angebote" icon={Wrench}>
            {user.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aktuell keine Angebote in der Equipment-Börse.</p>
            ) : (
              <ul className="grid gap-3">
                {user.equipment.map((e) => (
                  <li key={e.id}>
                    <Link href="/equipment" className="group flex gap-3 rounded-xl border bg-card p-3 hover:border-primary/40">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <StockImage seed={e.imageSeed} w={200} h={200} sizes="56px" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:underline">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.mode === "verleih" ? `Verleih · ${formatEur(e.price)}/Tag` : `Verkauf · ${formatEur(e.price)}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>}
        </aside>
      </div>
    </div>
  );
}
