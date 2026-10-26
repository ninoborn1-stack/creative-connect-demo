"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerClient } from "@/app/actions/public";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError } from "./form-bits";

// Firmen-Onboarding: Unternehmen + erstes Teamkonto in einem Schritt
export function RegisterForm({ serviceFeePct }: { serviceFeePct: number }) {
  const [state, action, pending] = useActionState(registerClient, undefined);
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold">1 · Unternehmen</legend>
        <Field id="company" label="Firmenname">
          <Input id="company" name="company" autoComplete="organization" required minLength={2} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="industry" label="Branche">
            <Select name="industry" required>
              <SelectTrigger id="industry" className="w-full"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => <SelectItem key={i.slug} value={i.slug}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="size" label="Unternehmensgröße">
            <Select name="size" required>
              <SelectTrigger id="size" className="w-full"><SelectValue placeholder="Mitarbeitende" /></SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} Mitarbeitende</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label="Standort (Stadt)">
            <Input id="city" name="city" autoComplete="address-level2" required minLength={2} />
          </Field>
          <Field id="website" label="Website (optional)">
            <Input id="website" name="website" type="text" inputMode="url" autoComplete="url" placeholder="firma.de" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t pt-6">
        <legend className="mb-1 text-sm font-semibold">2 · Dein Konto</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Dein Name">
            <Input id="name" name="name" autoComplete="name" required minLength={2} />
          </Field>
          <Field id="jobTitle" label="Deine Position">
            <Input id="jobTitle" name="jobTitle" autoComplete="organization-title" required minLength={2} placeholder="z. B. Head of Audio" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Geschäftliche E-Mail">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field id="password" label="Passwort" hint="Demo: mindestens 4 Zeichen">
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={4} />
          </Field>
        </div>
      </fieldset>

      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Firmenkonto wird angelegt …" : "Firmenkonto anlegen"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Mit der Registrierung akzeptierst du die <Link href="/agb" className="underline underline-offset-4">AGB</Link> und die{" "}
        <Link href="/datenschutz" className="underline underline-offset-4">Datenschutzerklärung</Link>. Auf Honorare und Lizenzen fällt eine Servicegebühr von {serviceFeePct} % an – keine Grundgebühr. Weitere Teammitglieder lädst du später ein.
      </p>
    </form>
  );
}
