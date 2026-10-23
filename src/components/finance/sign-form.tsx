"use client";

import { useActionState, useEffect, useId } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { signContract, type SignState } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignForm({ contractId, side, defaultName }: { contractId: string; side: "A" | "B"; defaultName: string }) {
  const [state, action, pending] = useActionState<SignState, FormData>(signContract, undefined);
  const id = useId();

  useEffect(() => {
    if (state?.ok) toast.success(`Seite ${side} unterschrieben.`);
  }, [state, side]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="side" value={side} />
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-name`}>Name (gilt als Unterschrift)</Label>
        <Input id={`${id}-name`} name="name" defaultValue={defaultName} autoComplete="name" required minLength={2} />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id={`${id}-agree`} name="agree" className="mt-0.5" required />
        <Label htmlFor={`${id}-agree`} className="text-sm leading-snug font-normal">
          Ich stimme zu und unterschreibe diesen Vertrag verbindlich (Demo).
        </Label>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        <PenLine aria-hidden /> {pending ? "Wird unterschrieben …" : "Unterschreiben"}
      </Button>
    </form>
  );
}
