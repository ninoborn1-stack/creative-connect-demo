import { cn } from "@/lib/utils";
import { DISPUTE_STATUS, DISPUTE_STATUS_TONE } from "./admin-constants";

export function DisputeStatus({ status }: { status: string }) {
  const label = DISPUTE_STATUS.find((s) => s.key === status)?.label ?? status;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", DISPUTE_STATUS_TONE[status] ?? "bg-muted")}>{label}</span>;
}
