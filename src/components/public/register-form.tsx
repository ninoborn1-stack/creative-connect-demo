"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerClient } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError } from "./form-bits";

const TYPES = ["Label", "Marke", "Agentur", "Magazin", "Independent-Artist"];

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerClient, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Dein Name">
          <Input id="name" name="name" autoComplete="name" required minLength={2} />
        </Field>
        <Field id="company" label="Firma / Künstler:innen-Name">
          <Input id="company" name="company" autoComplete="organization" required minLength={2} />
        </Field>
      </div>
      <Field id="clientType" label="Was beschreibt dich am besten?">
        <Select name="clientType" required>
          <SelectTrigger id="clientType" className="w-full"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="email" label="E-Mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field id="password" label="Passwort" hint="Demo: mindestens 4 Zeichen">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={4} />
        </Field>
      </div>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Konto wird angelegt …" : "Konto anlegen & Briefing starten"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Mit der Registrierung akzeptierst du die <Link href="/agb" className="underline underline-offset-4">AGB</Link> und die{" "}
        <Link href="/datenschutz" className="underline underline-offset-4">Datenschutzerklärung</Link>. Für dich fällt eine Servicegebühr auf gebuchte Honorare an – keine Grundgebühr.
      </p>
    </form>
  );
}
