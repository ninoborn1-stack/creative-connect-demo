import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionDialog } from "./session-dialog";
import { SessionTypeBadge } from "./session-badges";
import { timeLabel, type SessionDto } from "./session-utils";

// Kompakte Karte im Wochenkalender; Klick öffnet den Detail-Dialog
export function SessionCard({ session, isHost }: { session: SessionDto; isHost: boolean }) {
  const free = session.capacity - session.taken;
  const cancelled = session.status === "abgesagt";
  const mine = session.myBooking && session.myBooking.status !== "abgesagt";
  return (
    <SessionDialog session={session} isHost={isHost}>
      <button
        type="button"
        className={cn(
          "group flex w-full flex-col gap-1.5 rounded-lg border bg-card p-2.5 text-left text-xs transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          mine && "border-primary/60 bg-primary/5",
          (session.past || cancelled) && "opacity-55 grayscale",
        )}
      >
        <span className="flex flex-wrap items-center justify-between gap-1">
          <SessionTypeBadge type={session.type} />
          <span className="font-semibold text-primary">+{session.points}</span>
        </span>
        <span className={cn("text-sm leading-snug font-medium", cancelled && "line-through")}>{session.title}</span>
        <span className="tabular-nums text-muted-foreground">{timeLabel(session.startHour, session.endHour)}</span>
        <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{session.location}</span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-1">
          {cancelled ? (
            <span className="font-medium text-destructive">Abgesagt</span>
          ) : session.past ? (
            <span className="text-muted-foreground">Vorbei</span>
          ) : free > 0 ? (
            <span className="tabular-nums">{free}/{session.capacity} frei</span>
          ) : (
            <span className="font-medium text-muted-foreground">Ausgebucht</span>
          )}
          {mine && (
            <span className="inline-flex items-center gap-0.5 font-medium text-primary">
              <Check className="size-3" aria-hidden />
              {session.myBooking?.status === "teilgenommen" ? "Dabei gewesen" : "Gebucht"}
            </span>
          )}
        </span>
      </button>
    </SessionDialog>
  );
}
