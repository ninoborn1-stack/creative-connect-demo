"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, HandCoins, X } from "lucide-react";
import { acceptRequest, counterOffer, declineRequest } from "@/app/actions/requests";
import { formatEur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RequestActions({ requestId, price, projectTitle, roleTitle }: { requestId: string; price: number; projectTitle: string; roleTitle: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [counterPending, startCounter] = useTransition();

  function submitCounter(formData: FormData) {
    startCounter(async () => {
      const res = await counterOffer(undefined, formData);
      if (res?.ok) {
        toast.success(res.message ?? "Gegenangebot gesendet.");
        setOpen(false);
      } else if (res?.error) toast.error(res.error);
    });
  }

  function run(fn: (id: string) => Promise<{ ok?: boolean; error?: string; message?: string } | undefined>) {
    start(async () => {
      const res = await fn(requestId);
      if (res?.error) toast.error(res.error);
      else if (res?.message) toast.success(res.message);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => run(acceptRequest)} disabled={pending} aria-label={`Anfrage ${roleTitle} – ${projectTitle} annehmen`}>
        <Check aria-hidden /> Annehmen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <HandCoins aria-hidden /> Gegenangebot
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gegenangebot machen</DialogTitle>
            <DialogDescription>
              {roleTitle} · {projectTitle}. Angeboten: {formatEur(price)}. Du setzt deine Preise selbst.
            </DialogDescription>
          </DialogHeader>
          <form action={submitCounter} className="space-y-4">
            <input type="hidden" name="requestId" value={requestId} />
            <div className="space-y-1.5">
              <Label htmlFor={`price-${requestId}`}>Dein Preis (€)</Label>
              <Input id={`price-${requestId}`} name="price" type="number" min={50} step={10} defaultValue={Math.round((price * 1.15) / 10) * 10} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`note-${requestId}`}>Begründung (optional)</Label>
              <Textarea id={`note-${requestId}`} name="note" rows={3} placeholder="z. B. zusätzlicher Drehtag, Equipment inklusive …" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={counterPending}>{counterPending ? "Senden …" : "Gegenangebot senden"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Button size="sm" variant="ghost" onClick={() => run(declineRequest)} disabled={pending}>
        <X aria-hidden /> Ablehnen
      </Button>
    </div>
  );
}
