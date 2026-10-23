import { Check } from "lucide-react";
import { PAYMENT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Kleiner Zahlungsfluss: reserviert → freigegeben → ausgezahlt
export function PaymentFlow({ status }: { status: string }) {
  if (status === "erstattet") return <span className="text-xs text-muted-foreground">Erstattet</span>;
  const idx = PAYMENT_STATUS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center gap-1" aria-label="Zahlungsfluss">
      {PAYMENT_STATUS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1" aria-current={i === idx ? "step" : undefined}>
          {i > 0 && <span className={cn("h-px w-3 sm:w-5", i <= idx ? "bg-primary" : "bg-border")} aria-hidden />}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              i < idx && "bg-primary/15 text-primary",
              i === idx && "bg-primary text-primary-foreground",
              i > idx && "bg-muted text-muted-foreground",
            )}
          >
            {i < idx && <Check className="size-3" aria-hidden />}
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
