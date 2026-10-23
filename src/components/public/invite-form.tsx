"use client";

import { useActionState } from "react";
import { redeemInvite } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "./form-bits";

export function InviteForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(redeemInvite, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <Field id="name" label="Name">
        <Input id="name" name="name" autoComplete="name" required minLength={2} />
      </Field>
      <Field id="email" label="E-Mail">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="password" label="Passwort" hint="Demo: mindestens 4 Zeichen">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={4} />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Konto wird angelegt …" : "Einladung annehmen"}
      </Button>
    </form>
  );
}
