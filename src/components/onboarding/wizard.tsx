"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Briefcase, Check, Info, MapPin, Palette, Plus, Receipt, ShieldCheck, Upload, X,
} from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { StockImage } from "@/components/stock-image";
import { ProfileCard } from "@/components/profile-card";
import { CATEGORY_ICONS } from "@/components/public/landing-bits";

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  musikproduktion: ["Beats", "Songwriting", "Recording", "Mixing", "Mastering", "Ableton", "Pro Tools", "Vocal-Editing", "Sounddesign", "Film-Scoring"],
  tonstudio: ["Studio-Engineering", "Vocal-Recording", "Live-Recording", "Podcast-Aufnahme", "Dolby Atmos", "Analog-Outboard"],
  videografie: ["Regie", "Kamera", "Drohne", "Schnitt", "Color Grading", "DaVinci Resolve", "Gimbal", "Musikvideos", "Reels"],
  fotografie: ["Portrait", "Fashion", "Produkt", "Event", "Analog", "Studio-Licht", "Retusche", "Albumcover"],
  booking: ["Location-Scouting", "Event-Planung", "Künstlerkartei", "Tourplanung", "Genehmigungen", "Catering-Koordination"],
  schauspiel: ["Musikvideo", "Werbung", "Kurzfilm", "Improvisation", "Tanz", "Moderation", "Synchron"],
  grafikdesign: ["Albumcover", "Branding", "Merch", "Typografie", "Motion Design", "Illustration", "Social-Templates"],
};

// Server-Actions sind auf 1 MB begrenzt: größere Bilder zeigen wir in der Demo nur als Vorschau
const UPLOAD_BUDGET = 900 * 1024;

type StepKey = "rollen" | "bereiche" | "region" | "tagessatz" | "portfolio" | "steuer" | "ksk" | "fertig";
const STEPS: { key: StepKey; label: string; creativeOnly?: boolean }[] = [
  { key: "rollen", label: "Rolle" },
  { key: "bereiche", label: "Bereiche & Skills", creativeOnly: true },
  { key: "region", label: "Region", creativeOnly: true },
  { key: "tagessatz", label: "Tagessatz", creativeOnly: true },
  { key: "portfolio", label: "Portfolio", creativeOnly: true },
  { key: "steuer", label: "Steuer" },
  { key: "ksk", label: "KSK" },
  { key: "fertig", label: "Fertig" },
];

export type WizardInitial = {
  userId: string;
  name: string;
  firstName: string;
  alreadyOnboarded: boolean;
  roles: { creative: boolean; client: boolean };
  categories: string[];
  skills: string[];
  headline: string;
  bio: string;
  city: string;
  travelRadiusKm: number;
  dayRateMin: number;
  dayRateMax: number;
  portfolioSeeds: string[];
  portfolioLocked: boolean;
  taxIdProvided: boolean;
  kskMember: boolean;
  profileMeta: {
    slug: string; avatarSeed: string; coverSeed: string; verified: boolean; ratingAvg: number; ratingCount: number; isPro: boolean; availability: string;
  } | null;
};

type Upload = { id: string; file: File; url: string; stored: boolean };

