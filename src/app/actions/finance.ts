"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify } from "@/lib/services/mail";

export type SignState = { error?: string; ok?: boolean } | undefined;

// Wer welche Seite unterschreiben darf: Projektbesitzer:in → A, Crew-Mitglied → B, Admin (Demo) → beide
export async function signContract(_: SignState, formData: FormData): Promise<SignState> {
  const user = await requireUser();
  const contractId = String(formData.get("contractId") ?? "");
  const side = String(formData.get("side") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const agreed = formData.get("agree") === "on";

  if (side !== "A" && side !== "B") return { error: "Unbekannte Vertragsseite." };
  if (!agreed) return { error: "Bitte bestätige mit „Ich stimme zu“." };
  if (name.length < 2) return { error: "Bitte gib deinen vollständigen Namen ein." };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { id: true, title: true, ownerId: true, roles: { select: { assigneeId: true } } } } },
  });
  if (!contract) return { error: "Vertrag nicht gefunden." };

  const isOwner = contract.project?.ownerId === user.id;
  const isCrew = !!contract.project?.roles.some((r) => r.assigneeId === user.id);
  const allowed = user.isAdmin || (side === "A" ? isOwner : isCrew);
  if (!allowed) return { error: side === "A" ? "Nur die Auftraggeber:in kann Seite A unterschreiben." : "Nur Crew-Mitglieder können Seite B unterschreiben." };
  if (side === "A" ? contract.signedA : contract.signedB) return { error: "Diese Seite ist bereits unterschrieben." };

  await db.contract.update({
    where: { id: contract.id },
    data: {
      ...(side === "A" ? { signedA: true, signedAName: name } : { signedB: true, signedBName: name }),
      signedAt: new Date(),
    },
  });

  // Gegenseite informieren
  const href = `/finanzen/vertraege/${contract.id}`;
  if (contract.project) {
    if (side === "B" && contract.project.ownerId !== user.id) {
      await notify(contract.project.ownerId, "Vertrag unterschrieben", `${name} hat „${contract.title}“ unterschrieben.`, href);
    }
    if (side === "A") {
      const crew = [...new Set(contract.project.roles.map((r) => r.assigneeId).filter((id): id is string => !!id && id !== user.id))];
      for (const id of crew) await notify(id, "Vertrag unterschrieben", `${name} hat „${contract.title}“ unterschrieben.`, href);
    }
  }

  revalidatePath(href);
  revalidatePath("/finanzen");
  if (contract.project) revalidatePath(`/projekte/${contract.project.id}`);
  return { ok: true };
}
