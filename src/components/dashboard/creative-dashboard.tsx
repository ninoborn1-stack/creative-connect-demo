import Link from "next/link";
import { addDays, startOfDay, subDays } from "date-fns";
import {
  CalendarClock, Crown, Eye, FolderKanban, Inbox, Mail, PiggyBank, Scale, UserCheck, UserPlus,
} from "lucide-react";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { formatDate, formatEur, formatRelative, parseJson } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardCard, Stat } from "./dashboard-card";
import { ProToggle } from "./pro-toggle";
import { RequestActions } from "./request-actions";
import { FreeSlotsBlock, NestoCalendarBlock } from "@/components/sessions/profile-blocks";
import { upcomingBookings } from "@/components/sessions/session-data";
import { PointsCard } from "@/components/points/points-card";
import { getPointSummary } from "@/components/points/points-data";
import { cn } from "@/lib/utils";

const INVITE_STATUS: Record<string, string> = { offen: "Offen", eingeloest: "Eingelöst", abgelaufen: "Abgelaufen", freigabe: "Wartet auf Freigabe" };

type Appointment = { date: Date; title: string; detail: string; href?: string; kind: string };

export async function CreativeDashboard({ user }: { user: CurrentUser }) {
  const today = startOfDay(new Date());
  const horizon = addDays(today, 42);
  const profile = user.profile;

  const [requests, myRoles, payments, views, viewCount7, invites, portfolioCount, bookings, rsvps, fees] = await Promise.all([
    db.request.findMany({
      where: { creativeId: user.id, status: { in: ["offen", "gegenangebot"] } },
      include: { project: { include: { owner: true } }, role: true },
      orderBy: { createdAt: "desc" },
    }),
    db.projectRole.findMany({
      where: { assigneeId: user.id, project: { status: { notIn: ["storniert"] } } },
      include: { project: { include: { milestones: { where: { done: false, dueDate: { gte: today, lte: horizon } } }, owner: true } } },
    }),
    db.payment.findMany({ where: { payeeId: user.id }, include: { project: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } }),
    db.profileView.findMany({
      where: { viewedId: user.id },
      include: { viewer: { include: { profile: { select: { slug: true, avatarSeed: true, headline: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.profileView.count({ where: { viewedId: user.id, createdAt: { gte: subDays(today, 7) } } }),
    db.invite.findMany({ where: { senderId: user.id }, orderBy: { createdAt: "desc" } }),
    db.portfolioItem.count({ where: { userId: user.id } }),
    db.venueBooking.findMany({ where: { userId: user.id, status: "bestaetigt", date: { gte: today, lte: horizon } }, include: { venue: true } }),
    db.rSVP.findMany({ where: { userId: user.id, event: { date: { gte: today, lte: horizon } } }, include: { event: true } }),
    getFees(),
  ]);
  const [sessionBookings, pointSummary] = await Promise.all([upcomingBookings(user.id, 10), getPointSummary(user.id)]);

  // Laufende Projekte
  const running = myRoles.filter((r) => ["bestaetigt", "produktion", "abnahme"].includes(r.project.status));

  // Nächste Termine
  const appointments: Appointment[] = [];
  for (const r of myRoles) {
    const p = r.project;
    if (p.startDate >= today && p.startDate <= horizon && p.status !== "abgeschlossen")
      appointments.push({ date: p.startDate, title: `Projektstart: ${p.title}`, detail: `${r.title} · ${p.city}`, href: `/projekte/${p.id}`, kind: "Projekt" });
    for (const m of p.milestones)
      appointments.push({ date: m.dueDate, title: m.title, detail: p.title, href: `/projekte/${p.id}`, kind: "Meilenstein" });
  }
  for (const b of bookings)
    appointments.push({ date: b.date, title: `Buchung ${b.venue.name}`, detail: b.fullDay ? "ganztägig" : `${b.startHour}–${b.endHour} Uhr`, href: `/studios/${b.venue.slug}`, kind: "Studio" });
  for (const r of rsvps)
    appointments.push({ date: r.event.date, title: r.event.title, detail: `${r.event.venueName}, ${r.event.city}`, href: `/events/${r.event.slug}`, kind: "Event" });
  for (const b of sessionBookings)
    if (b.session.date <= horizon)
      appointments.push({ date: b.session.date, title: `${b.session.title} mit Nesto`, detail: `${b.session.startHour}–${b.session.endHour} Uhr · ${b.session.location}`, href: "/sessions", kind: "Session" });
  appointments.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Profil-Vollständigkeit
  const skills = parseJson<string[]>(profile?.skills, []);
  const checks: [string, boolean][] = profile
    ? [
        ["Aussagekräftige Headline", profile.headline.length >= 10],
        ["Bio mit mind. 120 Zeichen", profile.bio.length >= 120],
        ["Mind. 3 Skills", skills.length >= 3],
        ["Tagessatz-Rahmen", profile.dayRateMin > 0 && profile.dayRateMax >= profile.dayRateMin],
        ["Mind. 3 Portfolio-Arbeiten", portfolioCount >= 3],
        ["Instagram oder Website", Boolean(profile.instagram || profile.website)],
        ["Steuer-ID hinterlegt (DAC7)", profile.taxIdProvided],
        ["Verifiziert", profile.verified],
      ]
    : [];
  const completeness = checks.length ? Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100) : 0;
  const missing = checks.filter(([, ok]) => !ok).map(([l]) => l);

  // Auszahlungen
  const paidOut = payments.filter((p) => p.status === "ausgezahlt").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "reserviert" || p.status === "freigegeben").reduce((s, p) => s + p.amount, 0);

  // Wer hat mich angesehen (je Person nur der letzte Besuch)
  const seen = new Set<string>();
  const uniqueViews = views.filter((v) => (seen.has(v.viewerId) ? false : (seen.add(v.viewerId), true))).slice(0, 6);

  const share = profile?.topClientShare ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Offene Anfragen" value={requests.length} />
        <Stat label="Laufende Projekte" value={running.length} />
        <Stat label="Ausgezahlt (gesamt)" value={formatEur(paidOut)} hint={`${formatEur(pending)} unterwegs`} />
        <Stat label="Profilaufrufe (7 Tage)" value={viewCount7} />
      </div>

      {user.isAdmin ? (
        <FreeSlotsBlock own />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <NestoCalendarBlock userId={user.id} />
          <PointsCard summary={pointSummary} />
        </div>
      )}

      <DashboardCard id="anfragen" title="Offene Anfragen" icon={Inbox}>
        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title="Keine offenen Anfragen" description="Ein vollständiges Profil und aktuelle Verfügbarkeit erhöhen deine Sichtbarkeit." />
        ) : (
          <ul className="divide-y">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/projekte/${r.projectId}`} className="font-medium hover:underline">{r.project.title}</Link>
                    <StatusBadge status={r.status} kind="request" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.role.title} · {r.project.owner.company ?? r.project.owner.name} · {r.project.city} · ab {formatDate(r.project.startDate)}
                  </p>
                  <p className="mt-1 text-sm">
                    Angebot <strong>{formatEur(r.price)}</strong>
                    {r.status === "gegenangebot" && r.counterPrice && <> · dein Gegenangebot <strong>{formatEur(r.counterPrice)}</strong> (wartet auf Antwort)</>}
                  </p>
                  {r.note && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">„{r.note}“</p>}
                </div>
                <RequestActions requestId={r.id} price={r.price} projectTitle={r.project.title} roleTitle={r.role.title} />
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard id="termine" title="Nächste Termine" icon={CalendarClock}>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">In den nächsten sechs Wochen stehen keine Termine an.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.slice(0, 7).map((a, i) => (
                <li key={i}>
                  <Link href={a.href ?? "#"} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-muted py-1 text-center leading-tight">
                      <span className="text-base font-bold">{a.date.getDate()}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{a.date.toLocaleDateString("de-DE", { month: "short" })}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                    <Badge variant="outline" className="shrink-0">{a.kind}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard id="laufend" title="Laufende Projekte" icon={FolderKanban} href="/projekte">
          {running.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aktuell keine laufenden Projekte.</p>
          ) : (
            <ul className="space-y-2">
              {running.map((r) => (
                <li key={r.id}>
                  <Link href={`/projekte/${r.projectId}`} className="flex items-center justify-between gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.project.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{r.title} · {formatEur(r.budget)}</span>
                    </span>
                    <StatusBadge status={r.project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <DashboardCard id="auszahlungen" title="Auszahlungen" icon={PiggyBank} href="/finanzen">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Zahlungen. Honorare werden beim Zahlungsdienstleister reserviert und nach Abnahme ausgezahlt.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium sm:px-2">Projekt</th>
                  <th scope="col" className="px-2 py-2 font-medium">Rolle</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Honorar</th>
                  <th scope="col" className="px-4 py-2 font-medium sm:px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 sm:px-2">
                      {p.project ? <Link href={`/projekte/${p.project.id}`} className="hover:underline">{p.project.title}</Link> : "–"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{p.label}</td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">{formatEur(p.amount)}</td>
                    <td className="px-4 py-2 sm:px-2"><StatusBadge status={p.status} kind="payment" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">0 % Provision für Kreative – dein Honorar kommt vollständig bei dir an.</p>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard id="vollstaendigkeit" title="Profil-Vollständigkeit" icon={UserCheck} href="/profil" hrefLabel="Bearbeiten">
          <div className="flex items-center gap-3">
            <Progress value={completeness} className="h-2" aria-label="Profil-Vollständigkeit" />
            <span className="w-12 text-right text-sm font-semibold tabular-nums">{completeness} %</span>
          </div>
          {missing.length ? (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {missing.map((m) => <li key={m}>· {m}</li>)}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Dein Profil ist vollständig – stark!</p>
          )}
        </DashboardCard>

        <DashboardCard id="aufrufe" title="Wer hat mich angesehen" icon={Eye}>
          {uniqueViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Profilaufrufe.</p>
          ) : (
            <ul className="space-y-2">
              {uniqueViews.map((v) => {
                const inner = (
                  <>
                    <UserAvatar name={v.viewer.name} seed={v.viewer.profile?.avatarSeed} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{v.viewer.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{v.viewer.profile?.headline ?? v.viewer.company ?? "Auftraggeber:in"}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(v.createdAt)}</span>
                  </>
                );
                return (
                  <li key={v.id}>
                    {v.viewer.profile ? (
                      <Link href={`/mitglieder/${v.viewer.profile.slug}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50">{inner}</Link>
                    ) : (
                      <div className="flex items-center gap-3 p-1.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard id="selbststaendigkeit" title="Anteil größter Auftraggeber" icon={Scale} className="lg:col-span-2">
          <div className="flex items-end gap-3">
            <p className={cn("text-4xl font-bold tabular-nums", share > 50 ? "text-amber-500" : "text-foreground")}>{share} %</p>
            <p className="pb-1 text-sm text-muted-foreground">deines Umsatzes der letzten 12 Monate</p>
          </div>
          <Progress value={share} className="mt-3 h-2" aria-label="Anteil größter Auftraggeber" />
          <p className="mt-2 text-xs text-muted-foreground">
            {share > 50
              ? "Mehr als die Hälfte von einem Auftraggeber – das kann bei der Prüfung auf Scheinselbstständigkeit eine Rolle spielen."
              : "Gut verteilt auf mehrere Auftraggeber:innen."}
          </p>
          <div role="note" className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Du bist selbstständig.</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              <li>Du setzt deine Preise selbst.</li>
              <li>Du lehnst Anfragen frei und ohne Begründung ab.</li>
              <li>Du arbeitest weisungsfrei – Ort, Zeit und Umsetzung bestimmst du.</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Hinweis, kein Rechtsrat.</p>
          </div>
        </DashboardCard>

        <DashboardCard id="pro" title="Pro-Abo" icon={Crown}>
          <p className="text-sm">
            {profile?.isPro ? (
              <><Badge>PRO aktiv</Badge> <span className="text-muted-foreground">– {formatEur(fees.proPriceEur)}/Monat</span></>
            ) : (
              <>Mehr Sichtbarkeit, Statistiken und Profil-Hervorhebung für <strong>{formatEur(fees.proPriceEur)}/Monat</strong>.</>
            )}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>· Hervorhebung im Verzeichnis</li>
            <li>· Erweiterte Profil-Statistiken</li>
            <li>· Unbegrenzte Portfolio-Arbeiten</li>
          </ul>
          <div className="mt-4">
            <ProToggle isPro={Boolean(profile?.isPro)} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Demo – es wird nichts abgebucht.</p>
        </DashboardCard>
      </div>

      <DashboardCard id="einladungen" title="Meine Einladungen" icon={Mail} href="/einladen" hrefLabel="Einladen">
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Du hast noch niemanden eingeladen. Kennst du gute Leute? Lade sie ins Netzwerk ein.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <span className="min-w-0">
                  <code className="block truncate text-sm font-medium">{i.code}</code>
                  <span className="text-xs text-muted-foreground">
                    {i.redeemedAt ? `eingelöst am ${formatDate(i.redeemedAt)}` : `gültig bis ${formatDate(i.expiresAt)}`}
                  </span>
                </span>
                <Badge variant={i.status === "eingeloest" ? "default" : "outline"}>{INVITE_STATUS[i.status] ?? i.status}</Badge>
              </li>
            ))}
          </ul>
        )}
        {invites.length > 0 && (
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/einladen"><UserPlus aria-hidden /> Neue Einladung erstellen</Link>
          </Button>
        )}
      </DashboardCard>
    </div>
  );
}
