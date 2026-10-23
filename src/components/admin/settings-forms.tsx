"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { MARKETPLACE_MODES, type DEFAULT_FEES, type MarketplaceMode } from "@/lib/constants";
import { saveFees, setMarketplaceMode, updateCategory } from "@/app/actions/admin";
import { useAdminAction } from "./action-button";
import { cn } from "@/lib/utils";

const MODE_EFFECTS: Record<MarketplaceMode, string[]> = {
  closed: [
    "Landingpage: CTAs „Einladung einlösen“ und „Auf die Warteliste“.",
    "/registrieren: nur Hinweis „geschlossenes Netzwerk“ – Beitritt ausschließlich per Einladung.",
    "Verzeichnis: nur für eingeloggte Mitglieder.",
  ],
  clients: [
    "Landingpage: zusätzlicher CTA „Projekt starten“.",
    "/registrieren: Auftraggeber:innen registrieren sich ohne Einladung, Kreative weiter nur per Einladung.",
    "Verzeichnis: für alle eingeloggten Konten inkl. Auftraggeber:innen.",
  ],
  open: [
    "Landingpage: zusätzlich Verzeichnis-Teaser mit „Verzeichnis ansehen“.",
    "/registrieren: wie Phase 2 (Kreative werden weiterhin eingeladen und verifiziert).",
    "Öffentliches Verzeichnis /verzeichnis ohne Login sichtbar.",
  ],
};

export function MarketplaceModeForm({ current }: { current: MarketplaceMode }) {
  const [mode, setMode] = useState<MarketplaceMode>(current);
  const { pending, run } = useAdminAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setMarketplaceMode(mode));
      }}
    >
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as MarketplaceMode)} aria-label="Marktplatz-Modus" className="gap-3">
        {MARKETPLACE_MODES.map((m) => (
          <Label
            key={m.key}
            htmlFor={`mode-${m.key}`}
            data-testid={`marketplace-mode-${m.key}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 font-normal transition-colors hover:bg-muted/50",
              mode === m.key && "border-primary bg-primary/5",
            )}
          >
            <RadioGroupItem value={m.key} id={`mode-${m.key}`} className="mt-0.5" />
            <span className="grid gap-1">
              <span className="font-medium">
                {m.label}
                {current === m.key && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">aktiv</span>}
              </span>
              <span className="text-sm text-muted-foreground">{m.description}</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                {MODE_EFFECTS[m.key].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </span>
          </Label>
        ))}
      </RadioGroup>
      <Button type="submit" disabled={pending || mode === current} data-testid="save-marketplace-mode">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Modus speichern
      </Button>
    </form>
  );
}

type Fees = typeof DEFAULT_FEES;

const FEE_FIELDS: { key: keyof Fees; label: string; unit: string; min: number; max: number; step: number; hint: string }[] = [
  { key: "serviceFeePct", label: "Servicegebühr Auftraggeber:innen", unit: "%", min: 0, max: 30, step: 0.5, hint: "Kreative zahlen 0 % Provision." },
  { key: "proPriceEur", label: "Pro-Abo pro Monat", unit: "€", min: 0, max: 200, step: 1, hint: "Für Kreative mit Pro-Funktionen." },
  { key: "managedMarginPct", label: "Managed-Crew-Marge", unit: "%", min: 0, max: 50, step: 0.5, hint: "Aufschlag auf die Honorarsumme." },
  { key: "kskRatePct", label: "Künstlersozialabgabe", unit: "%", min: 0, max: 20, step: 0.1, hint: "Abgabesatz 2026: 4,9 %." },
  { key: "kskThresholdEur", label: "KSK-Bagatellgrenze pro Jahr", unit: "€", min: 0, max: 100000, step: 100, hint: "2026: 1.000 €." },
];

export function FeesForm({ fees }: { fees: Fees }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FEE_FIELDS.map((f) => [f.key, String(fees[f.key]).replace(".", ",")])),
  );
  const { pending, run } = useAdminAction();
  const errors = Object.fromEntries(
    FEE_FIELDS.map((f) => {
      const n = Number(values[f.key]?.replace(",", "."));
      if (values[f.key]?.trim() === "" || !Number.isFinite(n)) return [f.key, "Bitte eine Zahl eingeben."];
      if (n < f.min || n > f.max) return [f.key, `Erlaubt: ${f.min.toLocaleString("de-DE")}–${f.max.toLocaleString("de-DE")} ${f.unit}`];
      if (f.key === "kskThresholdEur" && !Number.isInteger(n)) return [f.key, "Bitte ganze Euro angeben."];
      return [f.key, ""];
    }),
  );
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasErrors) run(() => saveFees(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FEE_FIELDS.map((f) => (
          <div key={f.key} className="grid gap-1.5">
            <Label htmlFor={`fee-${f.key}`}>{f.label}</Label>
            <div className="relative">
              <Input
                id={`fee-${f.key}`}
                inputMode="decimal"
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                aria-invalid={!!errors[f.key]}
                aria-describedby={`fee-${f.key}-hint`}
                className="pr-8"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{f.unit}</span>
            </div>
            <p id={`fee-${f.key}-hint`} className={cn("text-xs", errors[f.key] ? "text-destructive" : "text-muted-foreground")}>
              {errors[f.key] || f.hint}
            </p>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={pending || hasErrors}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Gebühren speichern
      </Button>
    </form>
  );
}

export function CategoryRow({ category }: { category: { id: string; slug: string; name: string; description: string } }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const { pending, run } = useAdminAction();
  const dirty = name !== category.name || description !== category.description;
  return (
    <form
      className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateCategory(category.id, name, description));
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor={`cat-name-${category.id}`} className="text-xs text-muted-foreground">
          Name <code className="font-mono">({category.slug})</code>
        </Label>
        <Input id={`cat-name-${category.id}`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`cat-desc-${category.id}`} className="text-xs text-muted-foreground">Beschreibung</Label>
        <Textarea id={`cat-desc-${category.id}`} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="min-h-0" required />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending || !dirty} className="sm:mt-5" aria-label={`Kategorie ${category.name} speichern`}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Speichern
      </Button>
    </form>
  );
}
