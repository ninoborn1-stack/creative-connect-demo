import Link from "next/link";
import { Eye, Headphones, Lock, Sparkles } from "lucide-react";
import { formatEur, formatNumber, parseJson } from "@/lib/format";
import { formatDuration, isAudioType, workTypeLabel } from "@/lib/licensing";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { WorkAudio, WorkImage } from "./work-visual";
import { cn } from "@/lib/utils";

export type WorkCardData = {
  id: string;
  slug: string;
  type: string;
  title: string;
  tags: string;
  imageSeed: string;
  previewUrl: string | null;
  durationSec: number | null;
  bpm: number | null;
  musicalKey: string | null;
  priceStandard: number;
  aiMarked: boolean;
  featured?: boolean;
  plays: number;
  owner: { name: string; profile: { slug: string; avatarSeed: string } | null };
};

// Prisma-Include für die Karte: db.licensableWork.findMany({ include: WORK_CARD_INCLUDE })
export const WORK_CARD_INCLUDE = {
  owner: { select: { name: true, profile: { select: { slug: true, avatarSeed: true } } } },
  licenses: { select: { tier: true, status: true } },
} as const;

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  return <Badge className={cn("bg-background/85 text-foreground backdrop-blur", className)}>{workTypeLabel(type)}</Badge>;
}

// Wiederverwendbare Werk-Karte für Katalog, Startseite und Profile
export function WorkCard({ work, exclusiveTaken = false, className }: { work: WorkCardData; exclusiveTaken?: boolean; className?: string }) {
  const tags = parseJson<string[]>(work.tags, []);
  const audio = isAudioType(work.type);
  const meta = [formatDuration(work.durationSec), work.bpm ? `${work.bpm} BPM` : null, work.musicalKey].filter(Boolean).join(" · ");
  const href = `/lizenzen/${work.slug}`;

  return (
    <article className={cn("group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50", className)} data-testid="work-card">
      {audio ? (
        <div className="relative border-b bg-gradient-to-br from-primary/25 via-primary/5 to-transparent p-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={work.type} />
            {work.featured && <Badge className="bg-primary text-primary-foreground">Empfohlen</Badge>}
            {exclusiveTaken && <Badge variant="secondary" className="gap-1"><Lock className="size-3" aria-hidden />Exklusiv vergeben</Badge>}
          </div>
          <WorkAudio work={work} subtitle={meta || undefined} className="bg-background/70" />
        </div>
      ) : (
        <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
          <WorkImage work={work} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <TypeBadge type={work.type} />
            {work.featured && <Badge className="bg-primary text-primary-foreground">Empfohlen</Badge>}
            {exclusiveTaken && <Badge variant="secondary" className="gap-1"><Lock className="size-3" aria-hidden />Exklusiv vergeben</Badge>}
          </div>
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base leading-tight font-semibold">
          <Link href={href} className="hover:underline focus-visible:underline focus-visible:outline-none">{work.title}</Link>
        </h3>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <UserAvatar name={work.owner.name} seed={work.owner.profile?.avatarSeed} className="size-6" />
          {work.owner.profile ? (
            <Link href={`/mitglieder/${work.owner.profile.slug}`} className="truncate text-muted-foreground hover:text-foreground hover:underline">{work.owner.name}</Link>
          ) : (
            <span className="truncate text-muted-foreground">{work.owner.name}</span>
          )}
        </div>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label="Tags">
            {tags.slice(0, 3).map((t) => (
              <li key={t}><Badge variant="outline" className="font-normal">{t}</Badge></li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="text-sm">
            <span className="text-muted-foreground">ab </span>
            <span className="text-base font-semibold">{formatEur(work.priceStandard)}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {work.aiMarked && (
              <span className="inline-flex items-center gap-1 text-primary" title="Mit KI-Unterstützung erstellt (gekennzeichnet nach AI Act)">
                <Sparkles className="size-3.5" aria-hidden />KI
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              {audio ? <Headphones className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
              <span className="sr-only">{audio ? "Plays:" : "Aufrufe:"}</span>{formatNumber(work.plays)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
