import { BadgeEuro, Ban, Compass, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

// Faustregel: mehr als 5/6 des Umsatzes mit einer Auftraggeber:in ist ein Warnsignal (arbeitnehmerähnliche Selbstständigkeit)
const WARN_PCT = 83;

function ShareMeter({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  const tone = value === null ? "bg-muted" : value > WARN_PCT ? "bg-destructive" : value > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="rounded-xl border bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value === null ? "–" : `${value} %`}</p>
      <div className="relative mt-3 h-2 rounded-full bg-muted" role="img" aria-label={`${label}: ${value ?? 0} Prozent`}>
        <div className={cn("h-2 rounded-full", tone)} style={{ width: `${value ?? 0}%` }} />
        <div className="absolute -top-1 h-4 w-px bg-foreground/60" style={{ left: `${WARN_PCT}%` }} aria-hidden />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function IndependenceBox({
  profileShare,
  computedShare,
  topClientName,
}: {
  profileShare: number | null;
  computedShare: number | null;
  topClientName?: string;
}) {
  const points = [
    { icon: BadgeEuro, title: "Preise selbst setzen", text: "Du bestimmst Tagessatz und Angebot – Gegenangebote inklusive." },
    { icon: Ban, title: "Frei ablehnen", text: "Anfragen kannst du ohne Begründung und ohne Nachteile ablehnen." },
    { icon: Compass, title: "Weisungsfrei arbeiten", text: "Wie, wann und womit du arbeitest, entscheidest du selbst." },
  ];
  return (
    <section aria-labelledby="selbststaendig" className="rounded-2xl border bg-card p-4 sm:p-6">
      <h2 id="selbststaendig" className="text-lg font-semibold">
        Deine Selbstständigkeit
      </h2>
      <p className="text-sm text-muted-foreground">Creative Connect vermittelt – du bleibst eigenständige:r Unternehmer:in.</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {points.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-xl border bg-background/40 p-4 sm:flex-col">
            <Icon className="size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-base font-semibold">Anteil größter Auftraggeber</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ShareMeter label="Laut Profil (alle Einnahmen)" value={profileShare} hint="Selbstauskunft im Profil, inklusive Aufträge außerhalb der Plattform." />
        <ShareMeter
          label="Aus deinen Zahlungen hier"
          value={computedShare}
          hint={computedShare === null ? "Noch keine Zahlungen über Creative Connect." : `Größte:r Auftraggeber:in: ${topClientName ?? "–"}`}
        />
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Faustregel: Liegt der Anteil dauerhaft über 5/6 (ca. {WARN_PCT} %, Markierung), kann Rentenversicherungspflicht als
        arbeitnehmerähnliche:r Selbstständige:r bestehen. Kein Rechtsrat.
      </p>
    </section>
  );
}
