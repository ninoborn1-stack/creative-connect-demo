import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationCheck } from "@/lib/application-meta";

export function ChecksList({ checks, className }: { checks: ApplicationCheck[]; className?: string }) {
  return (
    <ul className={cn("divide-y rounded-xl border", className)}>
      {checks.map((c) => (
        <li key={c.label} className="flex items-start gap-3 p-3 text-sm">
          {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="erfüllt" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-label="offen" />}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{c.label}</p>
            <p className="text-xs break-words text-muted-foreground">{c.hint}</p>
          </div>
          {c.max != null && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{c.points ?? 0}/{c.max}</span>}
        </li>
      ))}
    </ul>
  );
}
