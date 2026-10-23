import { ArrowRight, Banknote, CircleCheck, Landmark, Lock, ShieldCheck, Undo2 } from "lucide-react";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FlowSums = Record<"reserviert" | "freigegeben" | "ausgezahlt" | "erstattet", { amount: number; count: number }>;

const STEPS = [
  {
    key: "reserviert",
    label: "Reserviert",
    text: "Bei Buchung wird der Betrag beim Zahlungsdienstleister reserviert.",
    icon: Lock,
    tone: "text-amber-600 dark:text-amber-300 bg-amber-500/15 ring-amber-500/30",
    bar: "bg-amber-500",
  },
  {
    key: "freigegeben",
    label: "Freigegeben nach Abnahme",
    text: "Mit der Abnahme im Projektraum wird die Zahlung freigegeben.",
    icon: CircleCheck,
    tone: "text-sky-600 dark:text-sky-300 bg-sky-500/15 ring-sky-500/30",
    bar: "bg-sky-500",
  },
  {
    key: "ausgezahlt",
    label: "Ausgezahlt",
    text: "Der Dienstleister zahlt das Honorar direkt an die Kreativen aus.",
    icon: Banknote,
    tone: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/15 ring-emerald-500/30",
    bar: "bg-emerald-500",
  },
] as const;

export function PaymentFlow({ sums, amountLabel }: { sums: FlowSums; amountLabel: string }) {
  const total = STEPS.reduce((s, step) => s + sums[step.key].amount, 0);
  return (
    <section aria-labelledby="zahlungsablauf" className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="zahlungsablauf" className="text-lg font-semibold">
            So läuft die Zahlung
          </h2>
          <p className="text-sm text-muted-foreground">{amountLabel}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Gesamt <span className="font-semibold text-foreground">{formatEur(total)}</span>
        </p>
      </div>

      <ol className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const s = sums[step.key];
          return (
            <li key={step.key} className="contents">
              <div className="flex gap-3 rounded-xl border bg-background/40 p-4 md:flex-col">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full ring-1", step.tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Schritt {i + 1}</p>
                  <p className="font-medium">{step.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{formatEur(s.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.count} {s.count === 1 ? "Zahlung" : "Zahlungen"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center justify-center text-muted-foreground" aria-hidden>
                  <ArrowRight className="size-5 rotate-90 md:rotate-0" />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {total > 0 && (
        <div className="mt-5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Verteilung der Beträge nach Status">
            {STEPS.map((step) => {
              const pct = (sums[step.key].amount / total) * 100;
              return pct > 0 ? <div key={step.key} className={step.bar} style={{ width: `${pct}%` }} /> : null;
            })}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {STEPS.map((step) => (
              <li key={step.key} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", step.bar)} aria-hidden />
                {step.label.split(" ")[0]} {Math.round((sums[step.key].amount / total) * 100)} %
              </li>
            ))}
            {sums.erstattet.count > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <Undo2 className="size-3" aria-hidden /> Erstattet {formatEur(sums.erstattet.amount)}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm" role="note">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">Das Geld liegt beim lizenzierten Zahlungsdienstleister, nicht bei Creative Connect.</p>
          <p className="text-muted-foreground">
            Creative Connect hat kein eigenes Treuhandkonto und hält nie fremde Gelder. Reservierung, Freigabe und Auszahlung laufen
            direkt über den regulierten Anbieter – in dieser Demo simuliert.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Landmark className="size-3.5" aria-hidden /> Mock-Zahlungsdienstleister · keine echten Zahlungen
          </p>
        </div>
      </div>
    </section>
  );
}
