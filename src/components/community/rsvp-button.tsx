"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { joinEventWaitlist, toggleRsvp } from "@/app/actions/community";
import { Button } from "@/components/ui/button";

export function RsvpButton({ eventId, attending, full }: { eventId: string; attending: boolean; full: boolean }) {
  const [pending, startTransition] = useTransition();
  const [waitlisted, setWaitlisted] = useState(false);

  if (!attending && full) {
    return waitlisted ? (
      <Button variant="secondary" disabled className="h-10 w-full sm:w-auto"><Clock aria-hidden />Auf der Warteliste</Button>
    ) : (
      <Button
        variant="outline"
        className="h-10 w-full sm:w-auto"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await joinEventWaitlist(eventId);
            if (!res.ok) return void toast.error(res.error);
            setWaitlisted(true);
            toast.success("Du stehst auf der Warteliste.");
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Clock aria-hidden />}Ausgebucht – auf die Warteliste
      </Button>
    );
  }

  return (
    <Button
      variant={attending ? "outline" : "default"}
      className="h-10 w-full sm:w-auto"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleRsvp(eventId);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.attending ? `Du bist dabei!${res.points ? ` +${res.points} Punkte.` : ""} Bestätigung liegt in der Outbox.` : "Zusage zurückgezogen.");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : attending ? <X aria-hidden /> : <Check aria-hidden />}
      {attending ? "Absagen" : "Zusagen"}
    </Button>
  );
}
