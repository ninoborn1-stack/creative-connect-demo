import { cn } from "@/lib/utils";
import { SESSION_TONE, sessionTypeLabel } from "./session-utils";

const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  gebucht: { label: "Gebucht", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  teilgenommen: { label: "Teilgenommen", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  abgesagt: { label: "Abgesagt", tone: "bg-muted text-muted-foreground" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUS[status] ?? { label: status, tone: "bg-muted" };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", s.tone)}>{s.label}</span>;
}

export function SessionTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", SESSION_TONE[type] ?? "bg-muted", className)}>
      {sessionTypeLabel(type)}
    </span>
  );
}