export function OnboardingWizard({ initial }: { initial: WizardInitial }) {
  const [roles, setRoles] = useState(initial.roles);
  const [categories, setCategories] = useState(initial.categories);
  const [skills, setSkills] = useState(initial.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [city, setCity] = useState(initial.city);
  const [radius, setRadius] = useState(initial.travelRadiusKm);
  const [rate, setRate] = useState<[number, number]>([initial.dayRateMin, initial.dayRateMax]);
  const [seeds, setSeeds] = useState(initial.portfolioSeeds);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [taxId, setTaxId] = useState(initial.taxIdProvided);
  const [ksk, setKsk] = useState(initial.kskMember);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [stepKey, setStepKey] = useState<StepKey>("rollen");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => STEPS.filter((s) => roles.creative || !s.creativeOnly), [roles.creative]);
  const index = Math.max(0, steps.findIndex((s) => s.key === stepKey));
  const step = steps[index];
  const progress = Math.round((index / (steps.length - 1)) * 100);

  // Objekt-URLs der Upload-Vorschauen beim Verlassen freigeben
  const uploadsRef = useRef(uploads);
  useEffect(() => { uploadsRef.current = uploads; }, [uploads]);
  useEffect(() => () => uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.url)), []);

  function goTo(key: StepKey) {
    setError(null);
    setStepKey(key);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function validate(): string | null {
    if (step.key === "rollen" && !roles.creative && !roles.client) return "Bitte wähle mindestens eine Rolle.";
    if (step.key === "bereiche" && categories.length === 0) return "Bitte wähle mindestens einen Bereich.";
    if (step.key === "tagessatz" && rate[0] > rate[1]) return "Der Mindestsatz darf nicht über dem Höchstsatz liegen.";
    return null;
  }

  function next() {
    const problem = validate();
    if (problem) return setError(problem);
    if (step.key === "ksk") return save();
    const following = steps[index + 1];
    if (following) goTo(following.key);
  }

  function back() {
    const prev = steps[index - 1];
    if (prev) goTo(prev.key);
  }

  function save() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("data", JSON.stringify({
        roles, categories, skills, headline, bio, city, travelRadiusKm: radius, dayRateMin: rate[0], dayRateMax: rate[1],
        portfolioSeeds: initial.portfolioLocked ? [] : seeds, taxIdProvided: taxId, kskMember: ksk,
      }));
      if (roles.creative) uploads.filter((u) => u.stored).forEach((u) => fd.append("files", u.file));
      try {
        const res = await completeOnboarding(fd);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setSavedSlug(res.slug);
        toast.success("Profil gespeichert");
        goTo("fertig");
      } catch {
        setError("Speichern hat nicht geklappt. Bitte versuch es noch einmal.");
      }
    });
  }

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function addSkill(value: string) {
    const s = value.trim();
    if (!s || skills.some((k) => k.toLowerCase() === s.toLowerCase())) return;
    setSkills([...skills, s].slice(0, 20));
    setSkillDraft("");
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    let budget = UPLOAD_BUDGET - uploads.filter((u) => u.stored).reduce((sum, u) => sum + u.file.size, 0);
    const added: Upload[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      if (!file.type.startsWith("image/")) continue;
      const stored = file.size <= budget;
      if (stored) budget -= file.size;
      added.push({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file), stored });
    }
    if (added.some((a) => !a.stored)) toast.info("Demo: Große Bilder werden nur als Vorschau gezeigt und nicht gespeichert.");
    setUploads((u) => [...u, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeUpload(id: string) {
    setUploads((list) => {
      const hit = list.find((u) => u.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return list.filter((u) => u.id !== id);
    });
  }

  const cityData = CITIES.find((c) => c.name === city) ?? CITIES[0];
  const suggestions = Array.from(new Set(categories.flatMap((c) => SKILL_SUGGESTIONS[c] ?? []))).filter((s) => !skills.includes(s));
  const slug = savedSlug ?? initial.profileMeta?.slug ?? "vorschau";
  const meta = initial.profileMeta;
  const preview = {
    slug,
    headline: headline.trim() || `${CATEGORIES.find((c) => c.slug === categories[0])?.name ?? "Kreativ"} in ${cityData.name}`,
    city: cityData.name,
    categories: JSON.stringify(categories),
    dayRateMin: rate[0],
    dayRateMax: rate[1],
    availability: meta?.availability ?? "verfuegbar",
    verified: meta?.verified ?? false,
    ratingAvg: meta?.ratingAvg ?? 0,
    ratingCount: meta?.ratingCount ?? 0,
    avatarSeed: meta?.avatarSeed ?? `cc-${slug}`,
    coverSeed: meta?.coverSeed ?? `cc-cover-${slug}`,
    isPro: meta?.isPro ?? false,
    user: { id: initial.userId, name: initial.name },
  };

  const isLastInput = step.key === "ksk";

  return (
    <div>
      {/* Fortschritt */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Schritt {index + 1} von {steps.length}</span>
          <span className="font-medium text-foreground">{step.label}</span>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" aria-label="Fortschritt" />
        <ol className="mt-3 hidden gap-1 sm:flex" aria-label="Schritte">
          {steps.map((s, i) => (
            <li key={s.key} className={cn("flex-1 truncate text-center text-[11px]", i === index ? "font-semibold text-foreground" : i < index ? "text-primary" : "text-muted-foreground")}>
              {s.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
        {/* ---------- Rolle(n) ---------- */}
        {step.key === "rollen" && (
          <StepBody headingRef={headingRef} title={initial.alreadyOnboarded ? `Profil bearbeiten, ${initial.firstName}` : `Willkommen, ${initial.firstName}!`} text="Wie möchtest du Creative Connect nutzen? Du kannst beides wählen – viele Mitglieder buchen sich auch gegenseitig.">
            {initial.alreadyOnboarded && (
              <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Du bist schon eingerichtet. Demo: Du kannst den Ablauf trotzdem durchklicken – deine Angaben sind vorausgefüllt.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceTile
                checked={roles.creative}
                onToggle={() => setRoles({ ...roles, creative: !roles.creative })}
                icon={Palette}
                title="Kreative:r"
                text="Ich biete meine Arbeit an – Musik, Studio, Video, Foto, Booking, Schauspiel oder Design."
              />
              <ChoiceTile
                checked={roles.client}
                onToggle={() => setRoles({ ...roles, client: !roles.client })}
                icon={Briefcase}
                title="Auftraggeber:in"
                text="Ich stelle Crews für Projekte zusammen – für mich, mein Label, meine Marke oder Agentur."
              />
            </div>
          </StepBody>
        )}

        {/* ---------- Bereiche & Skills ---------- */}
        {step.key === "bereiche" && (
          <StepBody headingRef={headingRef} title="Bereiche & Skills" text="In welchen Bereichen arbeitest du? Wähle einen oder mehrere.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.icon];
                const on = categories.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategories(toggle(categories, c.slug))}
                    className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors", on ? "border-primary bg-primary/10" : "hover:border-primary/40")}
                  >
                    <Icon className={cn("size-4 shrink-0", on ? "text-primary" : "text-muted-foreground")} aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium">Deine Skills</p>
              {skills.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => setSkills(skills.filter((k) => k !== s))} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground" aria-label={`${s} entfernen`}>
                        {s} <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Noch keine Skills – tippe unten auf Vorschläge oder füge eigene hinzu.</p>
              )}
              {suggestions.length > 0 && (
                <>
                  <p className="mt-4 text-xs text-muted-foreground">Vorschläge</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button type="button" onClick={() => addSkill(s)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:border-primary/50 hover:text-foreground">
                          <Plus className="size-3" aria-hidden /> {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-4 flex gap-2">
                <Label htmlFor="skill-draft" className="sr-only">Eigenen Skill hinzufügen</Label>
                <Input
                  id="skill-draft"
                  value={skillDraft}
                  placeholder="Eigener Skill, z. B. Super-8"
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillDraft); } }}
                />
                <Button type="button" variant="outline" onClick={() => addSkill(skillDraft)} className="h-8">Hinzufügen</Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="headline">Kurzbeschreibung</Label>
                <Input id="headline" value={headline} maxLength={80} placeholder="z. B. Regie & Kamera für Musikvideos" onChange={(e) => setHeadline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Über dich (optional)</Label>
                <Textarea id="bio" value={bio} rows={4} maxLength={1200} placeholder="Woran arbeitest du am liebsten? Was bringst du mit?" onChange={(e) => setBio(e.target.value)} />
              </div>
            </div>
          </StepBody>
        )}

        {/* ---------- Region ---------- */}
        {step.key === "region" && (
          <StepBody headingRef={headingRef} title="Stadt & Reisebereitschaft" text="Wo bist du zu Hause, und wie weit fährst du für ein Projekt? Das nutzen wir für die Umkreissuche.">
            <fieldset>
              <legend className="text-sm font-medium">Stadt</legend>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Stadt">
                {CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={city === c.name}
                    onClick={() => setCity(c.name)}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", city === c.name ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <Label id="radius-label">Reisebereitschaft</Label>
                <span className="text-sm font-semibold">{radius === 0 ? "nur vor Ort" : radius >= 1000 ? "deutschlandweit" : `bis ${radius} km`}</span>
              </div>
              <Slider className="mt-4" value={[radius]} min={0} max={1000} step={25} onValueChange={(v) => setRadius(v[0] ?? 0)} aria-labelledby="radius-label" />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>0 km</span><span>500 km</span><span>deutschlandweit</span></div>
            </div>
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden /> {cityData.name}, {cityData.state}
            </p>
          </StepBody>
        )}

        {/* ---------- Tagessatz ---------- */}
        {step.key === "tagessatz" && (
          <StepBody headingRef={headingRef} title="Dein Tagessatz-Rahmen" text="Du legst deine Preise selbst fest. Der Rahmen hilft Auftraggeber:innen bei der Budgetplanung – das konkrete Angebot machst du pro Anfrage.">
            <p className="text-center font-heading text-4xl font-bold sm:text-5xl">{formatEur(rate[0])} – {formatEur(rate[1])}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">pro Tag, netto</p>
            <Slider className="mt-8" value={rate} min={100} max={2500} step={10} minStepsBetweenThumbs={1} onValueChange={(v) => setRate([v[0] ?? 100, v[1] ?? 2500])} aria-label="Tagessatz-Rahmen" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rate-min">Mindestens (€)</Label>
                <Input id="rate-min" type="number" inputMode="numeric" min={50} max={5000} step={10} value={rate[0]} onChange={(e) => setRate([Number(e.target.value) || 0, rate[1]])} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-max">Höchstens (€)</Label>
                <Input id="rate-max" type="number" inputMode="numeric" min={50} max={5000} step={10} value={rate[1]} onChange={(e) => setRate([rate[0], Number(e.target.value) || 0])} />
              </div>
            </div>
            <p className="mt-6 flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Du zahlst 0 % Provision. Die Servicegebühr tragen die Auftraggeber:innen – dein Honorar kommt vollständig bei dir an.
            </p>
          </StepBody>
        )}

        {/* ---------- Portfolio ---------- */}
        {step.key === "portfolio" && (
          <StepBody headingRef={headingRef} title="Portfolio" text={initial.portfolioLocked ? "Das sind deine aktuellen Arbeiten. Neue Bilder kannst du hier ergänzen." : "Wir haben dir sechs Beispielbilder vorausgefüllt (Demo). Entferne, was nicht passt, und lade eigene Arbeiten hoch."}>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {seeds.map((seed, i) => (
                <li key={seed} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                  <StockImage seed={seed} w={400} h={400} alt={`Portfolio-Bild ${i + 1}`} sizes="(max-width: 640px) 50vw, 240px" />
                  {!initial.portfolioLocked && (
                    <button type="button" onClick={() => setSeeds(seeds.filter((s) => s !== seed))} aria-label={`Portfolio-Bild ${i + 1} entfernen`} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80">
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
              {uploads.map((u) => (
                <li key={u.id} className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
                  <Image src={u.url} alt={u.file.name} fill unoptimized className="object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">{u.stored ? "Neu" : "Nur Vorschau"}</span>
                  <button type="button" onClick={() => removeUpload(u.id)} aria-label={`${u.file.name} entfernen`} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80">
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
              <li className="aspect-square">
                <label htmlFor="portfolio-upload" className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-within:outline-2 focus-within:outline-ring">
                  <Upload className="size-5" aria-hidden />
                  Bilder hochladen
                  <input ref={fileRef} id="portfolio-upload" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
                </label>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">JPG, PNG oder WebP. KI-generierte Arbeiten kennzeichnest du später im Profil (EU AI Act Art. 50).</p>
          </StepBody>
        )}

        {/* ---------- Steuer ---------- */}
        {step.key === "steuer" && (
          <StepBody headingRef={headingRef} title="Steuerangaben" text="Plattformen müssen Umsätze von Anbieter:innen einmal im Jahr ans Bundeszentralamt für Steuern melden (DAC7 / Plattformen-Steuertransparenzgesetz).">
            <div className="flex gap-3 rounded-2xl border bg-muted/40 p-4">
              <Receipt className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Für die Meldung brauchen wir später deine Steuer-ID bzw. Steuernummer. Die Nummer hinterlegst du direkt beim Zahlungsdienstleister – wir speichern nur, <strong className="text-foreground">ob</strong> sie vorliegt.</p>
                <p>In dieser Demo werden keine echten Steuerdaten abgefragt.</p>
              </div>
            </div>
            <CheckRow id="tax-id" checked={taxId} onChange={setTaxId} label="Steuer-ID ist hinterlegt" hint="Kannst du jederzeit später im Profil nachholen." />
          </StepBody>
        )}

        {/* ---------- KSK ---------- */}
        {step.key === "ksk" && (
          <StepBody headingRef={headingRef} title="Künstlersozialkasse" text="Die KSK sichert selbstständige Künstler:innen und Publizist:innen in der Renten-, Kranken- und Pflegeversicherung ab.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
                <p className="font-medium">Für Kreative</p>
                <p className="mt-1 text-muted-foreground">Wenn du überwiegend künstlerisch oder publizistisch selbstständig arbeitest, kannst du über die KSK versichert sein – du zahlst dann etwa die Hälfte der Beiträge.</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
                <p className="font-medium">Für Auftraggeber:innen</p>
                <p className="mt-1 text-muted-foreground">Wer regelmäßig Kreative beauftragt, zahlt ggf. Künstlersozialabgabe (2026: 4,9 % auf Honorare). Wir liefern eine Jahresübersicht als Export.</p>
              </div>
            </div>
            {roles.creative && <CheckRow id="ksk" checked={ksk} onChange={setKsk} label="Ich bin über die KSK versichert" hint="Freiwillige Angabe – nur für deine Übersicht." />}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Allgemeine Information, keine Rechts- oder Steuerberatung.</p>
          </StepBody>
        )}

        {/* ---------- Fertig ---------- */}
        {step.key === "fertig" && (
          <StepBody headingRef={headingRef} title="Fertig – willkommen im Netzwerk!" text={roles.creative ? "So sehen andere Mitglieder dein Profil. Alles lässt sich später im Profil anpassen." : "Dein Konto ist eingerichtet. Starte mit deinem ersten Briefing oder schau dich im Dashboard um."}>
            {roles.creative ? (
              <div className="mx-auto max-w-sm"><ProfileCard profile={preview} /></div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4 text-sm">
                <Briefcase className="size-5 text-primary" aria-hidden /> Als Auftraggeber:in kannst du jetzt Crews zusammenstellen und buchen.
              </div>
            )}
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-11 rounded-full px-6"><Link href="/dashboard">Zum Dashboard <ArrowRight className="size-4" aria-hidden /></Link></Button>
              {roles.client && <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6"><Link href="/briefing">Erstes Briefing starten</Link></Button>}
            </div>
          </StepBody>
        )}

        {error && <p role="alert" className="mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        {step.key !== "fertig" && (
          <div className="mt-8 flex items-center justify-between gap-2 border-t pt-6">
            <Button type="button" variant="ghost" onClick={back} disabled={index === 0 || pending} className="h-10">
              <ArrowLeft className="size-4" aria-hidden /> Zurück
            </Button>
            <Button type="button" onClick={next} disabled={pending} className="h-10 rounded-full px-5">
              {isLastInput ? (pending ? "Wird gespeichert …" : "Abschließen") : "Weiter"}
              {!pending && <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBody({ title, text, headingRef, children }: { title: string; text: string; headingRef: React.Ref<HTMLHeadingElement>; children: React.ReactNode }) {
  return (
    <section aria-labelledby="step-title">
      <h1 id="step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none sm:text-3xl">{title}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground sm:text-base">{text}</p>
      {children}
    </section>
  );
}

function ChoiceTile({ checked, onToggle, icon: Icon, title, text }: { checked: boolean; onToggle: () => void; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn("relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-colors", checked ? "border-primary bg-primary/10" : "hover:border-primary/40")}
    >
      <span className={cn("grid size-10 place-items-center rounded-xl", checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-5" />
      </span>
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{text}</span>
      <span className={cn("absolute top-4 right-4 grid size-5 place-items-center rounded-full border", checked && "border-primary bg-primary text-primary-foreground")} aria-hidden>
        {checked && <Check className="size-3" />}
      </span>
    </button>
  );
}

function CheckRow({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border p-4">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <div>
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
