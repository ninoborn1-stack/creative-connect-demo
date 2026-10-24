import type { Metadata } from "next";
import Link from "next/link";
import { addDays, format, getISOWeek, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarHeart, ChevronLeft, ChevronRight, ClipboardCheck, Gift, History, Info } from "lucide-react";
import { requireUser } from "@/lib/session";
import { SESSION_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/sessions/session-card";
import { SessionDialog } from "@/components/sessions/session-dialog";
import { BookingStatusBadge } from "@/components/sessions/session-badges";
import { SlotDialog } from "@/components/sessions/slot-dialog";
import { earnedBySession, loadSessions, toSessionDto } from "@/components/sessions/session-data";
import { timeLabel, type SessionDto } from "@/components/sessions/session-utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sessions mit Nesto" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const WEEKS = 4; // aktuelle + nächste 3 Wochen

function href(week: number, type: string | null) {
  const p = new URLSearchParams();
  if (week) p.set("woche", String(week));
  if (type) p.set("typ", type);
  const q = p.toString();
  return q ? `/sessions?${q}` : "/sessions";
}

function MySessionRow({ s, isHost }: { s: SessionDto; isHost: boolean }) {
  const d = new Date(s.date);
  return (
    <li>
      <SessionDialog session={s} isHost={isHost}>
        <button type="button" className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50", s.past && "opacity-75")}>
          <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-muted py-1 text-center leading-tight">
            <span className="text-base font-bold">{d.getDate()}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{d.toLocaleDateString("de-DE", { month: "short" })}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{s.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{format(d, "EEEE", { locale: de })}, {timeLabel(s.startHour, s.endHour)}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {s.status === "abgesagt" ? <BookingStatusBadge status="abgesagt" /> : <BookingStatusBadge status={s.myBooking?.status ?? "gebucht"} />}
            {s.myBooking?.earned ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{s.myBooking.earned} Punkte</span> : null}
          </span>
        </button>
      </SessionDialog>
    </li>
  );
}

export default async function SessionsPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const isHost = user.isAdmin;
  const viewer = { id: user.id, isAdmin: isHost };

  const week = Math.min(WEEKS - 1, Math.max(0, Number.parseInt(String(sp.woche ?? "0"), 10) || 0));
  const typeParam = typeof sp.typ === "string" && SESSION_TYPES[sp.typ] ? sp.typ : null;
  const now = new Date();
  const today = startOfDay(now);
  const monday = addDays(startOfWeek(today, { weekStartsOn: 1 }), week * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [weekSessions, mySessions, openCheckIns] = await Promise.all([
    loadSessions({ date: { gte: monday, lt: addDays(monday, 7) }, ...(typeParam ? { type: typeParam } : {}) }),
    isHost ? Promise.resolve([]) : loadSessions({ bookings: { some: { userId: user.id } } }),
    isHost ? loadSessions({ status: "geplant", date: { lte: today }, bookings: { some: { status: "gebucht" } } }) : Promise.resolve([]),
  ]);
  const earned = await earnedBySession(user.id, mySessions.map((s) => s.id));
  const weekDtos = weekSessions.map((s) => toSessionDto(s, viewer, earned));
  const mine = mySessions.map((s) => toSessionDto(s, viewer, earned));
  const upcoming = mine.filter((s) => !s.past && s.status === "geplant" && s.myBooking?.status === "gebucht");
  const past = mine.filter((s) => !upcoming.includes(s)).reverse().slice(0, 12);
  const checkIns = openCheckIns.map((s) => toSessionDto(s, viewer, earned));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions mit Nesto"
        description="Nestos Produktionskalender: Beats bauen, Songs schreiben, Mix-Feedback holen oder beim Open Studio vorbeikommen."
        actions={isHost ? <SlotDialog defaultDate={format(today, "yyyy-MM-dd")} /> : undefined}
      />

      <div role="note" className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-medium">Für Mitglieder kostenlos – und jede Teilnahme bringt Punkte.</p>
          <p className="mt-0.5 text-muted-foreground">
            Nesto teilt seine Studiozeit mit der Community, ihr bringt Ideen, Stimmen und Energie mit. Punkte kannst du gegen Belohnungen wie Studiozeit oder Mix-Feedback eintauschen.{" "}
            <Link href="/punkte" className="font-medium text-primary underline-offset-4 hover:underline">Zu deinen Punkten</Link>
          </p>
        </div>
      </div>

      {/* Steuerung: Woche + Typ */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Woche wählen" className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-disabled={week === 0} className={cn(week === 0 && "pointer-events-none opacity-50")}>
            <Link href={href(Math.max(0, week - 1), typeParam)} aria-label="Vorherige Woche" tabIndex={week === 0 ? -1 : undefined}><ChevronLeft aria-hidden /></Link>
          </Button>
          <ul className="flex flex-1 gap-1 overflow-x-auto">
            {Array.from({ length: WEEKS }, (_, i) => {
              const m = addDays(startOfWeek(today, { weekStartsOn: 1 }), i * 7);
              return (
                <li key={i} className="flex-1">
                  <Link
                    href={href(i, typeParam)}
                    aria-current={i === week ? "page" : undefined}
                    className={cn("block rounded-lg border px-2 py-1.5 text-center text-xs whitespace-nowrap", i === week ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    <span className="block font-medium">{i === 0 ? <><span className="sm:hidden">Jetzt</span><span className="hidden sm:inline">Diese Woche</span></> : `KW ${getISOWeek(m)}`}</span>
                    <span className={cn("hidden sm:block", i === week ? "text-primary-foreground/80" : "text-muted-foreground")}>ab {format(m, "d. MMM", { locale: de })}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Button asChild variant="outline" size="icon" className={cn(week === WEEKS - 1 && "pointer-events-none opacity-50")}>
            <Link href={href(Math.min(WEEKS - 1, week + 1), typeParam)} aria-label="Nächste Woche" tabIndex={week === WEEKS - 1 ? -1 : undefined}><ChevronRight aria-hidden /></Link>
          </Button>
        </nav>
        <nav aria-label="Nach Typ filtern">
          <ul className="flex flex-wrap gap-1.5">
            <li>
              <Link href={href(week, null)} aria-current={!typeParam ? "true" : undefined} className={cn("inline-flex rounded-full border px-3 py-1 text-xs", !typeParam ? "border-primary bg-primary/15 font-medium text-primary" : "hover:bg-muted")}>Alle</Link>
            </li>
            {Object.entries(SESSION_TYPES).map(([k, v]) => (
              <li key={k}>
                <Link href={href(week, k)} aria-current={typeParam === k ? "true" : undefined} className={cn("inline-flex rounded-full border px-3 py-1 text-xs", typeParam === k ? "border-primary bg-primary/15 font-medium text-primary" : "hover:bg-muted")}>{v.short}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Wochenkalender: mobil als Liste nach Tagen, ab lg als 7 Spalten */}
      <section aria-labelledby="kalender-titel">
        <h2 id="kalender-titel" className="sr-only">Kalender {formatDate(days[0])} bis {formatDate(days[6])}</h2>
        {weekDtos.length === 0 ? (
          <EmptyState
            icon={CalendarHeart}
            title={typeParam ? `Keine ${SESSION_TYPES[typeParam].label} in dieser Woche` : "Keine Sessions in dieser Woche"}
            description="Schau in die nächste Woche oder entferne den Filter."
            action={typeParam ? <Button asChild size="sm" variant="outline"><Link href={href(week, null)}>Alle Typen zeigen</Link></Button> : undefined}
          />
        ) : (
          <ol className="grid gap-4 lg:grid-cols-7 lg:gap-2">
            {days.map((d) => {
              const list = weekDtos.filter((s) => isSameDay(new Date(s.date), d));
              const isToday = isSameDay(d, today);
              return (
                <li key={d.toISOString()} className={cn("min-w-0", list.length === 0 && "hidden lg:block")} aria-label={format(d, "EEEE, d. MMMM", { locale: de })}>
                  <div className={cn("mb-2 flex items-baseline gap-2 border-b pb-1 lg:flex-col lg:gap-0", d < today && "text-muted-foreground")}>
                    <span className="text-sm font-semibold">{format(d, "EEEE", { locale: de })}<span className="lg:hidden">,</span></span>
                    <span className="text-xs text-muted-foreground">
                      {format(d, "d. MMM", { locale: de })}
                      {isToday && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Heute</span>}
                    </span>
                  </div>
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">–</p>
                  ) : (
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      {list.map((s) => <li key={s.id}><SessionCard session={s} isHost={isHost} /></li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {isHost ? (
        <section aria-labelledby="checkins" className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 id="checkins" className="mb-3 flex items-center gap-2 text-base font-semibold"><ClipboardCheck className="size-4 text-primary" aria-hidden /> Offene Check-ins</h2>
          {checkIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alle Teilnahmen sind bestätigt. Check-ins erscheinen hier am Tag der Session.</p>
          ) : (
            <ul className="space-y-1">
              {checkIns.map((s) => (
                <li key={s.id}>
                  <SessionDialog session={s} isHost>
                    <button type="button" className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left hover:bg-muted/50">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{s.title}</span>
                        <span className="block text-xs text-muted-foreground">{formatDate(s.date)}, {timeLabel(s.startHour, s.endHour)}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">{s.bookings?.filter((b) => b.status === "gebucht").length} offen</span>
                    </button>
                  </SessionDialog>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section aria-labelledby="meine-sessions" className="grid gap-6 lg:grid-cols-2">
          <h2 id="meine-sessions" className="sr-only">Meine Sessions</h2>
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><CalendarHeart className="size-4 text-primary" aria-hidden /> Meine kommenden Sessions</h3>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarHeart} title="Noch nichts gebucht" description="Such dir oben einen freien Slot aus – die Teilnahme ist kostenlos und bringt Punkte." />
            ) : (
              <ul className="space-y-1">{upcoming.map((s) => <MySessionRow key={s.id} s={s} isHost={false} />)}</ul>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><History className="size-4 text-primary" aria-hidden /> Abgeschlossene Sessions</h3>
            {past.length === 0 ? (
              <EmptyState icon={History} title="Noch keine vergangenen Sessions" description="Nach deiner ersten Session siehst du hier, wofür du Punkte bekommen hast." />
            ) : (
              <ul className="space-y-1">{past.map((s) => <MySessionRow key={s.id} s={s} isHost={false} />)}</ul>
            )}
            <Link href="/punkte" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Gift className="size-4" aria-hidden /> Punkte gegen Belohnungen eintauschen
            </Link>
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Typen: {Object.values(SESSION_TYPES).map((t) => `${t.label} (+${t.points})`).join(" · ")}
      </p>
    </div>
  );
}
