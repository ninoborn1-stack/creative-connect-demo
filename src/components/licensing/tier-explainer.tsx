import { ShieldCheck } from "lucide-react";
import { LICENSE_TIERS } from "@/lib/constants";

// Erklärbox: Was umfassen die Lizenzstufen?
export function TierExplainer({ serviceFeePct }: { serviceFeePct: number }) {
  return (
    <section aria-labelledby="lizenzstufen" className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 id="lizenzstufen" className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck className="size-5 text-primary" aria-hidden />So funktionieren die Lizenzstufen
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Jede Lizenz ist einfach, nachvollziehbar und mit Zertifikat dokumentiert. Medien, Gebiet und Laufzeit lassen sich im Konfigurator erweitern.
      </p>
      <dl className="grid gap-3 sm:grid-cols-3">
        {Object.entries(LICENSE_TIERS).map(([key, t]) => (
          <div key={key} className="rounded-lg border bg-background/50 p-3">
            <dt className="font-medium">{t.label}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{t.summary}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Die Lizenzgebühr geht zu 100 % an die:den Urheber:in (0 % Provision). Creative Connect berechnet Lizenznehmer:innen separat {serviceFeePct} % Servicegebühr.
      </p>
    </section>
  );
}
