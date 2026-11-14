import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Mic2, Ticket, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateLong, formatDateTime, formatEur, parseJson } from "@/lib/format";
import { ticketsSold } from "@/lib/tickets";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { RsvpButton } from "@/components/community/rsvp-button";
import { TicketBox } from "@/components/community/ticket-box";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      rsvps: { include: { user: { include: { profile: true } } } },
      tickets: { select: { quantity: true, userId: true, code: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!event) notFound();
  if (event.ticketPrice != null) return <TicketEventPage event={{ ...event, ticketPrice: event.ticketPrice }} userId={user.id} />;

  const isPast = event.date < new Date();
  const count = event.rsvps.length;
  const attending = event.rsvps.some((r) => r.userId === user.id);
  const full = count >= event.capacity;
  const shown = event.rsvps.slice(0, 24);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Alle Events
      </Link>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted sm:aspect-[21/9]">
        <StockImage seed={event.imageSeed} alt="" w={1600} h={700} priority sizes="(max-width: 1024px) 100vw, 900px" className={isPast ? "grayscale" : undefined} />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {isPast && <Badge variant="secondary" className="mb-2">Vergangen</Badge>}
          <h1 className="text-2xl font-bold sm:text-3xl">{event.title}</h1>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />{formatDateLong(event.date)}, 19:00 Uhr</p>
            <p className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{event.venueName}, {event.city}</p>
          </div>
        </div>
        {!isPast && <RsvpButton eventId={event.id} attending={attending} full={full} />}
      </div>

      <p className="leading-relaxed">{event.description}</p>

      <section aria-labelledby="teilnehmende" className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="teilnehmende" className="flex items-center gap-2 text-lg font-semibold"><Users className="size-4 text-primary" aria-hidden />{isPast ? "Waren dabei" : "Teilnehmende"}</h2>
          <span className="text-sm text-muted-foreground">{count}/{event.capacity} Zusagen</span>
        </div>
        <Progress value={Math.min(100, (count / event.capacity) * 100)} className="mb-4 h-1.5" aria-label="Auslastung" />
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Zusagen – sei die erste Person.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {shown.map((r) => (
              <li key={r.id}>
                {r.user.profile ? (
                  <Link href={`/mitglieder/${r.user.profile.slug}`} title={r.user.name} className="block rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <UserAvatar name={r.user.name} seed={r.user.profile.avatarSeed} className="size-10 ring-2 ring-card" />
                    <span className="sr-only">{r.user.name}</span>
                  </Link>
                ) : (
                  <UserAvatar name={r.user.name} className="size-10" />
                )}
              </li>
            ))}
            {count > shown.length && (
              <li className="grid size-10 place-items-center rounded-full bg-muted text-xs font-medium">+{count - shown.length}</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

type TicketEvent = {
  id: string; title: string; description: string; date: Date; city: string; venueName: string; imageSeed: string; capacity: number;
  ticketPrice: number; genre: string | null; lineup: string; startTime: string;
  tickets: { quantity: number; userId: string; code: string; createdAt: Date }[];
};

// Ticket-Event (Konzert, Clubnacht, Festival): Infos links, Ticketkauf rechts, eigene Tickets darunter
function TicketEventPage({ event, userId }: { event: TicketEvent; userId: string }) {
  const isPast = event.date < new Date();
  const sold = ticketsSold(event.tickets);
  const left = Math.max(0, event.capacity - sold);
  const lineup = parseJson<string[]>(event.lineup, []);
  const mine = event.tickets.filter((t) => t.userId === userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Alle Events
      </Link>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted sm:aspect-[21/9]">
        <StockImage seed={event.imageSeed} alt="" w={1600} h={700} priority sizes="(max-width: 1024px) 100vw, 1024px" className={isPast ? "grayscale" : undefined} />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {event.genre && <Badge>{event.genre}</Badge>}
          {isPast && <Badge variant="secondary">Vergangen</Badge>}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="text-2xl font-bold sm:text-4xl">{event.title}</h1>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />{formatDateLong(event.date)}, {event.startTime} Uhr</p>
              <p className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{event.venueName}, {event.city}</p>
            </div>
          </div>
          <p className="leading-relaxed">{event.description}</p>
          {lineup.length > 0 && (
            <section aria-labelledby="lineup" className="rounded-xl border bg-card p-4">
              <h2 id="lineup" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Mic2 className="size-4 text-primary" aria-hidden />Line-up</h2>
              <ul className="flex flex-wrap gap-2">
                {lineup.map((act) => <li key={act} className="rounded-full border px-3 py-1 text-sm">{act}</li>)}
              </ul>
            </section>
          )}
          <section aria-labelledby="auslastung" className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="auslastung" className="flex items-center gap-2 text-lg font-semibold"><Users className="size-4 text-primary" aria-hidden />Verkauft</h2>
              <span className="text-sm text-muted-foreground">{sold} von {event.capacity} Tickets</span>
            </div>
            <Progress value={Math.min(100, (sold / event.capacity) * 100)} className="h-1.5" aria-label="Verkaufte Tickets" />
          </section>
        </div>

        <aside id="tickets" className="scroll-mt-20 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section aria-labelledby="ticket-kauf" className="rounded-xl border bg-card p-4">
            <h2 id="ticket-kauf" className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold">Tickets</span>
              <span className="text-xl font-bold text-primary">{formatEur(event.ticketPrice)}</span>
            </h2>
            <div className="mt-4">
              {isPast ? <p className="text-sm text-muted-foreground">Das Event ist vorbei.</p> : <TicketBox eventId={event.id} price={event.ticketPrice} left={left} />}
            </div>
          </section>
          {mine.length > 0 && (
            <section aria-labelledby="meine-tickets" className="space-y-2">
              <h2 id="meine-tickets" className="text-lg font-semibold">Deine Tickets</h2>
              <ul className="space-y-2">
                {mine.map((t) => (
                  <li key={t.code} className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-card p-3" data-testid="my-ticket">
                    <Ticket className="size-8 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-mono text-base font-semibold tracking-wider">{t.code}</p>
                      <p className="text-xs text-muted-foreground">{t.quantity} {t.quantity === 1 ? "Ticket" : "Tickets"} · gekauft {formatDateTime(t.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
