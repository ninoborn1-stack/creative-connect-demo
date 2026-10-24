"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getBalance } from "@/lib/points";
import { notify, sendMail } from "@/lib/services/mail";

type Result = { ok: true; message?: string } | { ok: false; error: string };

export async function redeemReward(rewardId: string): Promise<Result> {
  const user = await requireUser();
  const reward = await db.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) return { ok: false, error: "Diese Belohnung ist nicht mehr verfügbar." };
  if (reward.stock !== null && reward.stock <= 0) return { ok: false, error: "Leider vergriffen." };
  const balance = await getBalance(user.id);
  if (balance < reward.cost) return { ok: false, error: `Dir fehlen noch ${reward.cost - balance} Punkte.` };

  await db.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.create({ data: { rewardId: reward.id, userId: user.id } });
    await tx.pointEvent.create({ data: { userId: user.id, points: -reward.cost, kind: "einloesung", reason: `Eingelöst: ${reward.title}`, refId: redemption.id } });
    if (reward.stock !== null) await tx.reward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } });
  });

  // Nesto (Admins) kümmert sich um die Einlösung
  const admins = await db.user.findMany({ where: { isAdmin: true } });
  for (const a of admins) {
    await notify(a.id, `Einlösung: ${reward.title}`, `${user.name} hat „${reward.title}“ für ${reward.cost} Punkte eingelöst.`, "/punkte");
    await sendMail(a.email, `Neue Einlösung: ${reward.title}`, `${user.name} (${user.email}) hat „${reward.title}“ für ${reward.cost} Punkte eingelöst.\n\nBitte melde dich zur Abstimmung. Unter /punkte kannst du die Einlösung als erledigt markieren.`);
  }
  await sendMail(user.email, `Eingelöst: ${reward.title}`, `Hallo ${user.name.split(" ")[0]},\n\ndu hast „${reward.title}“ für ${reward.cost} Punkte eingelöst. Nesto meldet sich bei dir, um alles abzustimmen.\n\nDein Creative-Connect-Team`);

  revalidatePath("/punkte");
  revalidatePath("/dashboard");
  return { ok: true, message: `„${reward.title}“ eingelöst – Nesto meldet sich bei dir.` };
}

export async function completeRedemption(redemptionId: string): Promise<Result> {
  const user = await requireUser();
  if (!user.isAdmin) return { ok: false, error: "Nur Nesto kann Einlösungen abschließen." };
  const r = await db.rewardRedemption.findUnique({ where: { id: redemptionId }, include: { reward: true } });
  if (!r) return { ok: false, error: "Einlösung nicht gefunden." };
  if (r.status === "eingeloest") return { ok: false, error: "Schon erledigt." };
  await db.rewardRedemption.update({ where: { id: r.id }, data: { status: "eingeloest" } });
  await notify(r.userId, `Erledigt: ${r.reward.title}`, "Deine Belohnung wurde eingelöst. Viel Spaß damit!", "/punkte");
  revalidatePath("/punkte");
  return { ok: true, message: "Als eingelöst markiert." };
}
