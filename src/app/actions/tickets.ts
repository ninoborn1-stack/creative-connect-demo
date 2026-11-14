"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { payments } from "@/lib/services/payments";
import { notify, sendMail } from "@/lib/services/mail";
import { formatDate, formatEurExact } from "@/lib/format";
import { MAX_TICKETS_PER_ORDER, ticketTotal, ticketsSold } from "@/lib/tickets";

export type BuyTicketsResult = { ok: true; code: string; quantity: number; total: number } | { ok: false; error: string };

function ticketCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "CC-T-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Ticketkauf in einem Schritt (Demo: Zahlung über den Mock-Zahlungsdienst, keine echte Abbuchung)
export async function buyTickets(eventId: string, quantity: number): Promise<BuyTicketsResult> {
  const user = await requireUser();
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    return { ok: false, error: `Bitte 1 bis ${MAX_TICKETS_PER_ORDER} Tickets wählen.` };
  }
  const event = await db.event.findUnique({ where: { id: eventId }, include: { tickets: { select: { quantity: true } } } });
  if (!event || event.ticketPrice == null) return { ok: false, error: "Für dieses Event gibt es keine Tickets." };
  if (event.date < new Date()) return { ok: false, error: "Das Event ist bereits vorbei." };
  const left = event.capacity - ticketsSold(event.tickets);
  if (left <= 0) return { ok: false, error: "Leider ausverkauft." };
  if (quantity > left) return { ok: false, error: `Nur noch ${left} Tickets verfügbar.` };

  const { subtotal, fee, total } = ticketTotal(event.ticketPrice, quantity);
  let code = ticketCode();
  while (await db.ticketOrder.findUnique({ where: { code } })) code = ticketCode();

  const payment = await payments.reserve({ label: `Tickets ${code} – ${event.title}`, amount: Math.round(subtotal), serviceFee: Math.round(fee) }); // Payment rechnet in ganzen Euro
  await payments.release(payment.id);
  await db.ticketOrder.create({ data: { code, eventId, userId: user.id, quantity, price: event.ticketPrice, serviceFee: fee } });

  const when = `${formatDate(event.date)}, ${event.startTime} Uhr`;
  await sendMail(
    user.email,
    `Deine Tickets: ${event.title}`,
    `Hallo ${user.name.split(" ")[0]},\n\ndeine Tickets sind gebucht.\n\n${event.title}\n${when}\n${event.venueName}, ${event.city}\n\n${quantity} × ${formatEurExact(event.ticketPrice)} + Ticketgebühr ${formatEurExact(fee)} = ${formatEurExact(total)} (Demo – keine echte Zahlung).\nTicket-Code: ${code}\n\nZeig den Code am Einlass vor.\nDein Creative-Connect-Team`,
  );
  await notify(user.id, "Tickets gebucht", `${quantity} × ${event.title} – Code ${code}`, `/events/${event.slug}`);

  revalidatePath("/events");
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/entdecken");
  return { ok: true, code, quantity, total };
}
