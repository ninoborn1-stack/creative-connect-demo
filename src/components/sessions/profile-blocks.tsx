import Link from "next/link";
import { ArrowRight, CalendarHeart, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionTypeBadge } from "./session-badges";
import { nextFreeSlots, upcomingBookings } from "./session-data";
import { timeLabel } from "./session-utils";

function DateChip({ date }: { date: Date }) {
  return (
    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-muted py-1 text-center leading-tight">
      <span className="text-base font-bold">{date.getDate()}</span>
      <span className="text-[10px] uppercase text-muted-foreground">{date.toLocaleDateString("de-DE", { month: "short" })}</span>
    </span>
  );
}

// „Mein Nesto-Kalender“: nächste gebuchte Sessions (max. 3) für Mitglieder
export async function NestoCalendarBlock({ userId, className }: { userId: string; className?: string }) {
  const bookings = await upcomingBookings(userId, 3);
  return (
    <section aria-labelledby="nesto-kalender" className={cn("flex flex-col rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="nesto-kalender" className="flex items-center gap-2 text-base font-semibold"><CalendarHeart className="size-4 text-primary" aria-hidden /> Mein Nesto-Kalender</h2>
        <Link href="/sessions" className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Kalender <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Session gebucht. Produzier mit Nesto – kostenlos für Mitglieder und mit Punkten für jede Teilnahme.</p>
      ) : (
        <ul className="space-y-1">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href="/sessions" className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                <DateChip date={b.session.date} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.session.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{timeLabel(b.session.startHour, b.session.endHour)} · {b.session.location}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-primary">+{b.session.points}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="sm" className="mt-3 w-fit">
        <Link href="/sessions"><CalendarPlus aria-hidden /> Session buchen</Link>
      </Button>
    </section>
  );
}

// Nestos Sicht bzw. Nestos Profil: nächste freie Slots
export async function FreeSlotsBlock({ own, className }: { own: boolean; className?: string }) {
  const slots = await nextFreeSlots(4);
  return (
    <section aria-labelledby="freie-slots" className={cn("flex flex-col rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="freie-slots" className="flex items-center gap-2 text-base font-semibold">
          <CalendarHeart className="size-4 text-primary" aria-hidden /> {own ? "Nächste freie Slots in meinem Kalender" : "Freie Slots bei Nesto"}
        </h2>
      </div>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Gerade sind alle Slots belegt.</p>
      ) : (
        <ul className="space-y-1">
          {slots.map((s) => (
            <li key={s.id}>
              <Link href="/sessions" className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50">
                <DateChip date={s.date} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.title}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <SessionTypeBadge type={s.type} /> {timeLabel(s.startHour, s.endHour)}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.free}/{s.capacity} frei</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="sm" variant={own ? "outline" : "default"} className="mt-3 w-fit">
        <Link href="/sessions">{own ? "Kalender verwalten" : "Session buchen"}</Link>
      </Button>
    </section>
  );
}
