// Mock eines Marktplatz-Zahlungsdienstleisters (Stripe-Connect-ähnlich).
// Creative Connect hält nie selbst fremde Gelder (ZAG) – Geld liegt beim lizenzierten Anbieter.
// Status: reserviert → freigegeben (nach Abnahme) → ausgezahlt, alternativ erstattet.
import { db } from "@/lib/db";

export interface PaymentProvider {
  reserve(input: { projectId?: string; payeeId?: string; label: string; amount: number; serviceFee: number; margin?: number }): Promise<{ id: string }>;
  release(paymentId: string): Promise<void>;
  payout(paymentId: string): Promise<void>;
  refund(paymentId: string): Promise<void>;
}

function ref() {
  return `mock_pi_${Math.random().toString(36).slice(2, 12)}`;
}

export const payments: PaymentProvider = {
  async reserve(input) {
    const p = await db.payment.create({
      data: { ...input, margin: input.margin ?? 0, status: "reserviert", providerRef: ref() },
    });
    return { id: p.id };
  },
  async release(paymentId) {
    await db.payment.update({ where: { id: paymentId }, data: { status: "freigegeben", releasedAt: new Date() } });
  },
  async payout(paymentId) {
    await db.payment.update({ where: { id: paymentId }, data: { status: "ausgezahlt", paidOutAt: new Date() } });
  },
  async refund(paymentId) {
    await db.payment.update({ where: { id: paymentId }, data: { status: "erstattet" } });
  },
};
