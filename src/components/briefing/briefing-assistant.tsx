"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, RefreshCw, Scale, Sparkles, Trash2, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { analyzeBriefing, createProjectFromBriefing, suggestForRole } from "@/app/actions/briefing";
import { CATEGORIES, categoryName } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { AiNotice } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SuggestionCard } from "./suggestion-card";
import { VoiceRecorder } from "./voice-recorder";
import type { AnalyzedBriefing, CrewSuggestion } from "./types";

type Fees = { serviceFeePct: number; managedMarginPct: number; kskRatePct: number; kskThresholdEur: number };
type Details = Omit<AnalyzedBriefing, "roles">;
type EditRole = { key: string; title: string; category: string; budget: number; reason: string; suggestions: CrewSuggestion[]; selected: string[]; loading?: boolean };

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function rescale(roles: EditRole[], oldTotal: number, newTotal: number): EditRole[] {
  if (!roles.length) return roles;
  const next = roles.map((r) => ({
    ...r,
    budget: oldTotal > 0 ? Math.round(((r.budget / oldTotal) * newTotal) / 10) * 10 : Math.floor(newTotal / roles.length),
  }));
  next[0].budget += newTotal - next.reduce((a, r) => a + r.budget, 0);
  return next;
}

export function BriefingAssistant({
  demos, transcript, fees,
}: { demos: { label: string; text: string }[]; transcript: string; fees: Fees }) {
  const [raw, setRaw] = useState("");
  const [details, setDetails] = useState<Details | null>(null);
  const [roles, setRoles] = useState<EditRole[]>([]);
  const [mode, setMode] = useState<"self" | "managed">("self");
  const [analyzing, startAnalyze] = useTransition();
  const [creating, startCreate] = useTransition();
  const keyCounter = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const nextKey = () => `rolle-${++keyCounter.current}`;

  function analyze() {
    startAnalyze(async () => {
      const res = await analyzeBriefing(raw);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { roles: aRoles, ...rest } = res.briefing;
      setDetails(rest);
      setRoles(
        aRoles.map((r) => ({
          key: nextKey(), title: r.title, category: r.category, budget: r.budget, reason: r.reason, suggestions: r.suggestions,
          selected: r.suggestions[0] ? [r.suggestions[0].userId] : [],
        })),
      );
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  }

  const total = details?.budget ?? 0;
  const sum = roles.reduce((a, r) => a + r.budget, 0);
  const balanced = sum === total;
  const feeAmount = Math.round((sum * (mode === "managed" ? fees.managedMarginPct : fees.serviceFeePct)) / 100);
  const kskAmount = Math.round((sum * fees.kskRatePct) / 100);
  const selectedCount = roles.reduce((a, r) => a + r.selected.length, 0);

  const updateRole = (key: string, patch: Partial<EditRole>) => setRoles((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function loadSuggestions(key: string, category: string, budget: number) {
    if (!details) return;
    updateRole(key, { loading: true });
    try {
      const s = await suggestForRole(category, budget, details.location);
      updateRole(key, { suggestions: s, selected: s[0] ? [s[0].userId] : [], loading: false });
    } catch {
      updateRole(key, { loading: false });
      toast.error("Vorschläge konnten nicht geladen werden.");
    }
  }

  function addRole() {
    const key = nextKey();
    const budget = Math.max(0, total - sum);
    const category = "fotografie";
    setRoles((rs) => [...rs, { key, title: categoryName(category), category, budget, reason: "Von dir hinzugefügt.", suggestions: [], selected: [] }]);
    void loadSuggestions(key, category, budget);
  }

  function distributeEvenly() {
    if (!roles.length) return;
    const base = Math.floor(total / roles.length / 10) * 10;
    setRoles((rs) => rs.map((r, i) => ({ ...r, budget: i === 0 ? total - base * (rs.length - 1) : base })));
  }

  function setTotal(value: number) {
    if (!details) return;
    const v = Math.max(0, Math.round(value || 0));
    setRoles((rs) => rescale(rs, details.budget, v));
    setDetails({ ...details, budget: v });
  }

  function create() {
    if (!details) return;
    startCreate(async () => {
      const res = await createProjectFromBriefing({
        rawText: raw, ...details, mode,
        roles: roles.map((r) => ({ title: r.title, category: r.category, budget: r.budget, selectedUserIds: r.selected })),
      });
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Eingabe */}
      <section aria-labelledby="eingabe" className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 id="eingabe" className="text-lg font-semibold">Was planst du?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Schreib frei oder sprich eine Nachricht ein – Ziel, Ort, Zeitraum, Stil und Budget reichen.</p>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="briefing-text">Dein Briefing</Label>
          <Textarea
            id="briefing-text" value={raw} onChange={(e) => setRaw(e.target.value)} rows={5}
            placeholder="z. B. Musikvideo für meine Single im März in Leipzig, düster und analog, Budget 6.000 €"
            data-testid="briefing-text"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VoiceRecorder transcript={transcript} onTranscript={setRaw} />
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Demo-Briefings</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {demos.map((d) => (
              <Button key={d.label} type="button" variant="secondary" size="sm" onClick={() => setRaw(d.text)} className="h-auto py-1.5 whitespace-normal text-left">
                {d.label}
              </Button>
            ))}
          </div>
        </div>
        <Button type="button" className="mt-5 w-full sm:w-auto" size="lg" onClick={analyze} disabled={analyzing || raw.trim().length < 15} data-testid="briefing-submit">
          {analyzing ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
          {analyzing ? "Briefing wird strukturiert …" : "Briefing strukturieren"}
        </Button>
      </section>

      {details && (
        <div ref={resultRef} className="flex scroll-mt-20 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <AiNotice />
            <p className="text-xs text-muted-foreground">
              Quelle:{" "}
              <Badge variant="outline" className="ml-1" data-testid="briefing-source">
                <Sparkles aria-hidden /> {details.source === "claude" ? "Claude (Anthropic API)" : "Regelbasierter Demo-Assistent (Mock)"}
              </Badge>
            </p>
          </div>

          {/* Strukturiertes Briefing */}
          <section aria-labelledby="struktur" className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 id="struktur" className="text-lg font-semibold">Strukturiertes Briefing</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="b-title">Projekttitel</Label>
                <Input id="b-title" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="b-goal">Ziel</Label>
                <Textarea id="b-goal" rows={2} value={details.goal} onChange={(e) => setDetails({ ...details, goal: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-format">Format</Label>
                <Input id="b-format" value={details.format} onChange={(e) => setDetails({ ...details, format: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-style">Stil</Label>
                <Input id="b-style" value={details.style} onChange={(e) => setDetails({ ...details, style: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-location">Ort</Label>
                <Input id="b-location" value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-dates">Termine (Freitext)</Label>
                <Input id="b-dates" value={details.dates} onChange={(e) => setDetails({ ...details, dates: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-start">Projektstart</Label>
                <Input id="b-start" type="date" value={details.startDate} onChange={(e) => setDetails({ ...details, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-end">Projektende</Label>
                <Input id="b-end" type="date" value={details.endDate} min={details.startDate} onChange={(e) => setDetails({ ...details, endDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-budget">Gesamtbudget (€, netto)</Label>
                <Input id="b-budget" type="number" inputMode="numeric" min={0} step={100} value={details.budget} onChange={(e) => setTotal(Number(e.target.value))} />
              </div>
            </div>
          </section>

          {/* Rollen & Budget */}
          <section aria-labelledby="rollen" className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="rollen" className="text-lg font-semibold">Rollen, Budget & Crew-Vorschläge</h2>
              <Button type="button" variant="outline" size="sm" onClick={distributeEvenly}>
                <Scale aria-hidden /> Gleichmäßig verteilen
              </Button>
            </div>
            <div
              role="status"
              data-testid="budget-sum"
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-sm font-medium",
                balanced ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive",
              )}
            >
              Summe der Rollen: {formatEur(sum)} von {formatEur(total)}
              {balanced ? " – passt genau." : sum > total ? ` – ${formatEur(sum - total)} zu viel verteilt.` : ` – noch ${formatEur(total - sum)} offen.`}
            </div>

            <ul className="mt-4 flex flex-col gap-4">
              {roles.map((r, i) => {
                const pct = total > 0 ? Math.round((r.budget / total) * 1000) / 10 : 0;
                return (
                  <li key={r.key} className="rounded-lg border p-3 sm:p-4" data-testid="briefing-role">
                    <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px_90px_auto] sm:items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${r.key}-title`}>Rolle {i + 1}</Label>
                        <Input id={`${r.key}-title`} value={r.title} onChange={(e) => updateRole(r.key, { title: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${r.key}-cat`}>Bereich</Label>
                        <select
                          id={`${r.key}-cat`} className={selectClass} value={r.category}
                          onChange={(e) => {
                            updateRole(r.key, { category: e.target.value });
                            void loadSuggestions(r.key, e.target.value, r.budget);
                          }}
                        >
                          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:contents">
                        <div className="space-y-1.5">
                          <Label htmlFor={`${r.key}-eur`}>Budget €</Label>
                          <Input id={`${r.key}-eur`} type="number" inputMode="numeric" min={0} step={10} value={r.budget} onChange={(e) => updateRole(r.key, { budget: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`${r.key}-pct`}>Anteil %</Label>
                          <Input id={`${r.key}-pct`} type="number" inputMode="decimal" min={0} max={100} step={1} value={pct} onChange={(e) => updateRole(r.key, { budget: Math.round((total * (Number(e.target.value) || 0)) / 100) })} />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={`Vorschläge für ${r.title} aktualisieren`} onClick={() => loadSuggestions(r.key, r.category, r.budget)}>
                          <RefreshCw aria-hidden />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Rolle ${r.title} entfernen`} onClick={() => setRoles((rs) => rs.filter((x) => x.key !== r.key))} disabled={roles.length <= 1}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </div>
                    {r.reason && <p className="mt-2 text-xs text-muted-foreground">{r.reason}</p>}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Crew-Vorschläge {r.selected.length > 0 && <span className="text-primary">· {r.selected.length} ausgewählt (parallel anfragen möglich)</span>}
                      </p>
                      {r.loading ? (
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Vorschläge werden geladen …</p>
                      ) : r.suggestions.length ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          {r.suggestions.map((s) => (
                            <SuggestionCard
                              key={s.userId}
                              s={s}
                              selected={r.selected.includes(s.userId)}
                              onToggle={() => updateRole(r.key, { selected: r.selected.includes(s.userId) ? r.selected.filter((x) => x !== s.userId) : [...r.selected, s.userId] })}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Keine passenden Mitglieder gefunden – du kannst die Rolle später im Crew-Builder besetzen.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button type="button" variant="outline" className="mt-4" onClick={addRole}>
              <Plus aria-hidden /> Rolle hinzufügen
            </Button>
          </section>

          {/* Weg zur Crew & Kosten */}
          <section aria-labelledby="weg" className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 id="weg" className="text-lg font-semibold">Wie willst du deine Crew zusammenstellen?</h2>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "self" | "managed")} className="mt-4 gap-3 sm:grid-cols-2" aria-label="Weg zur Crew">
              <Label htmlFor="mode-self" className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal", mode === "self" && "border-primary bg-primary/5")}>
                <RadioGroupItem value="self" id="mode-self" className="mt-0.5" data-testid="mode-self" />
                <span>
                  <span className="block font-semibold">Self-Service</span>
                  <span className="block text-sm text-muted-foreground">Du fragst die ausgewählten Personen direkt an. {fees.serviceFeePct} % Servicegebühr, 0 % Provision für Kreative.</span>
                </span>
              </Label>
              <Label htmlFor="mode-managed" className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal", mode === "managed" && "border-primary bg-primary/5")}>
                <RadioGroupItem value="managed" id="mode-managed" className="mt-0.5" data-testid="mode-managed" />
                <span>
                  <span className="block font-semibold">Managed Crew anfragen</span>
                  <span className="block text-sm text-muted-foreground">Nesto stellt das Team zusammen – {fees.managedMarginPct} % Marge statt {fees.serviceFeePct} % Servicegebühr.</span>
                </span>
              </Label>
            </RadioGroup>

            <dl className="mt-5 grid gap-2 rounded-lg bg-muted/50 p-4 text-sm" aria-label="Kosten-Vorschau">
              <div className="flex justify-between gap-4"><dt>Honorare Crew</dt><dd className="font-medium tabular-nums">{formatEur(sum)}</dd></div>
              <div className="flex justify-between gap-4">
                <dt>{mode === "managed" ? `Managed-Crew-Marge ${fees.managedMarginPct} %` : `Servicegebühr ${fees.serviceFeePct} %`}</dt>
                <dd className="font-medium tabular-nums">{formatEur(feeAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2 text-base"><dt className="font-semibold">Gesamt (netto)</dt><dd className="font-semibold tabular-nums">{formatEur(sum + feeAmount)}</dd></div>
              <p className="text-xs text-muted-foreground">
                Hinweis: Für Honorare an selbstständige Künstler:innen kann zusätzlich Künstlersozialabgabe von {String(fees.kskRatePct).replace(".", ",")} % anfallen (hier ca. {formatEur(kskAmount)}; Bagatellgrenze {formatEur(fees.kskThresholdEur)}/Jahr). Kein Rechtsrat. Zahlungen werden erst reserviert, wenn die Crew steht, und nach deiner Abnahme ausgezahlt.
              </p>
            </dl>

            {!balanced && <p className="mt-3 text-sm text-destructive" role="alert">Bitte verteile das Budget so, dass die Rollen genau {formatEur(total)} ergeben.</p>}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" size="lg" onClick={create} disabled={creating || !balanced || !details.title.trim() || !roles.length} data-testid="create-project">
                {creating ? <Loader2 className="animate-spin" aria-hidden /> : <Users aria-hidden />}
                {creating ? "Projekt wird angelegt …" : "Projekt anlegen"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {mode === "managed"
                  ? "Nesto bekommt deine Anfrage und meldet sich mit einem Crew-Angebot."
                  : selectedCount
                    ? `${selectedCount} Anfrage(n) gehen parallel raus – wer zuerst zusagt, ist dabei.`
                    : "Ohne Auswahl legst du die Rollen an und fragst später im Crew-Builder an."}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
