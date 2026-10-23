"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinWaitlist } from "@/app/actions/public";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError, SuccessPanel } from "./form-bits";

export function WaitlistForm({ defaultCategory }: { defaultCategory?: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, undefined);

  if (state?.success) {
    return (
      <SuccessPanel title={`Danke, ${state.message}! Du stehst auf der Liste.`}>
        <p>Wir haben dir eine Bestätigung geschickt. Creative Connect wächst bewusst kuratiert – sobald ein Platz frei wird oder ein Mitglied dich einlädt, melden wir uns.</p>
        <p>Du kennst schon jemanden im Netzwerk? Frag nach einem Einladungscode – damit geht es sofort.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline"><Link href="/">Zur Startseite</Link></Button>
          <Button asChild variant="ghost"><Link href="/invite/CC-DEMO-2026">Ich habe einen Code</Link></Button>
        </div>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name">
          <Input id="name" name="name" autoComplete="name" required minLength={2} />
        </Field>
        <Field id="email" label="E-Mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field id="category" label="Dein Bereich">
          <Select name="category" defaultValue={defaultCategory} required>
            <SelectTrigger id="category" className="w-full"><SelectValue placeholder="Bereich wählen" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="city" label="Stadt">
          <Input id="city" name="city" list="cc-cities" autoComplete="address-level2" placeholder="z. B. Leipzig" required minLength={2} />
          <datalist id="cc-cities">{CITIES.map((c) => <option key={c.name} value={c.name} />)}</datalist>
        </Field>
      </div>
      <Field id="message" label="Nachricht (optional)" hint="Woran arbeitest du gerade? Wer aus dem Netzwerk kennt dich?">
        <Textarea id="message" name="message" rows={4} maxLength={800} />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:px-6" disabled={pending}>
        {pending ? "Wird gesendet …" : "Auf die Warteliste"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Mit dem Absenden stimmst du zu, dass wir dich zu deiner Aufnahme kontaktieren. Mehr in der <Link href="/datenschutz" className="underline underline-offset-4">Datenschutzerklärung</Link>.
      </p>
    </form>
  );
}
