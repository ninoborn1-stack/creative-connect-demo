"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvite } from "@/app/actions/admin";
import { useAdminAction } from "./action-button";

export function CreateInviteForm() {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("30");
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createInvite(email, Number(days)), () => setEmail(""));
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="invite-email">E-Mail (optional)</Label>
        <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" autoComplete="off" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="invite-days">Gültig (Tage)</Label>
        <Input id="invite-days" type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Code erzeugen
      </Button>
    </form>
  );
}
