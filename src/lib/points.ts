import "server-only";
import { db } from "@/lib/db";
import { levelFor } from "@/lib/constants";
import { notify } from "@/lib/services/mail";

// Punkte gutschreiben (Journal-Eintrag + Benachrichtigung). Doppelte Gutschrift pro refId+kind wird verhindert.
export async function awardPoints(userId: string, points: number, kind: string, reason: string, refId?: string) {
  if (refId) {
    const existing = await db.pointEvent.findFirst({ where: { userId, kind, refId } });
    if (existing) return null;
  }
  const before = await getBalance(userId);
  const event = await db.pointEvent.create({ data: { userId, points, kind, reason, refId } });
  const after = before + points;
  const lvBefore = levelFor(before).level.key;
  const lv = levelFor(after).level;
  await notify(userId, `+${points} Punkte`, reason, "/punkte");
  if (lv.key !== lvBefore && points > 0) await notify(userId, "Neues Level!", `Du bist jetzt „${lv.label}“ im Creative-Connect-Netzwerk.`, "/punkte");
  return event;
}

export async function getBalance(userId: string) {
  const agg = await db.pointEvent.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}
