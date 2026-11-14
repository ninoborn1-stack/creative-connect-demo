import { CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CommunityTabs } from "@/components/community/community-tabs";
import { EventCard, type EventCardData } from "@/components/community/event-card";
import { ticketsSold } from "@/lib/tickets";

export default async function EventsPage() {
  const user = await requireUser();
  const now = new Date();
  const events = await db.event.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: { select: { rsvps: true } },
      rsvps: { where: { userId: user.id }, select: { id: true } },
      tickets: { select: { quantity: true, userId: true } },
    },
  });
  const toCard = (e: (typeof events)[number]): EventCardData => ({
    slug: e.slug, title: e.title, date: e.date, city: e.city, venueName: e.venueName, imageSeed: e.imageSeed,
    capacity: e.capacity, ticketPrice: e.ticketPrice, genre: e.genre,
    // Ticket-Events zählen verkaufte Tickets, Netzwerk-Events Zusagen
    rsvpCount: e.ticketPrice != null ? ticketsSold(e.tickets) : e._count.rsvps,
    attending: e.rsvps.length > 0 || e.tickets.some((t) => t.userId === user.id),
  });
  const tickets = events.filter((e) => e.date >= now && e.ticketPrice != null).map(toCard);
  const upcoming = events.filter((e) => e.date >= now && e.ticketPrice == null).map(toCard);
  const past = events.filter((e) => e.date < now).reverse().map(toCard);

  return (
    <div>
      <PageHeader title="Events" description="Konzerte, Clubnächte und Festivals mit Tickets – dazu Netzwerk-Abende und Workshops für Mitglieder." />
      <CommunityTabs active="/events" />
      {tickets.length > 0 && (
        <section aria-labelledby="tickets" className="mb-10">
          <h2 id="tickets" className="mb-3 text-xl font-semibold">Tickets</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tickets.map((e) => <EventCard key={e.slug} event={e} />)}</div>
        </section>
      )}
      <section aria-labelledby="kommend" className="mb-10">
        <h2 id="kommend" className="mb-3 text-xl font-semibold">Netzwerk-Events</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Keine kommenden Events" description="Neue Termine werden hier angekündigt." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e) => <EventCard key={e.slug} event={e} />)}</div>
        )}
      </section>
      <section aria-labelledby="vergangen">
        <h2 id="vergangen" className="mb-3 text-xl font-semibold">Vergangene Events</h2>
        {past.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Noch keine vergangenen Events" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{past.map((e) => <EventCard key={e.slug} event={e} past />)}</div>
        )}
      </section>
    </div>
  );
}
