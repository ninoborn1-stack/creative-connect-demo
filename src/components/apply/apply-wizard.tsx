"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, CircleAlert, CircleCheck, FileText, Gamepad2, Info, Loader2, Plus, RefreshCw,
  Search, Send, Sparkles, Ticket, Upload, UserRoundPlus, Users, Wand2, X,
} from "lucide-react";
import { CATEGORIES, CITIES, INDUSTRIES } from "@/lib/constants";
import { ANALYSIS_STEPS, LINK_FIELDS, checkLink, type ApplicationCheck, type ApplicationLinks, type ExtractedProfile, type LinkKey } from "@/lib/application-meta";
import {
  analyzeApplication, checkReferralCode, rescoreApplication, searchReferrer, submitApplication,
  type ApplicationDraft, type ReferrerHit,
} from "@/app/actions/applications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { ScoreRing } from "./score-ring";
import { ChecksList } from "./checks-list";

type Track = "standard" | "netzwerk";
type Analysis = { extracted: ExtractedProfile; score: number; checks: ApplicationCheck[]; summary: string };

const STEPS = ["Wie kommst du zu uns?", "Zeig uns deine Arbeit", "Auto-Analyse"];

const SAMPLE_PITCH =
  "Ich bin Sounddesignerin und Komponistin aus Hamburg und arbeite seit 7 Jahren freiberuflich. " +
  "Zuletzt habe ich den Soundtrack für das Indie-Game „Ashen Tides“ (2025) komponiert und mit Wwise implementiert. " +
  "Für Nordlicht Games habe ich Sounddesign und Foley für den Launch-Trailer produziert (2026). " +
  "Außerdem Mixing und Mastering für die EP „Salzwasser“ (2024) und eine Kampagne für Hanse Energie (Sound-Branding, 2025).";

function chip(active: boolean) {
  return cn(
    "meta inline-flex min-h-9 items-center gap-1.5 border px-3 py-1.5 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
    active ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
  );
}

