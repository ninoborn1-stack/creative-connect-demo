"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";
import { formatEur } from "@/lib/format";
import { completeCrewIfReady } from "@/lib/crew";

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

async function loadOwnRequest(requestId: string, userId: string) {
  const request = await db.request.findUnique({
    where: { id: requestId },
    include: { project: { include: { owner: true } }, role: true, creative: true },
  });
  if (!request || request.creativeId !== userId) return null;
  return request;
}

function revalidateRequestPaths(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/projekte/${projectId}`);
  revalidatePath("/projekte");
}

// Kreative:r nimmt eine Anfrage an → Rolle besetzt, Auftraggeber:in wird informiert.
export async function acceptRequest(requestId: string): Promise<ActionState> {
  const user = await requireUser();
  const request = await loadOwnRequest(requestId, user.id);
  if (!request) return { error: "Anfrage nicht gefunden." };
  if (!["offen", "gegenangebot"].includes(request.status)) return { error: "Diese Anfrage ist nicht mehr offen." };
  if (request.role.assigneeId && request.role.assigneeId !== user.id) return { error: "Die Rolle ist inzwischen anderweitig besetzt." };

  await db.$transaction([
    db.request.update({ where: { id: request.id }, data: { status: "angenommen" } }),
    db.projectRole.update({ where: { id: request.roleId }, data: { assigneeId: user.id } }),
    // parallele Anfragen für dieselbe Rolle werden zurückgezogen
    db.request.updateMany({
      where: { roleId: request.roleId, id: { not: request.id }, status: { in: ["offen", "gegenangebot"] } },
      data: { status: "zurueckgezogen" },
    }),
  ]);

  const text = `${user.name} hat die Anfrage für „${request.role.title}“ im Projekt „${request.project.title}“ angenommen (${formatEur(request.price)}).`;
  await notify(request.project.ownerId, "Anfrage angenommen", text, `/projekte/${request.projectId}`);
  await sendMail(
    request.project.owner.email,
    `Zusage: ${request.role.title} – ${request.project.title}`,
    `Hallo ${request.project.owner.name},\n\n${text}\n\nDu findest alle Details im Projektraum.\n\nDein Creative-Connect-Team`,
  );
  const crewComplete = await completeCrewIfReady(request.projectId);
  revalidateRequestPaths(request.projectId);
  revalidatePath("/finanzen");
  return {
    ok: true,
    message: crewComplete
      ? "Angenommen – die Crew ist jetzt vollständig, Vertrag und Zahlung sind vorbereitet."
      : "Anfrage angenommen – die Auftraggeber:in wurde informiert.",
  };
}

export async function declineRequest(requestId: string): Promise<ActionState> {
  const user = await requireUser();
  const request = await loadOwnRequest(requestId, user.id);
  if (!request) return { error: "Anfrage nicht gefunden." };
  if (!["offen", "gegenangebot"].includes(request.status)) return { error: "Diese Anfrage ist nicht mehr offen." };

  await db.request.update({ where: { id: request.id }, data: { status: "abgelehnt" } });
  const text = `${user.name} hat die Anfrage für „${request.role.title}“ im Projekt „${request.project.title}“ abgelehnt.`;
  await notify(request.project.ownerId, "Anfrage abgelehnt", text, `/projekte/${request.projectId}`);
  await sendMail(
    request.project.owner.email,
    `Absage: ${request.role.title} – ${request.project.title}`,
    `Hallo ${request.project.owner.name},\n\n${text} Im Verzeichnis findest du passende Alternativen.\n\nDein Creative-Connect-Team`,
  );
  revalidateRequestPaths(request.projectId);
  return { ok: true, message: "Anfrage abgelehnt." };
}

export async function counterOffer(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const price = Math.round(Number(formData.get("price")));
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isFinite(price) || price < 50) return { error: "Bitte gib einen Preis ab 50 € an." };

  const request = await loadOwnRequest(requestId, user.id);
  if (!request) return { error: "Anfrage nicht gefunden." };
  if (!["offen", "gegenangebot"].includes(request.status)) return { error: "Diese Anfrage ist nicht mehr offen." };

  await db.request.update({
    where: { id: request.id },
    data: { status: "gegenangebot", counterPrice: price, note: note || request.note },
  });
  const text = `${user.name} macht für „${request.role.title}“ (${request.project.title}) ein Gegenangebot: ${formatEur(price)} statt ${formatEur(request.price)}.`;
  await notify(request.project.ownerId, "Neues Gegenangebot", text, `/projekte/${request.projectId}`);
  await sendMail(
    request.project.owner.email,
    `Gegenangebot: ${request.role.title} – ${request.project.title}`,
    `Hallo ${request.project.owner.name},\n\n${text}${note ? `\n\nNachricht: „${note}“` : ""}\n\nDein Creative-Connect-Team`,
  );
  revalidateRequestPaths(request.projectId);
  return { ok: true, message: "Gegenangebot gesendet." };
}

// Auftraggeber:in fragt eine Person für eine offene Rolle an („Zur Crew hinzufügen“ / „Anfragen“).
export async function sendCrewRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const roleId = String(formData.get("roleId") ?? "");
  const creativeId = String(formData.get("creativeId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!roleId) return { error: "Bitte wähle eine Rolle aus." };
  if (creativeId === user.id) return { error: "Du kannst dich nicht selbst anfragen." };

  const role = await db.projectRole.findUnique({ where: { id: roleId }, include: { project: true } });
  if (!role || role.project.ownerId !== user.id) return { error: "Rolle nicht gefunden." };
  if (role.assigneeId) return { error: "Diese Rolle ist bereits besetzt." };

  const creative = await db.user.findUnique({ where: { id: creativeId } });
  if (!creative || !creative.isCreative || creative.status === "gesperrt") return { error: "Person nicht gefunden." };

  const existing = await db.request.findFirst({
    where: { roleId, creativeId, status: { in: ["offen", "gegenangebot"] } },
  });
  if (existing) return { error: `${creative.name} ist für diese Rolle bereits angefragt.` };

  await db.request.create({
    data: {
      projectId: role.projectId, roleId, creativeId, price: role.budget, status: "offen",
      note: note || `Hast du Lust auf „${role.project.title}“?`,
    },
  });
  if (role.project.status === "entwurf") {
    await db.project.update({ where: { id: role.projectId }, data: { status: "anfragen" } });
  }

  const sender = user.company ?? user.name;
  const text = `${sender} fragt dich als „${role.title}“ für „${role.project.title}“ an (${formatEur(role.budget)}).`;
  await notify(creative.id, "Neue Anfrage", text, "/dashboard");
  await sendMail(
    creative.email,
    `Neue Anfrage: ${role.project.title}`,
    `Hallo ${creative.name.split(" ")[0]},\n\n${text}${note ? `\n\nNachricht: „${note}“` : ""}\n\nÖffne Creative Connect, um anzunehmen, abzulehnen oder ein Gegenangebot zu machen. Du entscheidest frei.\n\nDein Creative-Connect-Team`,
  );
  revalidateRequestPaths(role.projectId);
  return { ok: true, message: `Anfrage an ${creative.name} gesendet.` };
}
