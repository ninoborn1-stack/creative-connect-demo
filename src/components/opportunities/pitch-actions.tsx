"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Star, Undo2, X } from "lucide-react";
import { acceptPitch, setOpportunityStatus, setPitchStatus, withdrawPitch } from "@/app/actions/opportunities";
import { formatEur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

type R = { ok: boolean; error?: string; message?: string; projectId?: string };

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<R>, after?: (r: R) => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Das hat nicht geklappt.");
      if (res.message) toast.success(res.message);
      after?.(res);
    });
  return { pending, run };
}

export function PitchActions({ pitchId, status, creativeName, price, opportunityTitle }: { pitchId: string; status: string; creativeName: string; price: number; opportunityTitle: string }) {
  const { pending, run } = useRun();
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "eingereicht" && (
        <Button size="sm" variant="outline" disabled={pending} data-testid="pitch-shortlist" onClick={() => run(() => setPitchStatus(pitchId, "shortlist"))} aria-label={`${creativeName} auf die Shortlist setzen`}>
          <Star aria-hidden /> Shortlist
        </Button>
      )}
      {status === "shortlist" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setPitchStatus(pitchId, "eingereicht"))} aria-label={`${creativeName} von der Shortlist nehmen`}>
          <Undo2 aria-hidden /> Zurück
        </Button>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" disabled={pending} data-testid="pitch-accept" aria-label={`${creativeName} zusagen`}>
            <Check aria-hidden /> Zusagen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creativeName} zusagen?</DialogTitle>
            <DialogDescription>
              Für „{opportunityTitle}“ zu {formatEur(price)}. Es wird ein Projekt mit Vertrag angelegt, die Zahlung treuhänderisch reserviert und alle anderen offenen Pitches erhalten eine Absage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Abbrechen</Button></DialogClose>
            <Button
              data-testid="pitch-accept-confirm"
              disabled={pending}
              onClick={() => run(() => acceptPitch(pitchId), (r) => r.projectId && router.push(`/projekte/${r.projectId}`))}
            >
              {pending ? "Wird angelegt …" : "Verbindlich zusagen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setPitchStatus(pitchId, "abgelehnt"))} aria-label={`${creativeName} absagen`}>
        <X aria-hidden /> Absagen
      </Button>
    </div>
  );
}

export function WithdrawPitchButton({ pitchId }: { pitchId: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => withdrawPitch(pitchId))}>
      <Undo2 aria-hidden /> Zurückziehen
    </Button>
  );
}

export function OpportunityStatusControl({ opportunityId, status }: { opportunityId: string; status: string }) {
  const { pending, run } = useRun();
  if (status === "vergeben") return null;
  const options = [
    { key: "offen", label: "Offen" },
    { key: "in_auswahl", label: "In Auswahl" },
    { key: "geschlossen", label: "Schließen" },
  ] as const;
  return (
    <div role="group" aria-label="Status der Ausschreibung" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Button
          key={o.key}
          size="sm"
          variant={status === o.key ? "secondary" : "outline"}
          aria-pressed={status === o.key}
          disabled={pending || status === o.key}
          onClick={() => run(() => setOpportunityStatus(opportunityId, o.key))}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
