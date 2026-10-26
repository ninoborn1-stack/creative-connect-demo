"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createWork, updateWork, type WorkFormState } from "@/app/actions/licensing";
import { INDUSTRIES, LICENSE_TIERS, WORK_TYPES } from "@/lib/constants";
import { isAudioType } from "@/lib/licensing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/venues/native-select";

export type WorkFormValues = {
  id?: string;
  slug?: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  industries: string[];
  durationSec: number | null;
  bpm: number | null;
  musicalKey: string | null;
  priceStandard: number | "";
  priceExtended: number | "";
  priceExclusive: number | "" | null;
  aiMarked: boolean | null; // null = noch nicht angegeben (Pflichtfeld)
  hasUpload?: boolean;
};

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return <p id={id} className="text-xs text-destructive">{msg}</p>;
}

const fmtDur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");

export function WorkForm({ initial }: { initial: WorkFormValues }) {
  const editing = Boolean(initial.id);
  const action = editing ? updateWork.bind(null, initial.id!) : createWork;
  const [state, formAction, pending] = useActionState<WorkFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const v = (k: string, fallback: string) => state?.values?.[k] ?? fallback;
  const err = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  const [type, setType] = useState(v("type", initial.type));
  const audio = isAudioType(type);
  const industriesSel = state?.values?.industries != null ? state.values.industries.split(",").filter(Boolean) : initial.industries;
  const aiDefault = v("aiMarked", initial.aiMarked == null ? "" : initial.aiMarked ? "ja" : "nein");

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <fieldset className="space-y-4 rounded-xl border bg-card p-4">
        <legend className="px-1 text-sm font-semibold">Werk</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="type">Typ</Label>
            <NativeSelect id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} {...err("type")}>
              <option value="">Typ wählen …</option>
              {Object.entries(WORK_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </NativeSelect>
            <FieldError id="type-error" msg={fe.type} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" name="title" defaultValue={v("title", initial.title)} required maxLength={120} placeholder="z. B. Ashen Shores" {...err("title")} />
            <FieldError id="title-error" msg={fe.title} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea id="description" name="description" rows={4} defaultValue={v("description", initial.description)} placeholder="Stimmung, Einsatzzwecke, Lieferformat …" {...err("description")} />
          <FieldError id="description-error" msg={fe.description} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" defaultValue={v("tags", initial.tags.join(", "))} placeholder="Cinematic, Episch, Orchestral" aria-describedby="tags-hint" />
          <p id="tags-hint" className="text-xs text-muted-foreground">Kommagetrennt, max. 12 – Genre, Stimmung, Einsatz.</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Passt besonders für (Branchen)</legend>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((i) => (
              <label key={i.slug} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="industries" value={i.slug} defaultChecked={industriesSel.includes(i.slug)} className="size-4 accent-primary" />
                {i.name}
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {audio && (
        <fieldset className="space-y-4 rounded-xl border bg-card p-4">
          <legend className="px-1 text-sm font-semibold">Audio-Details</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="durationSec">Dauer (mm:ss)</Label>
              <Input id="durationSec" name="durationSec" defaultValue={v("durationSec", fmtDur(initial.durationSec))} placeholder="2:44" inputMode="numeric" {...err("durationSec")} />
              <FieldError id="durationSec-error" msg={fe.durationSec} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bpm">BPM</Label>
              <Input id="bpm" name="bpm" type="number" min={20} max={300} defaultValue={v("bpm", initial.bpm ? String(initial.bpm) : "")} inputMode="numeric" {...err("bpm")} />
              <FieldError id="bpm-error" msg={fe.bpm} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="musicalKey">Tonart</Label>
              <Input id="musicalKey" name="musicalKey" defaultValue={v("musicalKey", initial.musicalKey ?? "")} placeholder="d-Moll" maxLength={20} />
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4 rounded-xl border bg-card p-4">
        <legend className="px-1 text-sm font-semibold">Preise (netto, 100 % an dich)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ["priceStandard", "standard", initial.priceStandard],
            ["priceExtended", "erweitert", initial.priceExtended],
            ["priceExclusive", "exklusiv", initial.priceExclusive],
          ] as const).map(([name, tier, val]) => (
            <div key={name} className="grid content-start gap-1.5">
              <Label htmlFor={name}>{LICENSE_TIERS[tier].label} (€){tier === "exklusiv" && <span className="font-normal text-muted-foreground"> – optional</span>}</Label>
              <Input id={name} name={name} type="number" min={1} step={1} inputMode="numeric" defaultValue={v(name, val == null ? "" : String(val))} {...err(name)} aria-describedby={`${name}-hint${fe[name] ? ` ${name}-error` : ""}`} />
              <p id={`${name}-hint`} className="text-xs text-muted-foreground">{LICENSE_TIERS[tier].summary}{tier === "exklusiv" ? ". Leer = nicht angeboten." : ""}</p>
              <FieldError id={`${name}-error`} msg={fe[name]} />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border bg-card p-4" aria-describedby={fe.aiMarked ? "aiMarked-error" : "ai-hint"}>
        <legend className="px-1 text-sm font-semibold">KI-Kennzeichnung (Pflichtangabe)</legend>
        <p id="ai-hint" className="text-sm text-muted-foreground">Nach Art. 50 EU AI Act müssen KI-generierte oder wesentlich KI-bearbeitete Inhalte gekennzeichnet werden. Die Angabe erscheint im Katalog und im Lizenzzertifikat.</p>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="radio" name="aiMarked" value="nein" defaultChecked={aiDefault === "nein"} className="mt-0.5 size-4 accent-primary" required />
            Ohne generative KI erstellt
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="aiMarked" value="ja" defaultChecked={aiDefault === "ja"} className="mt-0.5 size-4 accent-primary" />
            Mit KI-Unterstützung erstellt (wird gekennzeichnet)
          </label>
        </div>
        <FieldError id="aiMarked-error" msg={fe.aiMarked} />
      </fieldset>

      <fieldset className="space-y-2 rounded-xl border bg-card p-4">
        <legend className="px-1 text-sm font-semibold">Vorschau-Datei (optional)</legend>
        <Label htmlFor="file">{audio ? "Hörprobe (MP3/WAV, max. 8 MB)" : "Vorschaubild (JPG/PNG/WebP, max. 8 MB)"}</Label>
        <Input id="file" name="file" type="file" accept={audio ? "audio/*" : "image/*"} {...err("file")} />
        <p className="text-xs text-muted-foreground">
          {initial.hasUpload ? "Eine Vorschau ist bereits hinterlegt – eine neue Datei ersetzt sie." : audio ? "Ohne Upload wird eine Demo-Hörprobe verwendet." : "Ohne Upload wird ein Stock-Vorschaubild verwendet."} Lade nur Vorschauen hoch, nie die Master-Dateien.
        </p>
        <FieldError id="file-error" msg={fe.file} />
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="h-10">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {editing ? "Änderungen speichern" : "Werk veröffentlichen"}
        </Button>
        <Button asChild variant="ghost" className="h-10"><Link href="/lizenzen/werke">Abbrechen</Link></Button>
      </div>
    </form>
  );
}
