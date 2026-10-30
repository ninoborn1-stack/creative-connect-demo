import Link from "next/link";
import { ArrowRight, Library, Lock, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { formatEur } from "@/lib/format";
import { formatDuration, isAudioType, isExclusivelyTaken, workTypeLabel } from "@/lib/licensing";
import { WorkAudio, WorkImage } from "./work-visual";
import { Badge } from "@/components/ui/badge";
import { FEATURES } from "@/lib/features";

// Werke einer Person als kompakte Liste – zum Einbau in Profilseiten:
// <CreatorWorksSection userId={user.id} limit={4} />  (rendert nichts, wenn keine Werke vorhanden sind)
export async function CreatorWorksSection({ userId, limit = 4, title = FEATURES.lizenzen ? "Lizenzierbare Werke" : "Musik & Stock" }: { userId: string; limit?: number; title?: string }) {
  const [works, total] = await Promise.all([
    db.licensableWork.findMany({
      where: { ownerId: userId },
      include: { licenses: { select: { tier: true, status: true } } },
      orderBy: [{ featured: "desc" }, { plays: "desc" }],
      take: limit,
    }),
    db.licensableWork.count({ where: { ownerId: userId } }),
  ]);
  if (works.length === 0) return null;

  return (
    <section aria-labelledby={`werke-${userId}`} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`werke-${userId}`} className="flex items-center gap-2 text-xl font-semibold">
          <Library className="size-5 text-primary" aria-hidden />{title}
        </h2>
        <Link href="/lizenzen" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          {FEATURES.lizenzen ? "Zum Lizenz-Katalog" : "Alle Werke"}<ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {works.map((w) => {
          const audio = isAudioType(w.type);
          const taken = isExclusivelyTaken(w.licenses);
          const meta = [workTypeLabel(w.type), formatDuration(w.durationSec), w.bpm ? `${w.bpm} BPM` : null].filter(Boolean).join(" · ");
          return (
            <li key={w.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              {audio ? (
                <WorkAudio work={w} subtitle={meta} className="min-w-0 flex-1 border-0 bg-transparent p-0" />
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <WorkImage work={w} sizes="56px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{w.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{meta}</p>
                  </div>
                </div>
              )}
              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div className="flex items-center gap-1.5">
                  {w.aiMarked && <Sparkles className="size-3.5 text-primary" aria-label="KI-gekennzeichnet" />}
                  {taken ? (
                    <Badge variant="secondary" className="gap-1"><Lock className="size-3" aria-hidden />Exklusiv vergeben</Badge>
                  ) : !FEATURES.lizenzen ? null : (
                    <span className="text-sm"><span className="text-muted-foreground">ab </span><span className="font-semibold">{formatEur(w.priceStandard)}</span></span>
                  )}
                </div>
                <Link href={`/lizenzen/${w.slug}`} className="text-sm font-medium text-primary hover:underline" aria-label={`${w.title} ${taken ? "ansehen" : FEATURES.lizenzen ? "lizenzieren" : "anfragen"}`}>
                  {taken ? "Ansehen" : FEATURES.lizenzen ? "Lizenzieren" : "Anfragen"}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {total > works.length && (
        <p className="text-sm text-muted-foreground">und {total - works.length} weitere {total - works.length === 1 ? "Werk" : "Werke"} im Katalog</p>
      )}
    </section>
  );
}
