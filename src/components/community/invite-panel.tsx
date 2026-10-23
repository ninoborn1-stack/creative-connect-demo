"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Mail, RefreshCw, Ticket } from "lucide-react";
import { toast } from "sonner";
import { createInvite, inviteByEmail } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  invite: { code: string; expiresLabel: string } | null;
  origin: string;
  openCount: number;
  quota: number;
};

export function InvitePanel({ invite, origin, openCount, quota }: Props) {
  const [pending, startTransition] = useTransition();
  const [sending, startSend] = useTransition();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const link = invite ? `${origin}/invite/${invite.code}` : "";
  const quotaLeft = Math.max(0, quota - openCount);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link kopiert");
    } catch {
      toast.error("Kopieren nicht möglich – bitte manuell markieren.");
    }
  }

  function generate() {
    startTransition(async () => {
      const res = await createInvite();
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Neuer Code: ${res.code}`);
    });
  }

  function sendMail(e: React.FormEvent) {
    e.preventDefault();
    startSend(async () => {
      const res = await inviteByEmail({ email, note, origin });
      if (!res.ok) return void toast.error(res.error);
      setEmail("");
      setNote("");
      toast.success("Einladung verschickt – siehe Outbox");
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-4" aria-labelledby="mein-code">
        <h2 id="mein-code" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Ticket className="size-4 text-primary" aria-hidden />Dein Einladungscode</h2>
        {invite ? (
          <div className="space-y-3">
            <p className="font-mono text-2xl font-bold tracking-wider break-all text-primary" data-testid="invite-code">{invite.code}</p>
            <p className="text-xs text-muted-foreground">Gültig bis {invite.expiresLabel}</p>
            <div className="flex gap-2">
              <Label htmlFor="invite-link" className="sr-only">Einladungslink</Label>
              <Input id="invite-link" value={link} readOnly className="h-9 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={copy} className="h-9 shrink-0"><Copy aria-hidden />Kopieren</Button>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">Du hast gerade keinen offenen Code. Erzeuge einen und teile den Link.</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
          <Button variant={invite ? "outline" : "default"} onClick={generate} disabled={pending || quotaLeft === 0}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            {invite ? "Weiteren Code erzeugen" : "Einladungscode erzeugen"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Kontingent: {openCount}/{quota} offene Einladungen{quotaLeft === 0 ? " – voll" : ""}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4" aria-labelledby="per-mail">
        <h2 id="per-mail" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Mail className="size-4 text-primary" aria-hidden />Per E-Mail einladen</h2>
        <form onSubmit={sendMail} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="inv-email">E-Mail-Adresse</Label>
            <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="inv-note">Persönliche Nachricht (optional)</Label>
            <Textarea id="inv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Hey, ich hab dich für das Netzwerk vorgeschlagen …" />
          </div>
          <Button type="submit" disabled={sending || !email || quotaLeft === 0}>
            {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}Einladung senden
          </Button>
          <p className="text-xs text-muted-foreground">Jede E-Mail-Einladung bekommt einen eigenen Code. Demo: Die Mail landet in der Outbox.</p>
        </form>
      </section>
    </div>
  );
}
