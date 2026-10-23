"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { formatEur } from "@/lib/format";
import { UserAvatar } from "@/components/user-avatar";
import { Rating, VerifiedBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import type { CrewSuggestion } from "./types";

export function SuggestionCard({ s, selected, onToggle }: { s: CrewSuggestion; selected: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border bg-background p-3 transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`${s.name} ${selected ? "abwählen" : "auswählen"}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
        data-testid="suggestion-toggle"
      />
      <div className="flex items-center gap-3">
        <UserAvatar name={s.name} seed={s.avatarSeed} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{s.name}</p>
          <p className="truncate text-xs text-muted-foreground">{s.city} · ab {formatEur(s.dayRateMin)}/Tag</p>
        </div>
        <span
          className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}
          aria-hidden
        >
          {selected && <Check className="size-3.5" />}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Rating value={s.ratingAvg} count={s.ratingCount} />
        {s.verified && <VerifiedBadge />}
      </div>
      {s.reasons.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Passt, weil </span>
          {s.reasons.join(", ")}.
        </p>
      )}
      <Link href={`/mitglieder/${s.slug}`} target="_blank" className="relative z-10 w-fit text-xs text-primary underline-offset-4 hover:underline">
        Profil ansehen
      </Link>
    </div>
  );
}
