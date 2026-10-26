import { OPPORTUNITY_STATUS, PITCH_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const OPP_TONE: Record<string, string> = {
  offen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  in_auswahl: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  vergeben: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  geschlossen: "bg-muted text-muted-foreground",
};

const PITCH_TONE: Record<string, string> = {
  eingereicht: "bg-muted text-foreground",
  shortlist: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  angenommen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  abgelehnt: "bg-destructive/15 text-destructive",
  zurueckgezogen: "bg-muted text-muted-foreground",
};

export function OpportunityStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", OPP_TONE[status] ?? "bg-muted", className)}>
      {OPPORTUNITY_STATUS[status] ?? status}
    </span>
  );
}

export function PitchStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", PITCH_TONE[status] ?? "bg-muted", className)}>
      {PITCH_STATUS[status] ?? status}
    </span>
  );
}

export function budgetRange(min: number, max: number) {
  const f = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k` : String(v));
  return min === max ? `${f(min)} €` : `${f(min)}–${f(max)} €`;
}
