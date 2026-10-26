"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Hourglass, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { acceptApplication, markApplicationInReview, rejectApplication, saveApplicationNote } from "@/app/actions/applications";
import { useAdminAction } from "./action-button";

export function ApplicationReview({ id, status, note }: { id: string; status: string; note: string }) {
  const router = useRouter();
  const [text, setText] = useState(note);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAdminAction();
  const decided = status === "angenommen" || status === "abgelehnt";
  const refresh = () => router.refresh();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="review-note">Notiz {decided ? "" : "(bei Ablehnung Pflicht, geht an die Person)"}</Label>
        <Textarea id="review-note" value={text} onChange={(e) => { setText(e.target.value); setError(null); }} rows={4} placeholder="z. B. Starke Game-Referenzen, direkt verifiziert." aria-invalid={!!error || undefined} aria-describedby={error ? "review-note-error" : undefined} />
        {error && <p id="review-note-error" className="text-sm text-destructive" role="alert">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => saveApplicationNote(id, text), refresh)}>
          <Save aria-hidden /> Notiz speichern
        </Button>
        {status === "eingereicht" && (
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => markApplicationInReview(id), refresh)}>
            <Hourglass aria-hidden /> In Prüfung
          </Button>
        )}
      </div>
      {!decided && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={pending} onClick={() => run(() => acceptApplication(id, text), refresh)} data-testid="admin-application-accept">
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} Aufnehmen
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            data-testid="admin-application-reject"
            onClick={() => {
              if (text.trim().length < 10) {
                setError("Bitte die Ablehnung kurz begründen (mind. 10 Zeichen).");
                document.getElementById("review-note")?.focus();
                return;
              }
              run(() => rejectApplication(id, text), refresh);
            }}
          >
            <X aria-hidden /> Ablehnen
          </Button>
        </div>
      )}
      {!decided && <p className="text-xs text-muted-foreground">„Aufnehmen“ legt Konto und vorbefülltes, verifiziertes Profil an und schickt die Zugangsdaten per Mail (Outbox).</p>}
    </div>
  );
}
