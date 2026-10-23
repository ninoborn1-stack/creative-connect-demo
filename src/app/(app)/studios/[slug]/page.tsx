import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, MapPin, Pencil, Star, Users, Zap } from "lucide-react";
import { addDays, format, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { VENUE_TYPES } from "@/lib/constants";
import { formatDate, formatEur, parseJson } from "@/lib/format";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { VenueGallery } from "@/components/venues/venue-gallery";
import { VenueBooking, type CalendarDay } from "@/components/venues/venue-booking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const OPEN = 9;
const CLOSE = 22;

type SP = Record<string, string | string[] | undefined>;

export default async function VenueDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const venue = await db.venue.findUnique({ where: { slug }, include: { owner: { include: { profile: true } } } });
  if (!venue) notFound();

  const isOwner = venue.ownerId === user.id;
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 14);
  const [fees, bookings, upcomingAll] = await Promise.all([
    getFees(),
    db.venueBooking.findMany({ where: { venueId: venue.id, status: "bestaetigt", date: { gte: today, lt: windowEnd } } }),
    isOwner
      ? db.venueBooking.findMany({
          where: { venueId: venue.id, status: "bestaetigt", date: { gte: today } },
          orderBy: [{ date: "asc" }, { startHour: "asc" }],
          include: { user: { include: { profile: true } } },
        })
      : Promise.resolve([]),
  ]);

  const days: CalendarDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i);
    return {
      key: format(d, "yyyy-MM-dd"),
      short: format(d, "dd.MM."),
      weekday: format(d, "EEEEEE", { locale: de }),
      long: format(d, "EEEE, dd.MM.yyyy", { locale: de }),
    };
  });
  const busy: Record<string, number[]> = {};
  for (const b of bookings) {
    const key = format(b.date, "yyyy-MM-dd");
    const s = b.fullDay ? OPEN : b.startHour;
    const e = b.fullDay ? CLOSE : b.endHour;
    for (let h = s; h < e; h++) (busy[key] ??= []).push(h);
  }

  const seeds = parseJson<string[]>(venue.imageSeeds, []);
  const features = parseJson<string[]>(venue.features, []);
  const ownerProfile = venue.owner.profile;
  const canBook = !isOwner && venue.instantBook;

  return (
    <div className="space-y-8">
      <Link href="/studios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Alle Studios & Locations
      </Link>

      {sp.neu === "1" && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">Deine Venue ist angelegt und für das Netzwerk sichtbar.</p>}
      {sp.gespeichert === "1" && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">Änderungen gespeichert.</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{VENUE_TYPES[venue.type] ?? venue.type}</Badge>
            {venue.instantBook && <Badge className="gap-1"><Zap className="size-3" aria-hidden />Sofortbuchung</Badge>}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">{venue.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{venue.address}</span>
            <span className="inline-flex items-center gap-1"><Users className="size-4" aria-hidden />bis {venue.capacity} Personen</span>
            {venue.ratingAvg > 0 && (
              <span className="inline-flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />{venue.ratingAvg.toFixed(1)}<span className="sr-only"> von 5 Sternen</span></span>
            )}
          </div>
        </div>
        {isOwner && (
          <Button asChild variant="outline">
            <Link href={`/studios/${venue.slug}/bearbeiten`}><Pencil aria-hidden />Venue bearbeiten</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8">
          <VenueGallery seeds={seeds} name={venue.name} />

          <section aria-labelledby="beschreibung">
            <h2 id="beschreibung" className="mb-2 text-xl font-semibold">Beschreibung</h2>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{venue.description}</p>
          </section>

          {features.length > 0 && (
            <section aria-labelledby="ausstattung">
              <h2 id="ausstattung" className="mb-3 text-xl font-semibold">Ausstattung</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 text-primary" aria-hidden />{f}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="kalender" className="min-w-0">
            <h2 id="kalender" className="mb-1 text-xl font-semibold">Verfügbarkeit</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Nächste 14 Tage, Stundenslots von 9 bis 22 Uhr.{canBook ? " Tippe auf freie Slots, um sie auszuwählen." : ""}
            </p>
            <VenueBooking
              venue={{ id: venue.id, name: venue.name, pricePerHour: venue.pricePerHour, pricePerDay: venue.pricePerDay, instantBook: venue.instantBook }}
              days={days}
              busy={busy}
              serviceFeePct={fees.serviceFeePct}
              canBook={canBook}
            />
            {!isOwner && !venue.instantBook && (
              <p className="mt-3 rounded-lg border bg-card p-3 text-sm">
                Für diese Venue ist die Sofortbuchung deaktiviert. Melde dich direkt bei{" "}
                {ownerProfile ? <Link href={`/mitglieder/${ownerProfile.slug}`} className="text-primary hover:underline">{venue.owner.name}</Link> : venue.owner.name}.
              </p>
            )}
          </section>

          {isOwner && (
            <section aria-labelledby="buchungen">
              <h2 id="buchungen" className="mb-3 text-xl font-semibold">Buchungen deiner Venue</h2>
              {upcomingAll.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Noch keine kommenden Buchungen" description="Sobald jemand bucht, erscheint die Buchung hier und du bekommst eine Benachrichtigung." />
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr className="border-b">
                        <th scope="col" className="p-3 font-medium">Datum</th>
                        <th scope="col" className="p-3 font-medium">Zeit</th>
                        <th scope="col" className="p-3 font-medium">Gebucht von</th>
                        <th scope="col" className="p-3 text-right font-medium">Miete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAll.map((b) => (
                        <tr key={b.id} className="border-b last:border-0">
                          <td className="p-3 whitespace-nowrap">{formatDate(b.date)}</td>
                          <td className="p-3 whitespace-nowrap">{b.fullDay ? "Ganzer Tag" : `${b.startHour}–${b.endHour} Uhr`}</td>
                          <td className="p-3">
                            {b.user.profile ? (
                              <Link href={`/mitglieder/${b.user.profile.slug}`} className="hover:underline">{b.user.name}</Link>
                            ) : (
                              b.user.name
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">{formatEur(b.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold">Preise</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Pro Stunde</dt><dd className="font-semibold">{formatEur(venue.pricePerHour)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ganzer Tag (9–22 Uhr)</dt><dd className="font-semibold">{formatEur(venue.pricePerDay)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Kapazität</dt><dd>{venue.capacity} Personen</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Zzgl. {fees.serviceFeePct} % Servicegebühr für Buchende. Besitzer:innen zahlen keine Provision.</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-1 text-lg font-semibold">Adresse</h2>
            <p className="text-sm text-muted-foreground">{venue.address}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold">Besitzer:in</h2>
            <div className="flex items-center gap-3">
              <UserAvatar name={venue.owner.name} seed={ownerProfile?.avatarSeed} />
              <div className="min-w-0">
                {ownerProfile ? (
                  <Link href={`/mitglieder/${ownerProfile.slug}`} className="font-medium hover:underline">{venue.owner.name}</Link>
                ) : (
                  <p className="font-medium">{venue.owner.name}</p>
                )}
                {ownerProfile && <p className="truncate text-xs text-muted-foreground">{ownerProfile.headline}</p>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
