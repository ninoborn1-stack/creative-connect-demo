import { addDays, format, isBefore, startOfDay, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Verfügbarkeit der nächsten 6 Wochen (busyDates = ISO-Daten, an denen die Person belegt ist).
export function AvailabilityCalendar({ busyDates, fullyBooked }: { busyDates: string[]; fullyBooked?: boolean }) {
  const today = startOfDay(new Date());
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const busy = new Set(busyDates);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground" aria-hidden>
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <ul className="mt-1 grid grid-cols-7 gap-1" aria-label="Verfügbarkeit der nächsten sechs Wochen">
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const past = isBefore(d, today);
          const isBusy = busy.has(iso) || (fullyBooked && !past);
          const label = `${format(d, "EEEE, d. MMMM", { locale: de })}: ${past ? "vergangen" : isBusy ? "belegt" : "frei"}`;
          return (
            <li
              key={iso}
              title={label}
              aria-label={label}
              className={cn(
                "grid aspect-square place-items-center rounded-md text-xs tabular-nums",
                past && "text-muted-foreground/40",
                !past && isBusy && "bg-destructive/20 font-medium text-destructive",
                !past && !isBusy && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                iso === format(today, "yyyy-MM-dd") && "ring-2 ring-primary",
              )}
            >
              {format(d, "d")}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-emerald-500/30" aria-hidden /> frei</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-destructive/40" aria-hidden /> belegt</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded ring-2 ring-primary" aria-hidden /> heute</span>
      </div>
    </div>
  );
}
