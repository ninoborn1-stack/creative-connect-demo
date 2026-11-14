"use client";

import { useState, useTransition } from "react";
import { Loader2, Minus, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { buyTickets } from "@/app/actions/tickets";
import { formatEurExact } from "@/lib/format";
import { MAX_TICKETS_PER_ORDER, TICKET_FEE_PCT, ticketTotal } from "@/lib/tickets";
import { Button } from "@/components/ui/button";

// Ticketkauf in einem Schritt: Anzahl wählen, Summe sehen, kaufen – danach erscheint das Ticket direkt darunter
export function TicketBox({ eventId, price, left }: { eventId: string; price: number; left: number }) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const max = Math.min(MAX_TICKETS_PER_ORDER, left);
  const { subtotal, fee, total } = ticketTotal(price, quantity);

  if (left <= 0) {
    return <p className="rounded-xl border border-dashed p-4 text-center font-semibold">Ausverkauft</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span id="ticket-anzahl" className="text-sm font-medium">Anzahl</span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="ticket-anzahl">
          <Button variant="outline" size="icon" className="size-9 rounded-full" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Ein Ticket weniger">
            <Minus aria-hidden />
          </Button>
          <output className="w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite" data-testid="ticket-quantity">{quantity}</output>
          <Button variant="outline" size="icon" className="size-9 rounded-full" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max} aria-label="Ein Ticket mehr">
            <Plus aria-hidden />
          </Button>
        </div>
      </div>
      <dl className="space-y-1 border-t pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">{quantity} × {formatEurExact(price)}</dt><dd className="tabular-nums">{formatEurExact(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Ticketgebühr ({TICKET_FEE_PCT} %)</dt><dd className="tabular-nums">{formatEurExact(fee)}</dd></div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Gesamt</dt><dd className="tabular-nums" data-testid="ticket-total">{formatEurExact(total)}</dd></div>
      </dl>
      <Button
        className="h-12 w-full text-base"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await buyTickets(eventId, quantity);
            if (!res.ok) return void toast.error(res.error);
            toast.success(`${res.quantity} ${res.quantity === 1 ? "Ticket" : "Tickets"} gebucht – Code ${res.code}`);
            setQuantity(1);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Ticket aria-hidden />}Jetzt Ticket kaufen
      </Button>
      <p className="text-center text-xs text-muted-foreground">Noch {left} Tickets · Demo – keine echte Zahlung</p>
    </div>
  );
}