export function ApplyWizard({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Schritt 1 – Weg ins Netzwerk
  const [track, setTrack] = useState<Track | null>(initialCode ? "netzwerk" : null);
  const [netMode, setNetMode] = useState<"code" | "member">("code");
  const [code, setCode] = useState(initialCode ?? "");
  const [codeOk, setCodeOk] = useState<{ code: string; referrer: ReferrerHit | null } | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ReferrerHit[]>([]);
  const [referrer, setReferrer] = useState<ReferrerHit | null>(null);
  const [netError, setNetError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();

  // Schritt 2 – Angaben
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [links, setLinks] = useState<ApplicationLinks>({});
  const [pitch, setPitch] = useState("");
  const [cvText, setCvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Schritt 3 – Analyse
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dirty, setDirty] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [rescoring, startRescore] = useTransition();
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Code aus dem Link (?code=…) direkt prüfen
  useEffect(() => {
    if (initialCode) verifyCode(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const networkReady = track === "netzwerk" && (netMode === "code" ? !!codeOk : !!referrer);
  const canContinue1 = track === "standard" || networkReady;

  function verifyCode(value = code) {
    setNetError(null);
    setCodeOk(null);
    startCheck(async () => {
      const res = await checkReferralCode(value);
      if (res.ok && res.kind === "code") setCodeOk({ code: res.code, referrer: res.referrer });
      else if (!res.ok) setNetError(res.error);
    });
  }

  function findMember() {
    setNetError(null);
    setMatches([]);
    setReferrer(null);
    startCheck(async () => {
      const res = await searchReferrer(query);
      if (res.ok && res.kind === "member") {
        setMatches(res.matches);
        if (res.matches.length === 1) setReferrer(res.matches[0]);
      } else if (!res.ok) setNetError(res.error);
    });
  }

  function draft(): ApplicationDraft {
    return {
      track: track ?? "standard",
      referralCode: track === "netzwerk" && netMode === "code" ? codeOk?.code ?? null : null,
      referrerId: track === "netzwerk" && netMode === "member" ? referrer?.id ?? null : null,
      name, email, city, categories, links, pitch, cvText, fileName,
    };
  }

  function validateStep2() {
    if (name.trim().length < 2) return "Bitte gib deinen Namen an.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Bitte gib eine gültige E-Mail-Adresse an.";
    if (city.trim().length < 2) return "Bitte gib deine Stadt an.";
    if (!categories.length) return "Bitte wähle mindestens einen Bereich.";
    if (pitch.trim().length < 20) return "Erzähl uns in ein paar Sätzen, woran du gearbeitet hast (mind. 20 Zeichen).";
    return null;
  }

  async function onFile(file: File | undefined) {
    setCvText(null);
    setFileName(null);
    setFileNote(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileNote("Die Datei ist größer als 10 MB.");
      return;
    }
    setFileName(file.name);
    if (/\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith("text/")) {
      const text = await file.text();
      setCvText(text.slice(0, 30000));
      setFileNote(`${text.length.toLocaleString("de-DE")} Zeichen gelesen – fließen in die Auto-Analyse ein.`);
    } else if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
      setFileNote("PDF angenommen. Text aus PDFs liest der echte Betrieb aus – in der Demo zählen Freitext und Links.");
    } else {
      setFileName(null);
      setFileNote("Bitte eine .txt-, .md- oder .pdf-Datei wählen.");
    }
  }

  function startAnalysis() {
    const err = validateStep2();
    setFormError(err);
    if (err) return;
    setStep(2);
    setPhase("running");
    setProgress(0);
    setAnalysis(null);
    setDirty(false);
    const started = Date.now();
    const timer = window.setInterval(() => setProgress((p) => Math.min(p + 1, ANALYSIS_STEPS.length - 1)), 600);
    analyzeApplication(draft())
      .then(async (res) => {
        const rest = 3600 - (Date.now() - started);
        if (rest > 0) await new Promise((r) => setTimeout(r, rest));
        window.clearInterval(timer);
        if (!res.ok) {
          toast.error(res.error);
          setPhase("idle");
          setStep(1);
          setFormError(res.error);
          return;
        }
        setProgress(ANALYSIS_STEPS.length);
        setAnalysis({ extracted: res.extracted, score: res.score, checks: res.checks, summary: res.summary });
        setPhase("done");
      })
      .catch(() => {
        window.clearInterval(timer);
        toast.error("Die Analyse hat nicht geklappt. Bitte erneut versuchen.");
        setPhase("idle");
        setStep(1);
      });
  }

  function edit(fn: (e: ExtractedProfile) => ExtractedProfile) {
    setAnalysis((a) => (a ? { ...a, extracted: fn(a.extracted) } : a));
    setDirty(true);
  }

  function rescore() {
    if (!analysis) return;
    startRescore(async () => {
      const res = await rescoreApplication(draft(), analysis.extracted);
      if (res.ok) {
        setAnalysis({ extracted: res.extracted, score: res.score, checks: res.checks, summary: res.summary });
        setDirty(false);
      } else toast.error(res.error);
    });
  }

  function submit() {
    if (!analysis) return;
    startSubmit(async () => {
      const res = await submitApplication(draft(), analysis.extracted);
      if (res.ok) {
        toast.success("Bewerbung eingereicht – die Bestätigung ist unterwegs.");
        router.push(`/bewerben/status?id=${res.id}`);
      } else toast.error(res.error);
    });
  }

  return (
    <div>
      {/* Fortschritt */}
      <ol className="mb-10 grid grid-cols-3" aria-label="Fortschritt der Bewerbung">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="min-w-0">
            <div className={cn("h-1 transition-colors", i <= step ? "bg-primary" : "bg-border")} />
            <p className={cn("meta mt-3 truncate pr-2", i === step ? "text-foreground" : "text-muted-foreground")}>
              <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span> <span className="hidden min-[420px]:inline">{label}</span>
              <span className="min-[420px]:hidden">{i === step ? label : ""}</span>
            </p>
          </li>
        ))}
      </ol>

      <div>
        <h2 ref={headingRef} tabIndex={-1} className="poster text-[clamp(2.4rem,5vw,5rem)] text-balance outline-none">
          {STEPS[step]}
        </h2>

        {/* ---------------------------------------------------------------- Schritt 1 */}
        {step === 0 && (
          <div className="mt-10 space-y-8">
            <div className="grid gap-px border bg-border sm:grid-cols-2" role="radiogroup" aria-label="Weg ins Netzwerk">
              <TrackCard
                testId="apply-track-network"
                active={track === "netzwerk"}
                onSelect={() => setTrack("netzwerk")}
                icon={Users}
                badge="Fast-Track"
                title="Ich komme über das Netzwerk"
                text="Du wurdest eingeladen oder jemand aus Nestos Netzwerk empfiehlt dich. Priorisierte Prüfung, meist innerhalb von 48 h."
              />
              <TrackCard
                testId="apply-track-standard"
                active={track === "standard"}
                onSelect={() => setTrack("standard")}
                icon={UserRoundPlus}
                title="Ich bewerbe mich selbst"
                text="Zeig uns deine Arbeit – die Auto-Analyse liest dein Profil aus, Nestos Team entscheidet persönlich."
              />
            </div>

            {track === "netzwerk" && (
              <div className="space-y-4 border-l-2 border-primary pl-4 sm:pl-6">
                <div className="inline-flex max-w-full flex-wrap border" role="tablist" aria-label="Art der Empfehlung">
                  {(["code", "member"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={netMode === m}
                      onClick={() => {
                        setNetMode(m);
                        setNetError(null);
                      }}
                      className={cn("meta px-3 py-2.5", netMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {m === "code" ? "Einladungscode" : "Mitglied empfiehlt mich"}
                    </button>
                  ))}
                </div>

                {netMode === "code" ? (
                  <div className="space-y-2">
                    <Label htmlFor="apply-code">Einladungscode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apply-code"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          setCodeOk(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), verifyCode())}
                        placeholder="CC-XXXX-XXXX"
                        className="font-mono uppercase"
                        autoComplete="off"
                      />
                      <Button type="button" variant="secondary" onClick={() => verifyCode()} disabled={checking || code.trim().length < 4}>
                        {checking ? <Loader2 className="animate-spin" aria-hidden /> : <Ticket aria-hidden />} Prüfen
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Demo-Code zum Ausprobieren: <button type="button" className="font-mono text-primary underline-offset-4 hover:underline" onClick={() => { setCode("CC-DEMO-2026"); verifyCode("CC-DEMO-2026"); }}>CC-DEMO-2026</button></p>
                    {codeOk && (
                      <div className="border-l-2 border-emerald-500 bg-emerald-500/10 p-3 text-sm" role="status">
                        <p className="flex items-center gap-2 font-medium"><BadgeCheck className="size-4 text-emerald-500" aria-hidden /> Code gültig{codeOk.referrer ? ` – eingeladen von ${codeOk.referrer.name}` : ""}</p>
                        <p className="mt-1 text-muted-foreground">
                          Du kannst dich hier mit Auto-Analyse bewerben (Profil wird vorbefüllt) – oder den Code direkt einlösen und sofort ein Konto anlegen:{" "}
                          <Link href={`/invite/${encodeURIComponent(codeOk.code)}`} className="text-primary underline-offset-4 hover:underline">/invite/{codeOk.code}</Link>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="apply-referrer">Name oder E-Mail des Mitglieds</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apply-referrer"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), findMember())}
                        placeholder="z. B. Nesto oder name@…"
                        autoComplete="off"
                      />
                      <Button type="button" variant="secondary" onClick={findMember} disabled={checking || query.trim().length < 3}>
                        {checking ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />} Suchen
                      </Button>
                    </div>
                    {matches.length > 0 && (
                      <ul className="grid gap-px" aria-label="Gefundene Mitglieder">
                        {matches.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              aria-pressed={referrer?.id === m.id}
                              onClick={() => setReferrer(m)}
                              className={cn("flex w-full items-center gap-3 border p-2.5 text-left text-sm transition-colors", referrer?.id === m.id ? "border-primary bg-primary/10" : "hover:bg-muted")}
                            >
                              <UserAvatar name={m.name} seed={m.avatarSeed} className="size-9" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{m.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{[m.headline, m.city].filter(Boolean).join(" · ") || "Mitglied"}</span>
                              </span>
                              {referrer?.id === m.id && <Check className="size-4 text-primary" aria-hidden />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground">Wir informieren das Mitglied über deine Bewerbung. Bei Aufnahme bekommt es Punkte fürs Empfehlen.</p>
                  </div>
                )}

                {netError && (
                  <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {netError}
                  </p>
                )}
                {!networkReady && (
                  <button type="button" onClick={() => setTrack("standard")} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    Keine Empfehlung zur Hand? Als Selbstbewerbung fortfahren
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end border-t pt-6">
              <Button size="lg" className="meta h-12 px-6" onClick={() => setStep(1)} disabled={!canContinue1} data-testid="apply-next">
                Weiter <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- Schritt 2 */}
        {step === 1 && (
          <form
            className="mt-10 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              startAnalysis();
            }}
            noValidate
          >
            {track === "netzwerk" && (
              <p className="flex items-center gap-2 border-l-2 border-primary bg-primary/10 px-3 py-2 text-sm">
                <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
                <span>Fast-Track über {codeOk?.referrer?.name ?? referrer?.name ?? `Code ${codeOk?.code}`}</span>
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apply-name">Name</Label>
                <Input id="apply-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-email">E-Mail</Label>
                <Input id="apply-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="apply-city">Stadt</Label>
                <Input id="apply-city" value={city} onChange={(e) => setCity(e.target.value)} list="apply-cities" autoComplete="address-level2" required />
                <datalist id="apply-cities">
                  {CITIES.map((c) => <option key={c.name} value={c.name} />)}
                </datalist>
              </div>
            </div>

            <fieldset>
              <legend className="meta text-muted-foreground">Deine Bereiche <span className="normal-case tracking-normal">(mehrere möglich)</span></legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = categories.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCategories((cs) => (on ? cs.filter((x) => x !== c.slug) : [...cs, c.slug]))}
                      className={chip(on)}
                      title={c.description}
                    >
                      {on && <Check className="size-3.5" aria-hidden />} {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="meta text-muted-foreground">Links zu deiner Arbeit</legend>
              <p className="mt-1 text-xs text-muted-foreground">Je mehr wir sehen, desto genauer die Auto-Analyse. Mindestens zwei Links empfohlen.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {LINK_FIELDS.map((f) => {
                  const v = links[f.key as LinkKey] ?? "";
                  const ok = v ? checkLink(f.key as LinkKey, v) : null;
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={`apply-link-${f.key}`} className="text-xs text-muted-foreground">{f.label}</Label>
                      <div className="relative">
                        <Input
                          id={`apply-link-${f.key}`}
                          value={v}
                          onChange={(e) => setLinks((l) => ({ ...l, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          inputMode="url"
                          autoComplete="off"
                          className="pr-8"
                          aria-invalid={ok === false || undefined}
                          aria-describedby={ok === false ? `apply-link-${f.key}-hint` : undefined}
                        />
                        {ok !== null && (
                          <span className="absolute top-1/2 right-2.5 -translate-y-1/2" aria-hidden>
                            {ok ? <CircleCheck className="size-4 text-emerald-500" /> : <CircleAlert className="size-4 text-amber-500" />}
                          </span>
                        )}
                      </div>
                      {ok === false && <p id={`apply-link-${f.key}-hint`} className="text-xs text-amber-600 dark:text-amber-400">Sieht nicht nach einem {f.label}-Link aus.</p>}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label htmlFor="apply-pitch">Woran hast du gearbeitet?</Label>
                <button type="button" onClick={() => setPitch(SAMPLE_PITCH)} className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">
                  <Wand2 className="size-3.5" aria-hidden /> Beispiel einfügen
                </button>
              </div>
              <Textarea
                id="apply-pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                rows={6}
                placeholder={"Projekte mit Titel, Jahr und Auftraggeber – z. B. „Soundtrack für das Indie-Game „Ashen Tides“ (2025)“ oder „Kampagne für Hanse Energie (2025)“."}
                aria-describedby="apply-pitch-hint"
              />
              <p id="apply-pitch-hint" className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>Tipp: Titel in Anführungszeichen, Jahreszahlen und „für &lt;Firma&gt;“ erkennt die Analyse als Credits.</span>
                <span className="shrink-0 tabular-nums">{pitch.length}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply-file">Lebenslauf oder Portfolio <span className="font-normal text-muted-foreground">(optional · .txt, .md, .pdf)</span></Label>
              <label htmlFor="apply-file" className="flex cursor-pointer items-center gap-3 border border-dashed p-4 text-sm transition-colors hover:bg-muted/60 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
                {fileName ? <FileText className="size-5 shrink-0 text-primary" aria-hidden /> : <Upload className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{fileName ?? "Datei auswählen"}</span>
                  <span className="block text-xs text-muted-foreground">Text wird direkt in deinem Browser gelesen.</span>
                </span>
                <input id="apply-file" type="file" accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              {fileNote && <p className="text-xs text-muted-foreground" role="status">{fileNote}</p>}
            </div>

            {formError && (
              <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" className="meta h-12" onClick={() => setStep(0)}>
                <ArrowLeft aria-hidden /> Zurück
              </Button>
              <Button type="submit" size="lg" className="meta h-12 px-6" data-testid="apply-analyze">
                <Sparkles aria-hidden /> Profil analysieren
              </Button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------------------- Schritt 3 */}
        {step === 2 && (
          <div className="mt-10">
            {phase !== "done" || !analysis ? (
              <AnalysisRunner progress={progress} name={name} />
            ) : (
              <AnalysisResult
                analysis={analysis}
                dirty={dirty}
                rescoring={rescoring}
                onRescore={rescore}
                edit={edit}
                newSkill={newSkill}
                setNewSkill={setNewSkill}
              />
            )}

            {phase === "done" && analysis && (
              <div className="mt-8 flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" className="meta h-12" onClick={() => setStep(1)}>
                  <ArrowLeft aria-hidden /> Angaben ändern
                </Button>
                <Button size="lg" className="meta h-12 px-6" onClick={submit} disabled={submitting} data-testid="apply-submit">
                  {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Bewerbung absenden
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackCard({
  testId, active, onSelect, icon: Icon, title, text, badge,
}: { testId: string; active: boolean; onSelect: () => void; icon: React.ComponentType<{ className?: string }>; title: string; text: string; badge?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      data-testid={testId}
      className={cn(
        "group relative flex flex-col items-start gap-3 p-5 text-left transition-colors focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6",
        active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted/60",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <Icon className={cn("size-5", active ? "text-primary-foreground" : "text-primary")} aria-hidden />
        <span className="flex items-center gap-2">
          {badge && <span className={cn("meta border px-2 py-1", active ? "border-primary-foreground/50" : "border-primary text-primary")}>{badge}</span>}
          <span className={cn("grid size-6 place-items-center border", active ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border")} aria-hidden>
            {active && <Check className="size-3.5" />}
          </span>
        </span>
      </span>
      <span className="poster mt-6 text-[clamp(1.9rem,3vw,2.8rem)]">{title}</span>
      <span className={cn("text-sm", active ? "text-primary-foreground/85" : "text-muted-foreground")}>{text}</span>
    </button>
  );
}

function AnalysisRunner({ progress, name }: { progress: number; name: string }) {
  return (
    <div className="max-w-2xl" aria-live="polite">
      <div className="flex items-end justify-between gap-4 border-b pb-4">
        <p className="text-sm text-muted-foreground">Wir lesen das Profil von {name.split(" ")[0] || "dir"} aus …</p>
        <p className="poster shrink-0 text-5xl text-primary tabular-nums" aria-hidden>
          {String(Math.min(progress + 1, ANALYSIS_STEPS.length)).padStart(2, "0")}<span className="text-muted-foreground">/{String(ANALYSIS_STEPS.length).padStart(2, "0")}</span>
        </p>
      </div>
      <ol>
        {ANALYSIS_STEPS.map((s, i) => {
          const done = i < progress;
          const active = i === progress;
          return (
            <li key={s} className={cn("flex items-center gap-3 border-b px-1 py-3 text-sm transition-all duration-300", active ? "bg-primary/5" : done ? "" : "opacity-50")}>
              <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                {done ? <CircleCheck className="size-5 text-emerald-500" /> : active ? <Loader2 className="size-4 animate-spin text-primary" /> : <span className="size-2 bg-muted-foreground/40" />}
              </span>
              <span className={cn(active && "font-medium")}>{s} {active && "…"}</span>
              <span className="sr-only">{done ? "erledigt" : active ? "läuft" : "wartet"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AnalysisResult({
  analysis, dirty, rescoring, onRescore, edit, newSkill, setNewSkill,
}: {
  analysis: Analysis;
  dirty: boolean;
  rescoring: boolean;
  onRescore: () => void;
  edit: (fn: (e: ExtractedProfile) => ExtractedProfile) => void;
  newSkill: string;
  setNewSkill: (v: string) => void;
}) {
  const { extracted: ex, score, checks, summary } = analysis;
  const gaming = ex.industries.includes("gaming");
  const gamingNeeds = INDUSTRIES.find((i) => i.slug === "gaming")?.needs ?? [];

  function addSkill() {
    const s = newSkill.trim();
    if (!s) return;
    edit((e) => ({ ...e, skills: [...new Set([...e.skills, s])] }));
    setNewSkill("");
  }

  return (
    <div className="space-y-8">
      {/* Score */}
      <div className="flex flex-col gap-5 border-y py-6 sm:flex-row sm:items-center">
        <ScoreRing score={score} size={96} />
        <div className="min-w-0 flex-1">
          <p className="meta text-primary">Vorprüfung</p>
          <p className="poster mt-2 text-[clamp(2rem,4vw,3.4rem)]">{score} von 100 Punkten</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          {dirty && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={onRescore} disabled={rescoring}>
              {rescoring ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} Mit Änderungen neu bewerten
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 border-l-2 border-primary bg-primary/10 px-3 py-2 text-sm" role="note">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          <strong>Automatische Vorprüfung – die Entscheidung trifft Nestos Team.</strong> Die Analyse ist ein Vorschlag{ex.source === "claude" ? " (KI: Claude)" : " (regelbasiert)"} und hilft beim Sortieren. Alles ist bearbeitbar.{" "}
          <Link href="/ki-hinweis" className="text-primary underline-offset-4 hover:underline">Mehr zum KI-Einsatz</Link>
        </p>
      </div>

      {gaming && (
        <div className="bg-primary p-5 text-primary-foreground sm:p-6">
          <p className="meta flex items-center gap-2"><Gamepad2 className="size-4" aria-hidden /> Gaming-Profil erkannt</p>
          <p className="mt-2 text-sm text-primary-foreground/85">Studios suchen über Creative Connect gerade: {gamingNeeds.join(", ")}. Dein Profil wird bei passenden Ausschreibungen hervorgehoben.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <section aria-labelledby="res-skills">
          <h3 id="res-skills" className="meta text-muted-foreground">Erkannte Skills</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ex.skills.map((s) => (
              <li key={s} className="inline-flex items-center gap-1 border py-1 pr-1 pl-3 text-sm">
                {s}
                <button type="button" onClick={() => edit((e) => ({ ...e, skills: e.skills.filter((x) => x !== s) }))} className="grid size-6 place-items-center hover:bg-muted" aria-label={`Skill ${s} entfernen`}>
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
            {!ex.skills.length && <li className="text-sm text-muted-foreground">Noch keine Skills – ergänze welche.</li>}
          </ul>
          <div className="mt-2 flex gap-2">
            <Label htmlFor="res-skill-new" className="sr-only">Skill hinzufügen</Label>
            <Input id="res-skill-new" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Skill ergänzen" className="h-9" />
            <Button type="button" size="sm" variant="outline" className="h-9" onClick={addSkill} aria-label="Skill hinzufügen"><Plus aria-hidden /></Button>
          </div>
        </section>

        {/* Branchen */}
        <section aria-labelledby="res-ind">
          <h3 id="res-ind" className="meta text-muted-foreground">Passende Branchen</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => {
              const on = ex.industries.includes(i.slug);
              const isGaming = i.slug === "gaming";
              return (
                <button
                  key={i.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => edit((e) => ({ ...e, industries: on ? e.industries.filter((x) => x !== i.slug) : [...e.industries, i.slug] }))}
                  className={cn(chip(on), isGaming && on && "bg-[var(--signal)]")}
                >
                  {isGaming ? <Gamepad2 className="size-3.5" aria-hidden /> : on ? <Check className="size-3.5" aria-hidden /> : null} {i.name}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Credits */}
      <section aria-labelledby="res-credits">
        <h3 id="res-credits" className="meta text-muted-foreground">Credits & Referenzen</h3>
        <ul className="mt-2 space-y-2">
          {ex.credits.map((c, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Label htmlFor={`res-credit-${idx}`} className="sr-only">Credit {idx + 1}</Label>
              <Input id={`res-credit-${idx}`} value={c} onChange={(e) => edit((x) => ({ ...x, credits: x.credits.map((y, j) => (j === idx ? e.target.value : y)) }))} className="h-9" />
              <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0" onClick={() => edit((x) => ({ ...x, credits: x.credits.filter((_, j) => j !== idx) }))} aria-label={`Credit ${idx + 1} entfernen`}>
                <X aria-hidden />
              </Button>
            </li>
          ))}
          {!ex.credits.length && <li className="text-sm text-muted-foreground">Keine Credits erkannt. Ergänze Projekte mit Titel und Jahr – das stärkt deine Bewerbung.</li>}
        </ul>
        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => edit((x) => ({ ...x, credits: [...x.credits, ""] }))}>
          <Plus aria-hidden /> Credit hinzufügen
        </Button>
      </section>

      {/* Tagessatz & Erfahrung */}
      <section aria-labelledby="res-rate" className="grid gap-4 sm:grid-cols-3">
        <h3 id="res-rate" className="meta text-muted-foreground sm:col-span-3">Tagessatz-Rahmen & Erfahrung</h3>
        <div className="space-y-1.5">
          <Label htmlFor="res-rate-min" className="text-xs text-muted-foreground">Tagessatz von (€)</Label>
          <Input id="res-rate-min" type="number" min={50} step={10} value={ex.dayRate[0]} onChange={(e) => edit((x) => ({ ...x, dayRate: [Number(e.target.value), x.dayRate[1]] }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="res-rate-max" className="text-xs text-muted-foreground">bis (€)</Label>
          <Input id="res-rate-max" type="number" min={50} step={10} value={ex.dayRate[1]} onChange={(e) => edit((x) => ({ ...x, dayRate: [x.dayRate[0], Number(e.target.value)] }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="res-years" className="text-xs text-muted-foreground">Erfahrung (Jahre)</Label>
          <Input id="res-years" type="number" min={0} max={40} value={ex.experienceYears} onChange={(e) => edit((x) => ({ ...x, experienceYears: Number(e.target.value) }))} />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-3">Vorschlag aus Bereich, Erfahrung und Branchen. Du bestimmst deine Preise selbst – 0 % Provision für Kreative.</p>
      </section>

      {/* Checks */}
      <section aria-labelledby="res-checks">
        <h3 id="res-checks" className="meta text-muted-foreground">Vorprüfung im Detail</h3>
        <ChecksList checks={checks} className="mt-2 rounded-none" />
      </section>
    </div>
  );
}
