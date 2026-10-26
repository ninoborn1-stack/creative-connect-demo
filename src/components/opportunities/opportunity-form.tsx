"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createOpportunity, type OpportunityFormState } from "@/app/actions/opportunities";
import { CATEGORIES, INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={`${id}-err`} className="text-xs text-destructive">{msg}</p> : null;
}

export function OpportunityForm({
  companies, defaultCompanyId, defaultIndustry, defaultCity, minDate,
}: { companies?: { id: string; name: string }[]; defaultCompanyId?: string; defaultIndustry?: string; defaultCity?: string; minDate: string }) {
  const [state, action, pending] = useActionState<OpportunityFormState, FormData>(createOpportunity, undefined);
  const e = state?.fieldErrors ?? {};
  const inv = (k: string) => (e[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});
  return (
    <form action={action} className="space-y-6">
      {state?.error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Worum geht es?</legend>
        {companies && (
          <div className="space-y-1.5">
            <Label htmlFor="companyId">Unternehmen</Label>
            <select id="companyId" name="companyId" defaultValue={defaultCompanyId ?? ""} className={selectCls} required {...inv("companyId")}>
              <option value="" disabled>Bitte wählen …</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Err id="companyId" msg={e.companyId} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" name="title" required maxLength={120} placeholder="z. B. Soundtrack für unser Story-Game" {...inv("title")} />
          <Err id="title" msg={e.title} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Zusammenfassung</Label>
          <Input id="summary" name="summary" required maxLength={240} placeholder="Ein Satz für die Übersicht" {...inv("summary")} />
          <Err id="summary" msg={e.summary} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea id="description" name="description" rows={9} required placeholder={"Ziel, Umfang, Lieferformate, Ablauf …\n\nAbsätze mit Leerzeile trennen."} {...inv("description")} />
          <Err id="description" msg={e.description} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Branche</Label>
          <select id="industry" name="industry" defaultValue={defaultIndustry ?? ""} required className={selectCls} {...inv("industry")}>
            <option value="" disabled>Bitte wählen …</option>
            {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </select>
          <Err id="industry" msg={e.industry} />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-describedby={e.categories ? "categories-err" : undefined}>
        <legend className="px-1 text-sm font-semibold">Wen sucht ihr?</legend>
        <div>
          <p className="mb-2 text-sm font-medium" id="cat-label">Kategorien (1–4)</p>
          <div role="group" aria-labelledby="cat-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10">
                <input type="checkbox" name="categories" value={c.slug} className="size-4 accent-[var(--primary)]" />
                {c.name}
              </label>
            ))}
          </div>
          <Err id="categories" msg={e.categories} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills (mit Komma trennen)</Label>
          <Input id="skills" name="skills" placeholder="z. B. Game-Audio, Wwise, Film-Scoring" {...inv("skills")} />
          <Err id="skills" msg={e.skills} />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Rahmen</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="budgetMin">Budget von (€)</Label>
            <Input id="budgetMin" name="budgetMin" type="number" inputMode="numeric" min={100} step={100} required {...inv("budgetMin")} />
            <Err id="budgetMin" msg={e.budgetMin} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budgetMax">Budget bis (€)</Label>
            <Input id="budgetMax" name="budgetMax" type="number" inputMode="numeric" min={100} step={100} required {...inv("budgetMax")} />
            <Err id="budgetMax" msg={e.budgetMax} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Pitch-Deadline</Label>
            <Input id="deadline" name="deadline" type="date" min={minDate} required {...inv("deadline")} />
            <Err id="deadline" msg={e.deadline} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Projektstart (optional)</Label>
            <Input id="startDate" name="startDate" type="date" min={minDate} {...inv("startDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Ort</Label>
            <Input id="location" name="location" defaultValue={defaultCity} placeholder="Stadt" {...inv("location")} />
            <Err id="location" msg={e.location} />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" name="remote" className="size-4 accent-[var(--primary)]" /> Remote möglich
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" name="licensing" className="size-4 accent-[var(--primary)]" /> Licensing / Buyout ist Teil der Leistung
            </label>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending} data-testid="opportunity-create">{pending ? "Wird veröffentlicht …" : "Ausschreibung veröffentlichen"}</Button>
        <Button asChild variant="ghost" size="lg"><Link href="/ausschreibungen">Abbrechen</Link></Button>
      </div>
    </form>
  );
}
