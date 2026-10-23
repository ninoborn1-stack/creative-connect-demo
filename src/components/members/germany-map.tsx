"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type MapCity = { name: string; lat: number; lng: number; count: number; href: string };

const W = 300;
const H = 400;
const project = (lat: number, lng: number) => ({
  x: ((lng - 5.8) / (15.1 - 5.8)) * W,
  y: ((55.1 - lat) / (55.1 - 47.2)) * H,
});

// Stark vereinfachte Außengrenze Deutschlands (lng, lat)
const OUTLINE: [number, number][] = [
  [6.9, 53.6], [7.2, 53.7], [8.0, 53.7], [8.5, 53.55], [8.9, 53.9], [8.8, 54.3], [8.6, 54.5], [8.7, 54.9],
  [9.4, 54.83], [10.0, 54.75], [10.9, 54.4], [10.8, 54.0], [11.4, 54.0], [12.1, 54.18], [12.9, 54.45], [13.4, 54.65],
  [14.2, 53.95], [14.4, 53.3], [14.15, 52.85], [14.6, 52.6], [14.75, 52.05], [15.0, 51.3], [14.8, 50.85], [14.3, 50.9],
  [13.5, 50.65], [12.9, 50.4], [12.2, 50.3], [12.1, 50.0], [12.55, 49.6], [13.0, 49.3], [13.8, 48.75], [13.45, 48.55],
  [13.0, 48.1], [12.9, 47.7], [13.0, 47.47], [12.2, 47.6], [11.2, 47.4], [10.5, 47.55], [10.0, 47.5], [9.6, 47.55],
  [8.6, 47.65], [7.6, 47.58], [7.55, 48.1], [7.95, 48.95], [7.0, 49.15], [6.35, 49.45], [6.5, 49.8], [6.1, 50.15],
  [6.4, 50.35], [6.0, 50.75], [6.1, 51.15], [5.9, 51.8], [6.8, 51.95], [6.75, 52.4], [7.05, 52.65], [7.2, 53.25],
];
const PATH =
  OUTLINE.map(([lng, lat], i) => {
    const p = project(lat, lng);
    return `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ") + " Z";

export function GermanyMap({ cities, selected }: { cities: MapCity[]; selected?: string }) {
  const [active, setActive] = useState<string | undefined>(selected);
  const max = Math.max(1, ...cities.map((c) => c.count));
  const current = cities.find((c) => c.name === active);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="relative mx-auto w-full max-w-sm">
        <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="h-auto w-full" role="group" aria-label="Deutschlandkarte mit Mitgliedern nach Stadt">
          <path d={PATH} className="fill-muted stroke-border" strokeWidth={1.5} strokeLinejoin="round" />
          {cities.map((c) => {
            const { x, y } = project(c.lat, c.lng);
            const r = c.count ? 5 + Math.sqrt(c.count / max) * 11 : 3;
            const isActive = c.name === active;
            const isSelected = c.name === selected;
            return (
              <Link
                key={c.name}
                href={c.href}
                scroll={false}
                aria-label={`${c.name}: ${c.count} ${c.count === 1 ? "Mitglied" : "Mitglieder"}${isSelected ? " (Filter aktiv, Klick entfernt)" : " – filtern"}`}
                onMouseEnter={() => setActive(c.name)}
                onFocus={() => setActive(c.name)}
                className="group outline-none"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  className={cn(
                    "transition-all",
                    c.count ? "fill-primary/70 stroke-primary" : "fill-muted-foreground/30 stroke-muted-foreground/40",
                    (isActive || isSelected) && "fill-primary",
                    "group-focus-visible:stroke-foreground",
                  )}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                {c.count > 0 && (
                  <text x={x} y={y + 3.5} textAnchor="middle" className="pointer-events-none fill-primary-foreground text-[10px] font-semibold">
                    {c.count}
                  </text>
                )}
                {(isActive || isSelected) && (
                  <text x={x} y={y - r - 5} textAnchor="middle" className="pointer-events-none fill-foreground text-[12px] font-semibold">
                    {c.name}
                  </text>
                )}
              </Link>
            );
          })}
        </svg>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4" aria-live="polite">
          {current ? (
            <>
              <p className="font-semibold">{current.name}</p>
              <p className="text-sm text-muted-foreground">
                {current.count} {current.count === 1 ? "Mitglied" : "Mitglieder"} mit den aktuellen Filtern
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Fahre über einen Punkt oder fokussiere ihn mit der Tab-Taste. Klick filtert nach der Stadt.</p>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-1 text-sm md:grid-cols-1">
          {[...cities].sort((a, b) => b.count - a.count).map((c) => (
            <li key={c.name}>
              <Link
                href={c.href}
                scroll={false}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted",
                  c.name === selected && "bg-primary/10 font-medium text-primary",
                )}
              >
                <span>{c.name}</span>
                <span className="tabular-nums text-muted-foreground">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
