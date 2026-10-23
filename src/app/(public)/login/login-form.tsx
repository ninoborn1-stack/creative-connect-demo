"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue="kreativ@demo.cc" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Passwort</Label>
          <Link href="/passwort-vergessen" className="text-xs text-muted-foreground hover:text-foreground">Passwort vergessen?</Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" defaultValue="demo" required />
      </div>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Anmelden …" : "Anmelden"}
      </Button>
    </form>
  );
}
