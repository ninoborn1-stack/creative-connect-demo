"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { inviteColleague } from "@/app/actions/companies";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function InviteColleagueDialog({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const res = await inviteColleague(companyId, {
        email: String(formData.get("email") ?? ""),
        note: String(formData.get("note") ?? ""),
        origin: window.location.origin,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Einladung gesendet.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><UserPlus aria-hidden /> Kolleg:in einladen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kolleg:in einladen</DialogTitle>
          <DialogDescription>Teammitglieder von {companyName} können Ausschreibungen verwalten, Pitches bewerten und Werke lizenzieren.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-Mail-Adresse</Label>
            <Input id="invite-email" name="email" type="email" required autoComplete="off" placeholder="vorname.nachname@firma.de" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-note">Persönliche Nachricht (optional)</Label>
            <Textarea id="invite-note" name="note" rows={3} maxLength={500} placeholder="z. B. Kannst du die Pitches für den Trailer mit sichten?" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Senden …" : "Einladung senden"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
