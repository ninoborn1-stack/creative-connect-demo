"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Download, Info, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { licenseWork } from "@/app/actions/licensing";
import { LICENSE_MEDIA, LICENSE_TIERS, TERRITORIES } from "@/lib/constants";
import { formatDate, formatEur } from "@/lib/format";
import { DURATION_OPTIONS, TIER_KEYS, calcLicensePrice, defaultConfig, durationLabel, normalizeConfig, tierBase, type LicenseConfig, type LicenseTier } from "@/lib/licensing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/venues/native-select";

type Props = {
  work: { id: string; title: string; ownerName: string; priceStandard: number; priceExtended: number; priceExclusive: number | null };
  serviceFeePct: number;
  companyName: string | null;
  initial?: LicenseConfig & { projectName?: string };
  renewalOf?: string;
};

type Confirmed = { number: string; licenseFee: number; serviceFee: number; providerRef: string; endsAt: string | null };

export function LicenseConfigurator({ work, serviceFeePct, companyName, initial, renewalOf }: Props) {
  const tiers = TIER_KEYS.filter((t) => tierBase(work, t) != null);
  const [config, setConfig] = useState<LicenseConfig>(() =>
    initial && tiers.includes(initial.tier) ? normalizeConfig(initial) : defaultConfig("standard"),
  );
  const [projectName, setProjectName] = useState(initial?.projectName ?? "");
  const [asCompany, setAsCompany] = useState(Boolean(companyName));
  const [payOpen, setPayOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(() => calcLicensePrice(work, config, serviceFeePct), [work, config, serviceFeePct]);
  const exclusive = config.tier === "exklusiv";
  const includedMedia = LICENSE_TIERS[config.tier].media as readonly string[];
  const licensee = asCompany && companyName ? companyName : "dich persönlich";
  const canSubmit = price && config.media.length > 0 && projectName.trim().length >= 2;

  function selectTier(t: LicenseTier) {
    setConfig(defaultConfig(t));
  }
  function toggleMedium(m: string, on: boolean) {
    setConfig((c) => ({ ...c, media: on ? [...c.media, m] : c.media.filter((x) => x !== m) }));
  }

  function openPayment() {
    if (!canSubmit) {
      setError(projectName.trim().length < 2 ? "Bitte gib einen Projektnamen an." : "Bitte wähle mindestens ein Medium.");
      return;
    }
    setError(null);
    setPayOpen(true);
  }

  function pay() {
    startTransition(async () => {
      const res = await licenseWork({ workId: work.id, ...config, projectName, asCompany: asCompany && Boolean(companyName) });
      if (!res.ok) {
        toast.error(res.error);
        setError(res.error);
        setPayOpen(false);
        return;
      }
      setPayOpen(false);
      setConfirmed(res);
      toast.success(`Lizenz ${res.number} erteilt`);
    });
  }

  if (confirmed) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4" role="status" data-testid="license-confirmed">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
          <div className="min-w-0 space-y-1 text-sm">
            <p className="text-base font-semibold">Lizenz erteilt</p>
            <p>
              <strong>{confirmed.number}</strong> · {work.title} · {LICENSE_TIERS[config.tier].label}
            </p>
            <p className="text-muted-foreground">
              {config.media.map((m) => LICENSE_MEDIA[m]).join(", ")} · {TERRITORIES[config.territory]} ·{" "}
              {confirmed.endsAt ? `gültig bis ${formatDate(confirmed.endsAt)}` : "unbefristet"}
            </p>
            <p>
              {formatEur(confirmed.licenseFee)} Lizenzgebühr + {formatEur(confirmed.serviceFee)} Servicegebühr ={" "}
              <strong>{formatEur(confirmed.licenseFee + confirmed.serviceFee)}</strong> bezahlt (Demo)
            </p>
            <p className="break-all text-xs text-muted-foreground">Referenz Zahlungsdienstleister: {confirmed.providerRef}</p>
            <p className="text-xs text-muted-foreground">{work.ownerName} wurde benachrichtigt, die Bestätigung liegt in deiner Outbox.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm">
                <a href={`/lizenzen/zertifikat/${confirmed.number}`} download data-testid="license-certificate">
                  <Download aria-hidden />Zertifikat (PDF)
                </a>
              </Button>
              <Button asChild size="sm" variant="outline"><Link href="/lizenzen/meine">Meine Lizenzen</Link></Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="konfigurator-titel">
      <div>
        <h2 id="konfigurator-titel" className="text-lg font-semibold">{renewalOf ? "Lizenz verlängern" : "Lizenz konfigurieren"}</h2>
        {renewalOf && <p className="text-xs text-muted-foreground">Vorbelegt aus Lizenz {renewalOf} – die neue Lizenz startet heute.</p>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Lizenzstufe</legend>
        <div className="grid gap-2" role="radiogroup" aria-label="Lizenzstufe">
          {tiers.map((t) => {
            const active = config.tier === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectTier(t)}
                data-testid={`license-tier-${t}`}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "border-primary bg-primary/10" : "hover:border-primary/50",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{LICENSE_TIERS[t].label}</span>
                  <span className="block text-xs text-muted-foreground">{LICENSE_TIERS[t].summary}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatEur(tierBase(work, t)!)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={exclusive}>
        <legend className="mb-2 text-sm font-medium">Medien</legend>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {Object.entries(LICENSE_MEDIA).map(([m, label]) => {
            const included = includedMedia.includes(m);
            return (
              <label key={m} className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm has-[:checked]:border-primary/60 has-[:disabled]:opacity-80">
                <input type="checkbox" className="size-4 accent-primary" checked={config.media.includes(m)} onChange={(e) => toggleMedium(m, e.target.checked)} />
                <span className="min-w-0 flex-1">{label}</span>
                {!included && !exclusive && <span className="text-xs text-muted-foreground">+Aufpreis</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="lc-territory">Gebiet</Label>
          <NativeSelect id="lc-territory" value={config.territory} disabled={exclusive} onChange={(e) => setConfig((c) => ({ ...c, territory: e.target.value }))}>
            {Object.entries(TERRITORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lc-duration">Laufzeit</Label>
          <NativeSelect
            id="lc-duration"
            value={config.durationMonths == null ? "unbefristet" : String(config.durationMonths)}
            disabled={exclusive}
            onChange={(e) => setConfig((c) => ({ ...c, durationMonths: e.target.value === "unbefristet" ? null : Number(e.target.value) }))}
          >
            {DURATION_OPTIONS.map((d) => <option key={d.label} value={d.value == null ? "unbefristet" : d.value}>{d.label}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="lc-project">Projektname</Label>
          <Input id="lc-project" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="z. B. Season-Trailer, Imagefilm 2026" maxLength={120} required aria-required />
        </div>
        <fieldset className="grid gap-1.5 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Lizenznehmer:in</legend>
          {companyName ? (
            <div className="flex flex-col gap-1.5 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="lc-licensee" className="size-4 accent-primary" checked={asCompany} onChange={() => setAsCompany(true)} />
                Firma: {companyName}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="lc-licensee" className="size-4 accent-primary" checked={!asCompany} onChange={() => setAsCompany(false)} />
                Persönlich (auf meinen Namen)
              </label>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Persönliche Lizenz auf deinen Namen. Mit einem Firmenprofil kannst du im Namen deines Unternehmens lizenzieren.</p>
          )}
        </fieldset>
      </div>

      {price && (
        <dl className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm" aria-label="Preis-Aufschlüsselung" aria-live="polite">
          {price.lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-3">
              <dt className="min-w-0 text-muted-foreground">{l.label}</dt>
              <dd className="shrink-0 tabular-nums">{formatEur(l.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t pt-1.5">
            <dt>Lizenzgebühr – 100 % an {work.ownerName}</dt>
            <dd className="shrink-0 font-medium tabular-nums">{formatEur(price.licenseFee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Servicegebühr Plattform ({price.serviceFeePct} %)</dt>
            <dd className="shrink-0 tabular-nums">{formatEur(price.serviceFee)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t pt-1.5 text-base font-semibold">
            <dt>Gesamt</dt>
            <dd className="tabular-nums" data-testid="license-total">{formatEur(price.total)}</dd>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">Netto-Beträge. Lizenzgebühr auf 5 € gerundet.</p>
        </dl>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button className="h-10 w-full" onClick={openPayment} data-testid="license-buy">
        Jetzt lizenzieren
      </Button>

      <Dialog open={payOpen} onOpenChange={(o) => !pending && setPayOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Lock className="size-3.5" aria-hidden />MockPay · sicherer Checkout
            </div>
            <DialogTitle className="text-lg">Mock-Zahlung</DialogTitle>
            <DialogDescription>
              „{work.title}“ · {LICENSE_TIERS[config.tier].label} · {TERRITORIES[config.territory]} · {durationLabel(config.durationMonths)} · für {licensee}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm" role="note">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
            <p><strong>Demo – keine echte Zahlung.</strong> Die Lizenz wird mit der (simulierten) Zahlung wirksam; die Lizenzgebühr wird direkt an die:den Urheber:in ausgezahlt.</p>
          </div>
          {price && (
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Lizenzgebühr</dt><dd>{formatEur(price.licenseFee)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Servicegebühr ({price.serviceFeePct} %)</dt><dd>{formatEur(price.serviceFee)}</dd></div>
              <div className="flex justify-between border-t pt-1.5 text-base font-semibold"><dt>Zu zahlen</dt><dd>{formatEur(price.total)}</dd></div>
            </dl>
          )}
          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm">
            <CreditCard className="size-5 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">Demo-Zahlungsmittel</p>
              <p className="text-xs text-muted-foreground">Keine Eingabe nötig – es fließt kein Geld.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={pending}>Abbrechen</Button>
            <Button onClick={pay} disabled={pending} data-testid="license-confirm-payment">
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {price ? `${formatEur(price.total)} bezahlen` : "Bezahlen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
