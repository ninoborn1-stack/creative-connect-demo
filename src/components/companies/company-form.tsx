"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateCompany, type CompanyFormState } from "@/app/actions/companies";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CompanyFormValues = {
  id: string; slug: string; tagline: string; about: string; industry: string; size: string; city: string; website: string | null; founded: number | null;
};

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p id={`${id}-err`} className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CompanyForm({ company: c }: { company: CompanyFormValues }) {
  const [state, action, pending] = useActionState<CompanyFormState, FormData>(updateCompany.bind(null, c.id), undefined);
  const e = state?.fieldErrors ?? {};
  const inv = (k: string) => (e[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});
  return (
    <form action={action} className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
      {state?.error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Field id="tagline" label="Tagline" error={e.tagline} hint="Ein Satz, der euch beschreibt (max. 140 Zeichen).">
        <Input id="tagline" name="tagline" defaultValue={c.tagline} maxLength={140} required {...inv("tagline")} />
      </Field>
      <Field id="about" label="Über uns" error={e.about} hint="Absätze mit Leerzeile trennen. Was macht ihr, mit wem arbeitet ihr gern?">
        <Textarea id="about" name="about" defaultValue={c.about} rows={8} required {...inv("about")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="industry" label="Branche" error={e.industry}>
          <select id="industry" name="industry" defaultValue={c.industry} className={selectCls} {...inv("industry")}>
            {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </select>
        </Field>
        <Field id="size" label="Unternehmensgröße" error={e.size}>
          <select id="size" name="size" defaultValue={c.size} className={selectCls} {...inv("size")}>
            {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} Mitarbeitende</option>)}
          </select>
        </Field>
        <Field id="city" label="Stadt (Hauptsitz)" error={e.city}>
          <Input id="city" name="city" defaultValue={c.city} required {...inv("city")} />
        </Field>
        <Field id="founded" label="Gegründet (Jahr)" error={e.founded}>
          <Input id="founded" name="founded" type="number" inputMode="numeric" min={1800} max={new Date().getFullYear()} defaultValue={c.founded ?? ""} {...inv("founded")} />
        </Field>
        <Field id="website" label="Website" error={e.website}>
          <Input id="website" name="website" type="url" placeholder="https://" defaultValue={c.website ?? ""} {...inv("website")} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>{pending ? "Speichern …" : "Speichern"}</Button>
        <Button asChild variant="ghost"><Link href={`/unternehmen/${c.slug}`}>Abbrechen</Link></Button>
      </div>
    </form>
  );
}
