import { Check } from "lucide-react";
import { PROJECT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Fortschritt eines Projekts über die Status-Phasen
export function StatusStepper({ status }: { status: string }) {
  const idx = PROJECT_STATUS.findIndex((s) => s.key === status);
  const doneAll = status === "abgeschlossen";
  if (status === "storniert") return <p className="text-sm text-destructive">Dieses Projekt wurde storniert.</p>;
  return (
    <ol className="grid grid-cols-3 gap-y-3 sm:grid-cols-6" aria-label="Projektstatus">
      {PROJECT_STATUS.map((s, i) => {
        const done = i < idx || doneAll;
        const current = i === idx && !doneAll;
        return (
          <li key={s.key} className="flex flex-col items-center gap-1.5 text-center" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary text-primary ring-4 ring-primary/20",
                !done && !current && "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-[11px] leading-tight", current ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
