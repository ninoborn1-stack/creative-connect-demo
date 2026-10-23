import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";

// Budget-Ampel: grün ≤ 100 %, gelb ≤ 110 %, rot darüber
export function BudgetMeter({ planned, budget, className }: { planned: number; budget: number; className?: string }) {
  const pct = budget > 0 ? Math.round((planned / budget) * 100) : 0;
  const tone = pct <= 100 ? "green" : pct <= 110 ? "yellow" : "red";
  const bar = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-destructive" }[tone];
  const text = { green: "Im Budget", yellow: "Leicht über Budget", red: "Über Budget" }[tone];
  return (
    <div className={cn("space-y-2", className)} data-testid="budget-meter" data-tone={tone}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className={cn("size-2.5 rounded-full", bar)} aria-hidden /> {text}
        </span>
        <span className="tabular-nums text-muted-foreground">{formatEur(planned)} von {formatEur(budget)} ({pct} %)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={110} aria-valuenow={Math.min(pct, 110)} aria-label="Budgetauslastung">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
