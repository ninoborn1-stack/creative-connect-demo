import { Sparkles } from "lucide-react";
import { APPLICATION_STATUS } from "@/lib/constants";
import { APPLICATION_STATUS_TONE } from "@/lib/application-meta";
import { cn } from "@/lib/utils";

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", APPLICATION_STATUS_TONE[status] ?? "bg-muted")}>{APPLICATION_STATUS[status] ?? status}</span>;
}

export function TrackBadge({ track }: { track: string }) {
  return track === "netzwerk" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <Sparkles className="size-3" aria-hidden /> Fast-Track
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Selbstbewerbung</span>
  );
}
