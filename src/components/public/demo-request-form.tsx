"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestDemo } from "@/app/actions/public";
import { INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError, SuccessPanel } from "./form-bits";

const INTERESTS = ["Self-Service", "Managed Crew", "Licensing", "Ausschreibungen", "Enterprise / Rahmenvertrag"];

export function DemoRequestForm() {
  const [state, action, pending] = useActionState(requestDemo, undefined);

  if (state?.success) {
    return (
      <SuccessPanel title="Danke – wir melden uns!">
        <p>{state.message}, Nesto und das Team melden sich innerhalb von zwei Werktagen mit Terminvorschlägen. Eine Bestätigung liegt in deinem Postfach.</p>
        <p>
          In der Demo landen alle Mails in der <Link href="/outbox" className="text-primary underline-offset-4 hover:underline">Outbox</Link>.
        </p>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="demo-name" label="Name">
          <Input id="demo-name" name="name" autoComplete="name" required minLength={2} />
        </Field>
        <Field id="demo-company" label="Unternehmen">
          <Input id="demo-company" name="company" autoComplete="organization" required minLength={2} />
        </Field>
      </div>
      <Field id="demo-email" label="Geschäftliche E-Mail">
        <Input id="demo-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="demo-industry" label="Branche">
          <Select name="industry" required>
            <SelectTrigger id="demo-industry" className="w-full"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => <SelectItem key={i.slug} value={i.slug}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="demo-interest" label="Interesse">
          <Select name="interest" required defaultValue="Managed Crew">
            <SelectTrigger id="demo-interest" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTERESTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id="demo-message" label="Worum geht es? (optional)">
        <Textarea id="demo-message" name="message" rows={4} placeholder="z. B. Soundtrack und Voice Cast für unser nächstes Game, Start im Frühjahr" />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="meta h-14 w-full rounded-none text-[0.75rem] hover:bg-[var(--signal)]" disabled={pending}>
        {pending ? "Wird gesendet …" : "Demo anfragen"}
      </Button>
      <p className="meta text-muted-foreground">
        Wir nutzen deine Angaben nur für diese Anfrage. Mehr in der <Link href="/datenschutz" className="underline underline-offset-4">Datenschutzerklärung</Link>.
      </p>
    </form>
  );
}
