import { BadgeCheck, Sparkles, Star } from "lucide-react";
import { AVAILABILITY, PAYMENT_STATUS_LABEL, PROJECT_STATUS_LABEL, REQUEST_STATUS_LABEL, categoryName } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CategoryBadge({ slug }: { slug: string }) {
  return <Badge variant="secondary">{categoryName(slug)}</Badge>;
}

export function AvailabilityDot({ value, showLabel }: { value: string; showLabel?: boolean }) {
  const a = AVAILABILITY[value as keyof typeof AVAILABILITY] ?? AVAILABILITY.ausgebucht;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", a.dot)} aria-hidden />
      <span className={showLabel ? "" : "sr-only"}>{a.label}</span>
    </span>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  if (!count) return <span className="text-xs text-muted-foreground">Noch keine Bewertung</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-medium">{value.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
      <BadgeCheck className="size-4" aria-hidden /> Verifiziert
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  entwurf: "bg-muted text-muted-foreground",
  anfragen: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  bestaetigt: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  produktion: "bg-primary/15 text-primary",
  abnahme: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  abgeschlossen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  storniert: "bg-destructive/15 text-destructive",
  offen: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  angenommen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  abgelehnt: "bg-destructive/15 text-destructive",
  gegenangebot: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  zurueckgezogen: "bg-muted text-muted-foreground",
  reserviert: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  freigegeben: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  ausgezahlt: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  erstattet: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, kind = "project" }: { status: string; kind?: "project" | "request" | "payment" }) {
  const label = (kind === "project" ? PROJECT_STATUS_LABEL : kind === "request" ? REQUEST_STATUS_LABEL : PAYMENT_STATUS_LABEL)[status] ?? status;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_TONE[status] ?? "bg-muted")}>{label}</span>;
}

// Kennzeichnung nach EU AI Act Art. 50
export function AiNotice({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm", className)} role="note">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p>{children ?? <><strong>KI-Vorschlag – du entscheidest.</strong> Der Assistent organisiert, Menschen gestalten. Alle Vorschläge sind bearbeitbar.</>}</p>
    </div>
  );
}
