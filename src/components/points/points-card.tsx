import Link from "next/link";
import { ArrowRight, Gem, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Summary = { balance: number; level: { label: string }; next: { label: string; min: number } | null; progress: number };

export function LevelBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary", className)}>
      <Trophy className="size-3" aria-hidden /> {label}
    </span>
  );
}

export function LevelProgress({ summary }: { summary: Summary }) {
  const { balance, next, progress } = summary;
  return (
    <div>
      <Progress value={progress} className="h-2" aria-label={next ? `Fortschritt bis ${next.label}` : "Höchstes Level erreicht"} />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {next ? <>Noch <strong className="text-foreground">{formatNumber(next.min - balance)}</strong> Punkte bis „{next.label}“</> : "Höchstes Level erreicht – willkommen in der Familie!"}
      </p>
    </div>
  );
}

// Kompakte Punkte-Karte für Profil und Dashboard
export function PointsCard({ summary, className }: { summary: Summary; className?: string }) {
  return (
    <section aria-labelledby="punkte-karte" className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="punkte-karte" className="flex items-center gap-2 text-base font-semibold"><Gem className="size-4 text-primary" aria-hidden /> Meine Punkte</h2>
        <Link href="/punkte" className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Punkte & Belohnungen <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-3xl font-bold tabular-nums">{formatNumber(summary.balance)}</p>
        <p className="pb-1 text-sm text-muted-foreground">Punkte</p>
        <LevelBadge label={summary.level.label} className="mb-1.5" />
      </div>
      <LevelProgress summary={summary} />
    </section>
  );
}
