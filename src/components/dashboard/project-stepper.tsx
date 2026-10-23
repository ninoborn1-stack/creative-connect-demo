import { Check } from "lucide-react";
import { PROJECT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Status-Stepper über PROJECT_STATUS (Entwurf → Abgeschlossen). Mobil kompakt (nur Punkte + aktuelles Label).
export function ProjectStepper({ status }: { status: string }) {
  const idx = PROJECT_STATUS.findIndex((s) => s.key === status);
  const current = PROJECT_STATUS[idx];
  return (
    <div>
      <ol className="flex items-center" aria-label={`Projektstatus: ${current?.label ?? status}`}>
        {PROJECT_STATUS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.key} className={cn("flex items-center", i < PROJECT_STATUS.length - 1 && "flex-1")} aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
                  !done && !active && "text-muted-foreground",
                )}
                title={s.label}
              >
                {done ? <Check className="size-3" aria-hidden /> : i + 1}
                <span className="sr-only">{s.label}{done ? " (erledigt)" : active ? " (aktuell)" : ""}</span>
              </span>
              {i < PROJECT_STATUS.length - 1 && <span className={cn("mx-1 h-0.5 flex-1 rounded", i < idx ? "bg-primary" : "bg-border")} aria-hidden />}
            </li>
          );
        })}
      </ol>
      <div className="mt-1.5 hidden justify-between text-[10px] text-muted-foreground sm:flex" aria-hidden>
        {PROJECT_STATUS.map((s, i) => (
          <span key={s.key} className={cn("w-0 flex-1 text-center first:text-left last:text-right", i === idx && "font-semibold text-primary")}>{s.label}</span>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground sm:hidden">{current?.label ?? status}</p>
    </div>
  );
}
