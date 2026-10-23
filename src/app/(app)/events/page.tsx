import { CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CommunityTabs } from "@/components/community/community-tabs";
import { EventCard, type EventCardData } from "@/components/community/event-card";

export default async function EventsPage() {
  const user = await requireUser();
  const now = new Date();
  const events = await db.event.findMany({
    orderBy: { date: "asc" },
    include: { _count: { select: { rsvps: true } }, rsvps: { where: { userId: user.id }, select: { id: true } } },
  });
  const toCard = (e: (typeof events)[number]): EventCardData => ({
    slug: e.slug, title: e.title, date: e.date, city: e.city, venueName: e.venueName, imageSeed: e.imageSeed,
    capacity: e.capacity, rsvpCount: e._count.rsvps, attending: e.rsvps.length > 0,
  });
  const upcoming = events.filter((e) => e.date >= now).map(toCard);
  const past = events.filter((e) => e.date < now).reverse().map(toCard);

  return (
    <div>
      <PageHeader title="Events" description="Netzwerk-Abende, Workshops und Sessions – offline kennenlernen, online zusammenarbeiten." />
      <CommunityTabs active="/events" />
      <section aria-labelledby="kommend" className="mb-10">
        <h2 id="kommend" className="mb-3 text-xl font-semibold">Kommende Events</h2>
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
