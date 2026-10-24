"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CalendarCheck, Check, Clock, Loader2, MapPin, Sparkles, UserX, Users, X } from "lucide-react";
import { toast } from "sonner";
import { bookSession, cancelBooking, cancelSlot, checkIn, demoCheckIn } from "@/app/actions/sessions";
import { formatDateLong } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { timeLabel, type SessionDto } from "./session-utils";
import { BookingStatusBadge, SessionTypeBadge } from "./session-badges";

export function SessionDialog({ session, isHost, children }: { session: SessionDto; isHost: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"info" | "book">("info");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const free = session.capacity - session.taken;
  const cancelled = session.status === "abgesagt";
  const mine = session.myBooking;
  const canBook = !isHost && !cancelled && !session.past && free > 0 && (!mine || mine.status === "abgesagt");

  function run(fn: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>, close = false) {
    start(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Gespeichert.");
      if (close) setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setStep("info");
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <SessionTypeBadge type={session.type} />
            <span className="text-xs font-semibold text-primary">+{session.points} Punkte</span>
            {cancelled && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">Abgesagt</span>}
          </div>
          <DialogTitle>{session.title}</DialogTitle>
          <DialogDescription>{session.description}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-start gap-2">
            <dt className="sr-only">Termin</dt>
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dd>{formatDateLong(session.date)}, {timeLabel(session.startHour, session.endHour)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Ort</dt>
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dd>{session.location}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Plätze</dt>
            <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dd>{free > 0 ? `${free} von ${session.capacity} Plätzen frei` : `Ausgebucht (${session.capacity} Plätze)`}</dd>
          </div>
        </dl>

        {mine && mine.status !== "abgesagt" && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              Deine Buchung <BookingStatusBadge status={mine.status} />
              {mine.earned ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{mine.earned} Punkte erhalten</span> : null}
            </p>
            {mine.note && <p className="mt-1 text-muted-foreground">„{mine.note}“</p>}
          </div>
        )}

        {step === "book" && canBook && (
          <div className="grid gap-1.5">
            <Label htmlFor={`note-${session.id}`}>Woran willst du arbeiten? (optional)</Label>
            <Textarea
              id={`note-${session.id}`}
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z. B. Hook für meine neue Single, zwei Beat-Skizzen …"
            />
            <p className="text-xs text-muted-foreground">Kostenlos für Mitglieder. Nesto sieht deine Notiz vorab.</p>
          </div>
        )}

        {/* Check-in für Nesto */}
        {isHost && session.bookings && (
          <section aria-labelledby={`checkin-${session.id}`} className="grid gap-2">
            <h3 id={`checkin-${session.id}`} className="text-sm font-semibold">Buchungen ({session.bookings.length})</h3>
            {session.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch niemand gebucht.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {session.bookings.map((b) => (
                  <li key={b.id} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <UserAvatar name={b.name} seed={b.avatarSeed} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        {b.note && <p className="line-clamp-2 text-xs text-muted-foreground">„{b.note}“</p>}
                      </div>
                    </div>
                    {b.status === "gebucht" && session.checkInOpen && !cancelled ? (
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setBusyId(b.id + "y");
                            run(() => checkIn(b.id, true));
                          }}
                        >
                          {busyId === b.id + "y" ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}Teilgenommen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setBusyId(b.id + "n");
                            run(() => checkIn(b.id, false));
                          }}
                        >
                          {busyId === b.id + "n" ? <Loader2 className="animate-spin" aria-hidden /> : <UserX aria-hidden />}Nicht erschienen
                        </Button>
                      </div>
                    ) : (
                      <BookingStatusBadge status={b.status} />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!session.checkInOpen && session.bookings.length > 0 && <p className="text-xs text-muted-foreground">Check-in ist ab dem Tag der Session möglich.</p>}
          </section>
        )}

        <DialogFooter className="gap-2">
          {isHost && !cancelled && !session.past && (
            <Button variant="destructive" disabled={pending} onClick={() => run(() => cancelSlot(session.id), true)}>
              <Ban aria-hidden />Slot absagen
            </Button>
          )}
          {!isHost && mine?.status === "gebucht" && !cancelled && (
            <>
              {!session.past && (
                <Button variant="outline" disabled={pending} onClick={() => run(() => cancelBooking(session.id), true)}>
                  <X aria-hidden />Stornieren
                </Button>
              )}
              <Button data-testid="demo-checkin" variant="secondary" disabled={pending} onClick={() => run(() => demoCheckIn(session.id))}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}Demo: Teilnahme bestätigen
              </Button>
            </>
          )}
          {canBook && step === "info" && (
            <Button data-testid="book-session" onClick={() => setStep("book")}>
              <CalendarCheck aria-hidden />Platz buchen
            </Button>
          )}
          {canBook && step === "book" && (
            <Button data-testid="confirm-booking" disabled={pending} onClick={() => run(() => bookSession({ sessionId: session.id, note }), true)}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}Buchung bestätigen
            </Button>
          )}
          {!isHost && !mine && !cancelled && !session.past && free <= 0 && (
            <Button disabled variant="secondary">Ausgebucht</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
