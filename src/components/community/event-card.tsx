import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EventCardData = {
  slug: string; title: string; date: Date; city: string; venueName: string; imageSeed: string; capacity: number; rsvpCount: number; attending: boolean;
};

export function EventCard({ event, past }: { event: EventCardData; past?: boolean }) {
  const full = event.rsvpCount >= event.capacity;
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn("group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", past && "opacity-80")}
    >
      <div className="relative aspect-[16/9] bg-muted">
        <StockImage seed={event.imageSeed} alt="" w={800} h={450} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={cn(past && "grayscale")} />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {event.attending && <Badge>{past ? "Warst dabei" : "Du bist dabei"}</Badge>}
          {!past && full && !event.attending && <Badge variant="secondary">Ausgebucht</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg leading-tight font-semibold">{event.title}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />{formatDateTime(event.date)}</p>
          <p className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{event.venueName}, {event.city}</p>
          <p className="flex items-center gap-1.5"><Users className="size-4" aria-hidden />{event.rsvpCount}/{event.capacity} Zusagen</p>
        </div>
      </div>
    </Link>
  );
}
