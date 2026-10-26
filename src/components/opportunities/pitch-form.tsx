"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { submitPitch, type PitchFormState } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PitchForm({ opportunityId, budgetMin, budgetMax, defaultLinks }: { opportunityId: string; budgetMin: number; budgetMax: number; defaultLinks?: string }) {
  const [state, action, pending] = useActionState<PitchFormState, FormData>(submitPitch.bind(null, opportunityId), undefined);
  const e = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.ok) toast.success("Pitch eingereicht – das Unternehmen wurde benachrichtigt.");
  }, [state]);
  return (
    <form action={action} className="space-y-4" aria-labelledby="pitch-h">
      {state?.error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="pitch-message">Deine Nachricht</Label>
        <Textarea
          id="pitch-message" name="message" rows={6} required minLength={30} maxLength={3000}
          placeholder="Warum passt du? Ansatz, vergleichbare Projekte, Verfügbarkeit …"
          aria-invalid={Boolean(e.message)} aria-describedby={e.message ? "pitch-message-err" : undefined}
        />
        {e.message && <p id="pitch-message-err" className="text-xs text-destructive">{e.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pitch-price">Dein Preis (€, netto)</Label>
        <Input
          id="pitch-price" name="price" type="number" inputMode="numeric" min={50} step={50} required
          defaultValue={Math.round((budgetMin + budgetMax) / 2 / 100) * 100}
          aria-invalid={Boolean(e.price)} aria-describedby={e.price ? "pitch-price-err" : "pitch-price-hint"}
        />
        {e.price ? <p id="pitch-price-err" className="text-xs text-destructive">{e.price}</p> : <p id="pitch-price-hint" className="text-xs text-muted-foreground">Budgetrahmen des Unternehmens – du setzt deinen Preis selbst. 0 % Provision.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pitch-links">Referenz-Links (optional)</Label>
        <Textarea id="pitch-links" name="links" rows={2} defaultValue={defaultLinks} placeholder="https://… (mehrere mit Leerzeichen oder Zeilenumbruch trennen)" aria-invalid={Boolean(e.links)} />
        {e.links && <p className="text-xs text-destructive">{e.links}</p>}
      </div>
      <Button type="submit" disabled={pending} data-testid="pitch-submit" className="w-full sm:w-auto">
        <Send aria-hidden /> {pending ? "Wird gesendet …" : "Pitch einreichen"}
      </Button>
    </form>
  );
}
