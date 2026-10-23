"use client";

import { useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addDisputeNote, resolveDispute } from "@/app/actions/admin";
import { useAdminAction } from "./action-button";

export function DisputeNoteForm({ disputeId }: { disputeId: string }) {
  const [text, setText] = useState("");
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addDisputeNote(disputeId, text), () => setText(""));
      }}
    >
      <Label htmlFor="dispute-note">Notiz zum Verlauf hinzufügen</Label>
      <Textarea id="dispute-note" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Rückmeldung der Crew eingeholt …" />
      <div>
        <Button type="submit" size="sm" disabled={pending || text.trim().length < 3}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Notiz speichern
        </Button>
      </div>
    </form>
  );
}

const DECISIONS = [
  {
    key: "freigegeben",
    label: "Zahlung freigeben",
    variant: "default",
    explain: "Alle reservierten bzw. freigegebenen Zahlungen werden freigegeben und an die Crew ausgezahlt. Projekt wird abgeschlossen.",
  },
  {
    key: "teilerstattet",
    label: "Teilerstattung 50 %",
    variant: "secondary",
    explain: "Jede offene Zahlung wird halbiert: 50 % gehen an die Crew, 50 % werden der Auftraggeber:in erstattet. Projekt wird abgeschlossen.",
  },
  {
    key: "erstattet",
    label: "Zahlung erstatten",
    variant: "destructive",
    explain: "Alle offenen Zahlungen werden vollständig an die Auftraggeber:in erstattet. Projekt wird storniert.",
  },
] as const;

export function DisputeDecision({ disputeId, openAmount }: { disputeId: string; openAmount: string }) {
  const [choice, setChoice] = useState<(typeof DECISIONS)[number] | null>(null);
  const { pending, run } = useAdminAction();
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {DECISIONS.map((d) => (
          <Button key={d.key} variant={d.variant} onClick={() => setChoice(d)} data-testid={`dispute-${d.key}`}>
            <Scale aria-hidden /> {d.label}
          </Button>
        ))}
      </div>
      <Dialog open={choice !== null} onOpenChange={(o) => !o && !pending && setChoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{choice?.label}?</DialogTitle>
            <DialogDescription>
              {choice?.explain} Betroffen: {openAmount} (Mock-Zahlungsdienstleister). Die Entscheidung ist endgültig, alle Beteiligten werden benachrichtigt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>Abbrechen</Button>
            </DialogClose>
            <Button
              variant={choice?.variant ?? "default"}
              disabled={pending}
              onClick={() => choice && run(() => resolveDispute(disputeId, choice.key), () => setChoice(null))}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />} Entscheidung treffen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
