import Link from "next/link";
import { Building2, CalendarDays, Plus, Settings2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CITIES, VENUE_TYPES } from "@/lib/constants";
import { formatDate, formatEur } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { VenueCard } from "@/components/venues/venue-card";
import { NativeSelect } from "@/components/venues/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function bookingTime(b: { fullDay: boolean; startHour: number; endHour: number }) {
  return b.fullDay ? "ganzer Tag" : `${b.startHour}–${b.endHour} Uhr`;
}

export default async function StudiosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const typ = one(sp.typ);
  const stadt = one(sp.stadt);
  const max = Number(one(sp.max)) || 0;
  const sofort = one(sp.sofort) === "1";
  const hasFilter = Boolean(typ || stadt || max || sofort);

  const where: Prisma.VenueWhereInput = {};
  if (typ && VENUE_TYPES[typ]) where.type = typ;
  if (stadt) where.city = stadt;
  if (max > 0) where.pricePerHour = { lte: max };
  if (sofort) where.instantBook = true;

  const today = startOfDay(new Date());
  const [venues, mine, myBookings] = await Promise.all([
    db.venue.findMany({ where, orderBy: [{ ratingAvg: "desc" }, { name: "asc" }] }),
    db.venue.findMany({
      where: { ownerId: user.id },
      orderBy: { name: "asc" },
      include: {
        bookings: { where: { status: "bestaetigt", date: { gte: today } }, orderBy: [{ date: "asc" }, { startHour: "asc" }], include: { user: true } },
      },
    }),
    db.venueBooking.findMany({
      where: { userId: user.id, status: "bestaetigt", date: { gte: today } },
      orderBy: { date: "asc" },
      include: { venue: true },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <PageHeader
          title="Studios & Locations"
          description="Tonstudios, Foto- und Videostudios, Proberäume und Locations aus dem Netzwerk – viele davon sofort buchbar."
          actions={
            <Button asChild>
              <Link href="/studios/neu"><Plus aria-hidden />Eigene Venue anlegen</Link>
            </Button>
          }
        />

        {one(sp.geloescht) === "1" && (
          <p role="status" className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">Die Venue wurde gelöscht.</p>
        )}
        <form method="get" className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end" aria-label="Venues filtern">
          <div className="grid gap-1.5">
            <Label htmlFor="f-typ">Typ</Label>
            <NativeSelect id="f-typ" name="typ" defaultValue={typ}>
              <option value="">Alle Typen</option>
              {Object.entries(VENUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-stadt">Stadt</Label>
            <NativeSelect id="f-stadt" name="stadt" defaultValue={stadt}>
              <option value="">Alle Städte</option>
              {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-max">Preis / Std. max. (€)</Label>
            <Input id="f-max" name="max" type="number" min={0} step={5} inputMode="numeric" placeholder="z. B. 60" defaultValue={max || ""} className="h-9" />
          </div>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" name="sofort" value="1" defaultChecked={sofort} className="size-4 accent-primary" />
            Nur Sofortbuchung
          </label>
          <div className="flex gap-2">
            <Button type="submit" className="h-9 flex-1">Filtern</Button>
            {hasFilter && (
              <Button asChild variant="ghost" className="h-9"><Link href="/studios">Zurücksetzen</Link></Button>
            )}
          </div>
        </form>

        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">{venues.length} {venues.length === 1 ? "Venue" : "Venues"}</p>
        {venues.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Keine Venue passt zu deinen Filtern"
            description="Lockere die Filter oder schau in einer anderen Stadt."
            action={<Button asChild variant="outline"><Link href="/studios">Filter zurücksetzen</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => <VenueCard key={v.id} venue={v} />)}
          </div>
        )}
      </div>

      {myBookings.length > 0 && (
        <section aria-labelledby="meine-buchungen">
          <h2 id="meine-buchungen" className="mb-3 text-xl font-semibold">Meine nächsten Buchungen</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {myBookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div className="min-w-0">
                  <Link href={`/studios/${b.venue.slug}`} className="font-medium hover:underline">{b.venue.name}</Link>
                  <p className="text-muted-foreground">{formatDate(b.date)}, {bookingTime(b)} · {b.venue.city}</p>
                </div>
                <span className="font-medium">{formatEur(b.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="meine-venues">
        <h2 id="meine-venues" className="mb-3 text-xl font-semibold">Meine Venues</h2>
        {mine.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Du bietest noch keine Venue an"
            description="Hast du ein Studio, einen Proberaum oder eine Location? Biete sie dem Netzwerk an – mit Sofortbuchung und Mock-Zahlung."
            action={<Button asChild><Link href="/studios/neu"><Plus aria-hidden />Eigene Venue anlegen</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {mine.map((v) => {
              const revenue = v.bookings.reduce((s, b) => s + b.amount, 0);
              return (
                <div key={v.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/studios/${v.slug}`} className="text-lg font-semibold hover:underline">{v.name}</Link>
                      <p className="text-sm text-muted-foreground">{VENUE_TYPES[v.type]} · {v.city}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/studios/${v.slug}/bearbeiten`}><Settings2 aria-hidden />Bearbeiten</Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{v.bookings.length} kommende Buchungen</Badge>
                    <Badge variant="secondary">{formatEur(revenue)} Miete reserviert</Badge>
                    {!v.instantBook && <Badge variant="outline">Sofortbuchung aus</Badge>}
                  </div>
                  {v.bookings.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">Noch keine kommenden Buchungen.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {v.bookings.slice(0, 4).map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-2">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="truncate">{formatDate(b.date)}, {bookingTime(b)} – {b.user.name}</span>
                          </span>
                          <span className="shrink-0 font-medium">{formatEur(b.amount)}</span>
                        </li>
                      ))}
                      {v.bookings.length > 4 && (
                        <li><Link href={`/studios/${v.slug}`} className="text-primary hover:underline">Alle {v.bookings.length} Buchungen ansehen</Link></li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
