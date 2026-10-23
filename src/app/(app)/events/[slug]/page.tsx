import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateLong } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { RsvpButton } from "@/components/community/rsvp-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const event = await db.event.findUnique({
    where: { slug },
    include: { rsvps: { include: { user: { include: { profile: true } } } } },
  });
  if (!event) notFound();

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
