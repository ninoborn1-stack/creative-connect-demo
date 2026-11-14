// Event-Tickets: Preislogik an einer Stelle. Die Ticketgebühr deckt Zahlungsabwicklung und Plattform
// (wie Vorverkaufsgebühr bei Ticketanbietern) und wird beim Kauf offen ausgewiesen.
export const TICKET_FEE_PCT = 10;
export const MAX_TICKETS_PER_ORDER = 6;

export function ticketFee(price: number) {
  return Math.round(price * TICKET_FEE_PCT) / 100;
}

export function ticketTotal(price: number, quantity: number) {
  const fee = ticketFee(price) * quantity;
  return { subtotal: price * quantity, fee, total: price * quantity + fee };
}

export function ticketsSold(orders: { quantity: number }[]) {
  return orders.reduce((n, o) => n + o.quantity, 0);
}
