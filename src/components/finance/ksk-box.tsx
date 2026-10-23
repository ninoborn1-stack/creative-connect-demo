import { Download, Palette, Scale } from "lucide-react";
import { formatEur, formatEurExact } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function KskBox({
  year,
  ratePct,
  thresholdEur,
  total,
  liableTotal,
  levy,
  aboveThreshold,
  count,
}: {
  year: number;
  ratePct: number;
  thresholdEur: number;
  total: number;
  liableTotal: number;
  levy: number;
  aboveThreshold: boolean;
  count: number;
}) {
  const rate = ratePct.toLocaleString("de-DE");
  const thresholdPct = Math.min(100, Math.round((liableTotal / thresholdEur) * 100));
  return (
    <section aria-labelledby="ksk" className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Palette className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="ksk" className="text-lg font-semibold">
            Künstlersozialabgabe {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Auf Honorare an selbstständige Künstler:innen und Publizist:innen kann für dich als Auftraggeber:in eine Abgabe an die
            Künstlersozialkasse anfallen. Satz {year}: <strong className="text-foreground">{rate} %</strong>, Bagatellgrenze{" "}
            <strong className="text-foreground">{formatEur(thresholdEur)}/Jahr</strong>.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-background/40 p-4">
          <dt className="text-xs text-muted-foreground">Honorare {year} gesamt</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums">{formatEur(total)}</dd>
          <dd className="text-xs text-muted-foreground">
            {count} {count === 1 ? "Zahlung" : "Zahlungen"}
          </dd>
        </div>
        <div className="rounded-xl border bg-background/40 p-4">
          <dt className="text-xs text-muted-foreground">davon künstlerisch (abgabepflichtig)</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums">{formatEur(liableTotal)}</dd>
          <dd className="text-xs text-muted-foreground">ohne reine Studio-/Raummiete</dd>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <dt className="text-xs text-muted-foreground">Mögliche Abgabe ({rate} %)</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-primary">{formatEurExact(levy)}</dd>
          <dd className="text-xs text-muted-foreground">{aboveThreshold ? "Bagatellgrenze überschritten" : "unter der Bagatellgrenze"}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Bagatellgrenze</span>
          <span className="tabular-nums">
            {formatEur(liableTotal)} / {formatEur(thresholdEur)}
          </span>
        </div>
        <Progress value={thresholdPct} aria-label="Ausschöpfung der Bagatellgrenze" />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Kein Rechtsrat – vereinfachte Schätzung. Die Meldung an die KSK erfolgt durch dich bzw. deine Steuerberatung.
        </p>
        <Button asChild variant="outline" className="shrink-0">
          <a href="/finanzen/ksk-export" download>
            <Download aria-hidden /> Jahresübersicht exportieren (CSV)
          </a>
        </Button>
      </div>
    </section>
  );
}
