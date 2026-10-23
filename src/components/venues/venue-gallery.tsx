"use client";

import { useState } from "react";
import { StockImage } from "@/components/stock-image";
import { cn } from "@/lib/utils";

export function VenueGallery({ seeds, name }: { seeds: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (seeds.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <StockImage seed={seeds[active]} alt={`${name} – Bild ${active + 1} von ${seeds.length}`} w={1400} h={875} priority sizes="(max-width: 1024px) 100vw, 66vw" />
      </div>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Bilder auswählen">
        {seeds.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Bild ${i + 1} anzeigen`}
            aria-pressed={i === active}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg bg-muted ring-offset-2 ring-offset-background transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              i === active ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
            )}
          >
            <StockImage seed={s} w={400} h={300} sizes="25vw" />
          </button>
        ))}
      </div>
    </div>
  );
}
