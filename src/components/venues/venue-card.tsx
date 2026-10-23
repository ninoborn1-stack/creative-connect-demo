import Link from "next/link";
import { MapPin, Star, Users, Zap } from "lucide-react";
import type { Venue } from "@prisma/client";
import { VENUE_TYPES } from "@/lib/constants";
import { formatEur, parseJson } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { Badge } from "@/components/ui/badge";

export function VenueCard({ venue }: { venue: Venue }) {
  const seeds = parseJson<string[]>(venue.imageSeeds, []);
  return (
    <Link
      href={`/studios/${venue.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] bg-muted">
        <StockImage seed={seeds[0] ?? `cc-venue-${venue.slug}-0`} alt={`Foto von ${venue.name}`} w={800} h={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge className="bg-background/85 text-foreground backdrop-blur">{VENUE_TYPES[venue.type] ?? venue.type}</Badge>
          {venue.instantBook && (
            <Badge className="gap-1 bg-primary text-primary-foreground"><Zap className="size-3" aria-hidden />Sofortbuchung</Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight">{venue.name}</h3>
          {venue.ratingAvg > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-medium">{venue.ratingAvg.toFixed(1)}</span>
              <span className="sr-only">von 5 Sternen</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{venue.city}</span>
          <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />bis {venue.capacity} Personen</span>
        </div>
        <p className="mt-auto pt-2 text-sm">
          <span className="font-semibold">{formatEur(venue.pricePerHour)}</span>
          <span className="text-muted-foreground"> / Std · </span>
          <span className="font-semibold">{formatEur(venue.pricePerDay)}</span>
          <span className="text-muted-foreground"> / Tag</span>
        </p>
      </div>
    </Link>
  );
}
