"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, SuccessPanel } from "./form-bits";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <SuccessPanel title="Schau in dein Postfach">
        <p>Falls ein Konto zu <strong className="text-foreground">{state.message}</strong> existiert, haben wir dir einen Link zum Zurücksetzen geschickt.</p>
        <p>Demo: Die Mail landet in der Outbox, die du nach dem Login unter „Outbox“ findest.</p>
        <div className="pt-2"><Button asChild variant="outline"><Link href="/login">Zurück zum Login</Link></Button></div>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field id="email" label="E-Mail">
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue="kreativ@demo.cc" required />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Wird gesendet …" : "Link anfordern"}
      </Button>
    </form>
  );
}
