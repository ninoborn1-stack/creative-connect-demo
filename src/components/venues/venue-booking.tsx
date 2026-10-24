"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Info, Loader2, Lock, Zap } from "lucide-react";
import { toast } from "sonner";
import { bookVenue } from "@/app/actions/venues";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "./native-select";

export type CalendarDay = { key: string; short: string; weekday: string; long: string };

const OPEN = 9;
const CLOSE = 22;
const HOURS = Array.from({ length: CLOSE - OPEN }, (_, i) => OPEN + i); // Slot h = h:00–(h+1):00

type Props = {
  venue: { id: string; name: string; pricePerHour: number; pricePerDay: number; instantBook: boolean };
  days: CalendarDay[];
  busy: Record<string, number[]>;
  serviceFeePct: number;
  canBook: boolean;
};

type Confirmed = { day: string; time: string; amount: number; serviceFee: number; providerRef: string };

export function VenueBooking({ venue, days, busy, serviceFeePct, canBook }: Props) {
  const [date, setDate] = useState<string>("");
  const [start, setStart] = useState<number>(OPEN);
  const [end, setEnd] = useState<number>(OPEN + 2);
  const [fullDay, setFullDay] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  const isBusy = (d: string, h: number) => (busy[d] ?? []).includes(h);
  const rangeFree = (d: string, s: number, e: number) => HOURS.filter((h) => h >= s && h < e).every((h) => !isBusy(d, h));
  const isSelected = (d: string, h: number) => d === date && (fullDay || (h >= start && h < end));

  function onCellClick(d: string, h: number) {
    if (!canBook || isBusy(d, h)) return;
    if (d !== date || fullDay) {
      setDate(d);
      setFullDay(false);
      setStart(h);
      setEnd(h + 1);
      return;
    }
    if (h >= start && rangeFree(d, start, h + 1)) setEnd(h + 1);
    else if (h < start && rangeFree(d, h, end)) setStart(h);
    else {
      setStart(h);
      setEnd(h + 1);
    }
  }

  const day = days.find((d) => d.key === date);
  const hours = fullDay ? CLOSE - OPEN : end - start;
  const amount = fullDay ? venue.pricePerDay : hours * venue.pricePerHour;
  const serviceFee = Math.round((amount * serviceFeePct) / 100);
  const free = date ? (fullDay ? rangeFree(date, OPEN, CLOSE) : end > start && rangeFree(date, start, end)) : false;
  const dayCheaper = !fullDay && hours * venue.pricePerHour > venue.pricePerDay;
  const timeLabel = fullDay ? "ganzer Tag (9–22 Uhr)" : `${start}–${end} Uhr (${hours} Std.)`;

  function pay() {
    startTransition(async () => {
      const res = await bookVenue({ venueId: venue.id, date, startHour: start, endHour: end, fullDay });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPayOpen(false);
      setConfirmed({ day: day?.long ?? date, time: timeLabel, amount: res.amount, serviceFee: res.serviceFee, providerRef: res.providerRef });
      toast.success(res.points ? `Buchung bestätigt – Zahlung reserviert. +${res.points} Punkte` : "Buchung bestätigt – Zahlung reserviert");
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border bg-background" aria-hidden />frei</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-muted-foreground/30" aria-hidden />belegt</span>
          {canBook && <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" aria-hidden />deine Auswahl</span>}
        </div>
        {/* Eigener Scroll-Container: auf Mobil scrollt nur der Kalender horizontal, nicht die Seite */}
        <div className="max-w-full overflow-x-auto rounded-xl border bg-card" role="region" aria-label="Belegungskalender der nächsten 14 Tage" tabIndex={0}>
          <table className="w-max min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">Tag</th>
                {HOURS.map((h) => (
                  <th key={h} scope="col" className="px-0.5 py-2 text-center font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key}>
                  <th scope="row" className={cn("sticky left-0 z-10 bg-card px-3 py-1 text-left font-normal whitespace-nowrap", d.key === date && "text-primary")}>
                    <span className="font-medium">{d.weekday}</span> {d.short}
                  </th>
                  {HOURS.map((h) => {
                    const b = isBusy(d.key, h);
                    const sel = isSelected(d.key, h);
                    const label = `${d.long}, ${h}–${h + 1} Uhr: ${b ? "belegt" : sel ? "ausgewählt" : "frei"}`;
                    return (
                      <td key={h} className="p-0.5">
                        {canBook && !b ? (
                          <button
                            type="button"
                            onClick={() => onCellClick(d.key, h)}
                            aria-label={label}
                            aria-pressed={sel}
                            className={cn(
                              "block h-7 w-9 rounded-sm border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              sel ? "border-primary bg-primary" : "bg-background hover:border-primary/60 hover:bg-primary/15",
                            )}
                          />
                        ) : (
                          <span
                            role="img"
                            aria-label={label}
                            className={cn("block h-7 w-9 rounded-sm", b ? "bg-muted-foreground/30" : "border bg-background")}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!canBook ? null : confirmed ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4" role="status" data-testid="booking-confirmed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
            <div className="min-w-0 space-y-1 text-sm">
              <p className="text-base font-semibold">Buchung bestätigt</p>
              <p>{venue.name} · {confirmed.day}, {confirmed.time}</p>
              <p>
                {formatEur(confirmed.amount)} Miete + {formatEur(confirmed.serviceFee)} Servicegebühr ={" "}
                <strong>{formatEur(confirmed.amount + confirmed.serviceFee)}</strong> reserviert
              </p>
              <p className="break-all text-xs text-muted-foreground">Referenz Zahlungsdienstleister: {confirmed.providerRef}</p>
              <p className="text-xs text-muted-foreground">Die Besitzer:in wurde benachrichtigt, die Bestätigung liegt in deiner Outbox.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="outline"><Link href="/finanzen">Zu meinen Zahlungen</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => { setConfirmed(null); setDate(""); }}>Weitere Buchung</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <h3 className="flex items-center gap-2 font-semibold"><Zap className="size-4 text-primary" aria-hidden />Sofortbuchung</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="b-date">Datum</Label>
              <NativeSelect id="b-date" value={date} onChange={(e) => setDate(e.target.value)}>
                <option value="">Datum wählen …</option>
                {days.map((d) => <option key={d.key} value={d.key}>{d.long}</option>)}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch id="b-full" checked={fullDay} onCheckedChange={setFullDay} />
              <Label htmlFor="b-full">Ganzer Tag (9–22 Uhr) für {formatEur(venue.pricePerDay)}</Label>
            </div>
            {!fullDay && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="b-start">Beginn</Label>
                  <NativeSelect
                    id="b-start"
                    value={start}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      setStart(s);
                      if (end <= s) setEnd(s + 1);
                    }}
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{h}:00 Uhr</option>)}
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="b-end">Ende</Label>
                  <NativeSelect id="b-end" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
                    {HOURS.map((h) => h + 1).filter((h) => h > start).map((h) => <option key={h} value={h}>{h}:00 Uhr</option>)}
                  </NativeSelect>
                </div>
              </>
            )}
          </div>

          {date && !free && (
            <p className="text-sm text-destructive" role="alert">Der gewählte Zeitraum überschneidet sich mit einer bestehenden Buchung.</p>
          )}

          {date && free && (
            <dl className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm" aria-label="Preis-Zusammenfassung">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{fullDay ? "Tagespreis" : `${hours} Std. × ${formatEur(venue.pricePerHour)}`}</dt>
                <dd>{formatEur(amount)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Servicegebühr ({serviceFeePct} %)</dt>
                <dd>{formatEur(serviceFee)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t pt-1.5 font-semibold">
                <dt>Gesamt</dt>
                <dd>{formatEur(amount + serviceFee)}</dd>
              </div>
              {dayCheaper && <p className="pt-1 text-xs text-primary">Tipp: Der Tagespreis ({formatEur(venue.pricePerDay)}) ist günstiger.</p>}
            </dl>
          )}

          <Button className="h-10 w-full" disabled={!date || !free} onClick={() => setPayOpen(true)} data-testid="book-venue">
            Jetzt buchen
          </Button>
          {!date && <p className="text-center text-xs text-muted-foreground">Wähle ein Datum oder tippe auf einen freien Slot im Kalender.</p>}
        </div>
      )}

      <Dialog open={payOpen} onOpenChange={(o) => !pending && setPayOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Lock className="size-3.5" aria-hidden />MockPay · sicherer Checkout
            </div>
            <DialogTitle className="text-lg">Mock-Zahlung</DialogTitle>
            <DialogDescription>
              {venue.name} · {day?.long}, {timeLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm" role="note">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
            <p><strong>Demo – keine echte Zahlung.</strong> Der Betrag wird beim (simulierten) Zahlungsdienstleister reserviert und nach der Session an die Besitzer:in ausgezahlt.</p>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Studio-Miete</dt><dd>{formatEur(amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Servicegebühr ({serviceFeePct} %)</dt><dd>{formatEur(serviceFee)}</dd></div>
            <div className="flex justify-between border-t pt-1.5 text-base font-semibold"><dt>Zu zahlen</dt><dd>{formatEur(amount + serviceFee)}</dd></div>
          </dl>
          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm">
            <CreditCard className="size-5 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">Demo-Zahlungsmittel</p>
              <p className="text-xs text-muted-foreground">Keine Eingabe nötig – es fließt kein Geld.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={pending}>Abbrechen</Button>
            <Button onClick={pay} disabled={pending} data-testid="confirm-payment">
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Zahlung bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
