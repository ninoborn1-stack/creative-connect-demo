"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { acceptDelivery, openDispute, submitReviews } from "@/app/actions/projects";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ReviewTarget = { id: string; name: string; avatarSeed: string | null; role: string };

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} von 5 Sternen`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-ring"
          data-testid={`star-${n}`}
        >
          <Star className={cn("size-6", n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function AcceptancePanel({
  projectId, canAccept, isOwner, completed, reviewTargets, canReport,
}: {
  projectId: string;
  canAccept: boolean;
  isOwner: boolean;
  completed: boolean;
  reviewTargets: ReviewTarget[];
  canReport: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { rating: number; text: string }>>({});
  const [pending, start] = useTransition();

  function accept() {
    start(async () => {
      const res = await acceptDelivery(projectId);
      setConfirmOpen(false);
      if (res.ok) {
        toast.success(res.message ?? "Abnahme erteilt.");
        setReviewOpen(true);
      } else toast.error(res.error);
    });
  }

  function sendReviews() {
    const list = reviewTargets
      .map((t) => ({ targetId: t.id, rating: ratings[t.id]?.rating ?? 0, text: ratings[t.id]?.text ?? "" }))
      .filter((r) => r.rating > 0);
    if (!list.length) return toast.error("Bitte vergib mindestens eine Sternebewertung.");
    start(async () => {
      const res = await submitReviews(projectId, list);
      if (res.ok) {
        toast.success(res.message ?? "Danke für deine Bewertung!");
        setReviewOpen(false);
        setRatings({});
      } else toast.error(res.error);
    });
  }

  function report(fd: FormData) {
    start(async () => {
      const res = await openDispute(projectId, fd);
      if (res.ok) {
        toast.success(res.message ?? "Gemeldet.");
        setDisputeOpen(false);
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h3 className="font-semibold">Abnahme</h3>
        {completed ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <BadgeCheck className="mr-1 inline size-4 text-emerald-500" aria-hidden />
            Das Projekt ist abgenommen. Alle Zahlungen wurden freigegeben und ausgezahlt.
          </p>
        ) : isOwner ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Mit der Abnahme bestätigst du, dass die Leistung vertragsgemäß erbracht ist. Danach werden die reservierten Zahlungen freigegeben und an die Crew ausgezahlt (Demo: sofort).
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Die Auftraggeber:in nimmt das Projekt ab. Danach wird dein Honorar freigegeben und ausgezahlt.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {isOwner && !completed && (
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!canAccept} data-testid="accept-delivery">
              <BadgeCheck aria-hidden /> Abnahme erteilen
            </Button>
          )}
          {completed && reviewTargets.length > 0 && (
            <Button type="button" onClick={() => setReviewOpen(true)} data-testid="open-review">
              <Star aria-hidden /> {isOwner ? "Crew bewerten" : "Auftraggeber:in bewerten"}
            </Button>
          )}
          {canReport && (
            <Button type="button" variant="destructive" onClick={() => setDisputeOpen(true)} data-testid="open-dispute">
              <AlertTriangle aria-hidden /> Problem melden
            </Button>
          )}
        </div>
        {isOwner && !completed && !canAccept && (
          <p className="mt-2 text-xs text-muted-foreground">Die Abnahme ist möglich, sobald das Projekt in Produktion oder im Status „Abnahme“ ist.</p>
        )}
        {completed && reviewTargets.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Danke – du hast alle Beteiligten bewertet.</p>}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abnahme erteilen?</DialogTitle>
            <DialogDescription>Alle reservierten Zahlungen werden freigegeben und an die Crew ausgezahlt. Das Projekt wird abgeschlossen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Abbrechen</Button>
            <Button type="button" onClick={accept} disabled={pending} data-testid="accept-delivery-confirm">
              {pending && <Loader2 className="animate-spin" aria-hidden />} Ja, Abnahme erteilen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Wie war die Zusammenarbeit?</DialogTitle>
            <DialogDescription>Bewertungen helfen dem Netzwerk. Sie erscheinen auf den Profilen.</DialogDescription>
          </DialogHeader>
          {reviewTargets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Es gibt niemanden mehr zu bewerten.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviewTargets.map((t) => (
                <li key={t.id} className="rounded-lg border p-3" data-testid="review-item">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={t.name} seed={t.avatarSeed} className="size-9" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StarInput
                      label={`Bewertung für ${t.name}`}
                      value={ratings[t.id]?.rating ?? 0}
                      onChange={(v) => setRatings((r) => ({ ...r, [t.id]: { text: r[t.id]?.text ?? "", rating: v } }))}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <Label htmlFor={`review-${t.id}`} className="sr-only">Kommentar zu {t.name}</Label>
                    <Textarea
                      id={`review-${t.id}`} rows={2} placeholder="Was lief gut? (optional)"
                      value={ratings[t.id]?.text ?? ""}
                      onChange={(e) => setRatings((r) => ({ ...r, [t.id]: { rating: r[t.id]?.rating ?? 0, text: e.target.value } }))}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>Später</Button>
            {reviewTargets.length > 0 && (
              <Button type="button" onClick={sendReviews} disabled={pending} data-testid="submit-review">
                {pending && <Loader2 className="animate-spin" aria-hidden />} Bewertungen abschicken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="sm:max-w-md">
          <form action={report} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Problem melden</DialogTitle>
              <DialogDescription>Nesto (Admin) prüft den Fall und vermittelt. Zahlungen bleiben bis zur Klärung reserviert.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="dispute-reason">Was ist passiert?</Label>
              <Textarea id="dispute-reason" name="reason" rows={4} required minLength={10} placeholder="z. B. Die finale Fassung weicht vom abgestimmten Konzept ab …" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisputeOpen(false)}>Abbrechen</Button>
              <Button type="submit" variant="destructive" disabled={pending} data-testid="submit-dispute">Problem melden</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
