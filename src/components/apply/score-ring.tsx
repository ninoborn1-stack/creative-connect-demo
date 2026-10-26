import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/application-meta";

// Kreisanzeige für den Vorprüfungs-Score (0–100)
export function ScoreRing({ score, size = 72, className, label = "Vorprüfung" }: { score: number; size?: number; className?: string; label?: string }) {
  const stroke = Math.max(5, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", scoreTone(value), className)} style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value} von 100 Punkten`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <span className="absolute font-semibold text-foreground tabular-nums" style={{ fontSize: Math.round(size * 0.28) }} aria-hidden>
        {value}
      </span>
    </div>
  );
}
