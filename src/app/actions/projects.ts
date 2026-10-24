"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/session";
import { payments } from "@/lib/services/payments";
import { notify, sendMail } from "@/lib/services/mail";
import { storeFile } from "@/lib/services/storage";
import { completeCrewIfReady } from "@/lib/crew";
import { formatEur } from "@/lib/format";
import { awardActivityPoints } from "@/lib/points";
import { POINT_RULES } from "@/lib/constants";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const ACTIVE_REQUEST = ["offen", "gegenangebot"];

function refresh(projectId: string) {
  revalidatePath(`/projekte/${projectId}`);
  revalidatePath("/projekte");
  revalidatePath("/dashboard");
}

async function loadProject(projectId: string) {
  return db.project.findUnique({ where: { id: projectId }, include: { owner: true, roles: { include: { assignee: true } } } });
}

type LoadedProject = NonNullable<Awaited<ReturnType<typeof loadProject>>>;

async function asOwner(projectId: string): Promise<{ user: CurrentUser; project: LoadedProject } | null> {
  const user = await requireUser();
  const project = await loadProject(projectId);
  if (!project || (project.ownerId !== user.id && !user.isAdmin)) return null;
  return { user, project };
}

async function asMember(projectId: string): Promise<{ user: CurrentUser; project: LoadedProject } | null> {
  const user = await requireUser();
  const project = await loadProject(projectId);
  if (!project) return null;
  const member = project.ownerId === user.id || user.isAdmin || project.roles.some((r) => r.assigneeId === user.id);
  return member ? { user, project } : null;
}

const ownerLabel = (owner: { company: string | null; name: string }) => owner.company ?? owner.name;

async function notifyAdmins(title: string, body: string, href: string) {
  const admins = await db.user.findMany({ where: { isAdmin: true } });
  for (const a of admins) {
    await notify(a.id, title, body, href);
    await sendMail(a.email, title, body);
  }
}

// ---------- Crew-Builder ----------

export async function requestCreative(projectId: string, roleId: string, creativeId: string): Promise<Result> {
  const ctx = await asOwner(projectId);
  if (!ctx) return { ok: false, error: "Nur die Auftraggeber:in kann Anfragen senden." };
  const { project } = ctx;
  if (["abgeschlossen", "storniert"].includes(project.status)) return { ok: false, error: "Das Projekt ist bereits beendet." };
  const role = project.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rolle nicht gefunden." };
  if (role.assigneeId) return { ok: false, error: "Diese Rolle ist bereits besetzt." };
  if (creativeId === project.ownerId) return { ok: false, error: "Du kannst dich nicht selbst anfragen." };
  const creative = await db.user.findUnique({ where: { id: creativeId } });
  if (!creative || !creative.isCreative || creative.status === "gesperrt") return { ok: false, error: "Diese Person kann gerade nicht angefragt werden." };
  const existing = await db.request.findFirst({ where: { roleId, creativeId, status: { in: ACTIVE_REQUEST } } });
  if (existing) return { ok: false, error: `${creative.name} ist für diese Rolle bereits angefragt.` };

  await db.request.create({
    data: { projectId, roleId, creativeId, price: role.budget, status: "offen", note: `Anfrage als ${role.title} für „${project.title}“.` },
  });
  if (project.status === "entwurf" && project.type === "self") await db.project.update({ where: { id: projectId }, data: { status: "anfragen" } });
  const from = ownerLabel(project.owner);
  await notify(creative.id, "Neue Anfrage", `${from} fragt dich als ${role.title} für „${project.title}“ an (${formatEur(role.budget)}).`, "/dashboard");
  await sendMail(
    creative.email,
    `Neue Anfrage: ${project.title}`,
    `Hallo ${creative.name.split(" ")[0]},\n\n${from} möchte dich als ${role.title} für „${project.title}“ anfragen. Honorar: ${formatEur(role.budget)}.\n\nDu entscheidest frei: annehmen, ablehnen oder Gegenangebot.\n\nDein Creative-Connect-Team`,
  );
  refresh(projectId);
  return { ok: true, message: `${creative.name} wurde als ${role.title} angefragt.` };
}

export async function withdrawRequest(requestId: string): Promise<Result> {
  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Anfrage nicht gefunden." };
  const ctx = await asOwner(request.projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  if (!ACTIVE_REQUEST.includes(request.status)) return { ok: false, error: "Die Anfrage ist nicht mehr offen." };
  await db.request.update({ where: { id: requestId }, data: { status: "zurueckgezogen" } });
  await notify(request.creativeId, "Anfrage zurückgezogen", `Die Anfrage für „${ctx.project.title}“ wurde zurückgezogen.`, "/dashboard");
  refresh(request.projectId);
  return { ok: true, message: "Anfrage zurückgezogen." };
}

// Anfrage annehmen: Rolle besetzen, andere offene Anfragen der Rolle zurückziehen, ggf. Crew abschließen.
async function acceptRequest(requestId: string, useCounterPrice: boolean): Promise<Result> {
  const request = await db.request.findUnique({ where: { id: requestId }, include: { role: true, creative: true } });
  if (!request) return { ok: false, error: "Anfrage nicht gefunden." };
  const ctx = await asOwner(request.projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  if (request.role.assigneeId) return { ok: false, error: "Die Rolle ist bereits besetzt." };
  if (!ACTIVE_REQUEST.includes(request.status)) return { ok: false, error: "Die Anfrage ist nicht mehr offen." };

  const price = useCounterPrice && request.counterPrice ? request.counterPrice : request.price;
  await db.request.update({ where: { id: requestId }, data: { status: "angenommen", price } });
  await db.projectRole.update({ where: { id: request.roleId }, data: { assigneeId: request.creativeId } });
  const others = await db.request.findMany({ where: { roleId: request.roleId, id: { not: requestId }, status: { in: ACTIVE_REQUEST } } });
  await db.request.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { status: "zurueckgezogen" } });
  for (const o of others) await notify(o.creativeId, "Rolle vergeben", `Die Rolle ${request.role.title} in „${ctx.project.title}“ ist inzwischen besetzt. Danke für deine Zeit!`, "/dashboard");

  await notify(request.creativeId, "Du bist dabei", `Du bist als ${request.role.title} für „${ctx.project.title}“ bestätigt (${formatEur(price)}).`, `/projekte/${request.projectId}`);
  await sendMail(request.creative.email, `Bestätigt: ${ctx.project.title}`, `Hallo ${request.creative.name.split(" ")[0]},\n\ndu bist als ${request.role.title} für „${ctx.project.title}“ bestätigt. Honorar: ${formatEur(price)}.\n\nDein Creative-Connect-Team`);

  const completed = await completeCrewIfReady(request.projectId);
  refresh(request.projectId);
  return { ok: true, message: completed ? "Crew vollständig – Vertrag angelegt, Zahlungen reserviert." : `${request.creative.name} ist als ${request.role.title} bestätigt.` };
}

export async function acceptCounterOffer(requestId: string) {
  return acceptRequest(requestId, true);
}

export async function rejectCounterOffer(requestId: string): Promise<Result> {
  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Anfrage nicht gefunden." };
  const ctx = await asOwner(request.projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  if (request.status !== "gegenangebot") return { ok: false, error: "Kein offenes Gegenangebot." };
  await db.request.update({ where: { id: requestId }, data: { status: "abgelehnt" } });
  await notify(request.creativeId, "Gegenangebot abgelehnt", `Dein Gegenangebot für „${ctx.project.title}“ wurde abgelehnt.`, "/dashboard");
  refresh(request.projectId);
  return { ok: true, message: "Gegenangebot abgelehnt." };
}

// Demo-Abkürzung: simuliert die Zusage der angefragten Person
export async function simulateAccept(requestId: string) {
  return acceptRequest(requestId, false);
}

export async function simulateAllAccepts(projectId: string): Promise<Result> {
  const ctx = await asOwner(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  let count = 0;
  for (const role of ctx.project.roles.filter((r) => !r.assigneeId)) {
    const first = await db.request.findFirst({ where: { roleId: role.id, status: { in: ACTIVE_REQUEST } }, orderBy: { createdAt: "asc" } });
    if (first) {
      const res = await acceptRequest(first.id, first.status === "gegenangebot");
      if (res.ok) count++;
    }
  }
  refresh(projectId);
  return count ? { ok: true, message: `${count} Zusage(n) simuliert.` } : { ok: false, error: "Keine offenen Anfragen vorhanden." };
}

export async function setProjectType(projectId: string, type: "self" | "managed"): Promise<Result> {
  const ctx = await asOwner(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const { project } = ctx;
  if (!["entwurf", "anfragen"].includes(project.status)) return { ok: false, error: "Nach Bestätigung der Crew kann der Typ nicht mehr geändert werden." };
  if (project.type === type) return { ok: true };
  if (type === "managed") {
    await db.project.update({ where: { id: projectId }, data: { type: "managed", managedStage: "anfrage" } });
    await notifyAdmins("Managed-Crew-Anfrage", `${ownerLabel(project.owner)} möchte für „${project.title}“ eine Managed Crew (Budget ${formatEur(project.budget)}).`, "/admin/managed");
  } else {
    await db.project.update({ where: { id: projectId }, data: { type: "self", managedStage: null, status: project.status === "entwurf" ? "anfragen" : project.status } });
  }
  refresh(projectId);
  return { ok: true, message: type === "managed" ? "Managed Crew angefragt – Nesto meldet sich mit einem Angebot." : "Zurück auf Self-Service." };
}

// ---------- Status ----------

const TRANSITIONS: Record<string, string> = { bestaetigt: "produktion", produktion: "abnahme" };

export async function advanceProjectStatus(projectId: string): Promise<Result> {
  const ctx = await asOwner(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const { project } = ctx;
  const next = TRANSITIONS[project.status];
  if (!next) return { ok: false, error: "Für diesen Status gibt es keinen nächsten Schritt." };
  await db.project.update({ where: { id: projectId }, data: { status: next, ...(project.type === "managed" && next === "produktion" ? { managedStage: "produktion" } : {}) } });
  if (next === "produktion") await db.milestone.updateMany({ where: { projectId, title: "Vorproduktion" }, data: { done: true } });
  if (next === "abnahme") await db.milestone.updateMany({ where: { projectId, title: { in: ["Vorproduktion", "Dreh / Session", "Erste Fassung"] } }, data: { done: true } });
  const label = next === "produktion" ? "Produktion gestartet" : "Bereit zur Abnahme";
  for (const r of project.roles) if (r.assigneeId) await notify(r.assigneeId, label, `„${project.title}“: ${label}.`, `/projekte/${projectId}`);
  refresh(projectId);
  return { ok: true, message: label };
}

// ---------- Zeitplan, Chat, Dateien ----------

export async function toggleMilestone(milestoneId: string): Promise<Result> {
  const m = await db.milestone.findUnique({ where: { id: milestoneId } });
  if (!m) return { ok: false, error: "Meilenstein nicht gefunden." };
  if (!(await asMember(m.projectId))) return { ok: false, error: "Keine Berechtigung." };
  await db.milestone.update({ where: { id: milestoneId }, data: { done: !m.done } });
  refresh(m.projectId);
  return { ok: true };
}

export async function addMilestone(projectId: string, formData: FormData): Promise<Result> {
  if (!(await asMember(projectId))) return { ok: false, error: "Keine Berechtigung." };
  const title = String(formData.get("title") ?? "").trim();
  const due = String(formData.get("dueDate") ?? "");
  if (title.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return { ok: false, error: "Bitte Titel und Datum angeben." };
  await db.milestone.create({ data: { projectId, title: title.slice(0, 120), dueDate: new Date(`${due}T12:00:00`) } });
  refresh(projectId);
  return { ok: true, message: "Meilenstein hinzugefügt." };
}

export async function sendProjectMessage(projectId: string, formData: FormData): Promise<Result> {
  const ctx = await asMember(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Die Nachricht ist leer." };
  await db.message.create({ data: { projectId, authorId: ctx.user.id, body: body.slice(0, 2000) } });
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true };
}

export async function uploadProjectFile(projectId: string, formData: FormData): Promise<Result> {
  const ctx = await asMember(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Bitte wähle eine Datei aus." };
  if (file.size > 900 * 1024) return { ok: false, error: "In der Demo sind Dateien bis 900 KB möglich." };
  const stored = await storeFile(file);
  await db.file.create({ data: { projectId, uploaderId: ctx.user.id, name: file.name.slice(0, 160), sizeKb: stored.sizeKb, url: stored.url } });
  revalidatePath(`/projekte/${projectId}`);
  return { ok: true, message: `${file.name} hochgeladen.` };
}

// ---------- Abnahme, Bewertung, Streitfall ----------

export async function acceptDelivery(projectId: string): Promise<Result> {
  const ctx = await asOwner(projectId);
  if (!ctx) return { ok: false, error: "Nur die Auftraggeber:in kann abnehmen." };
  const { project } = ctx;
  if (!["produktion", "abnahme"].includes(project.status)) return { ok: false, error: "Die Abnahme ist erst in Produktion oder Abnahme möglich." };

  const list = await db.payment.findMany({ where: { projectId } });
  for (const p of list) {
    if (p.status === "reserviert") await payments.release(p.id);
    if (p.status === "reserviert" || p.status === "freigegeben") await payments.payout(p.id); // Demo: Auszahlung sofort
  }
  await db.project.update({ where: { id: projectId }, data: { status: "abgeschlossen" } });
  await db.milestone.updateMany({ where: { projectId }, data: { done: true } });

  const year = new Date().getFullYear();
  const paid = new Map(list.map((p) => [p.payeeId, p.amount]));
  for (const r of project.roles) {
    if (!r.assignee) continue;
    const has = await db.credit.findFirst({ where: { userId: r.assignee.id, projectId, role: r.title } });
    if (!has) await db.credit.create({ data: { userId: r.assignee.id, projectId, title: project.title, role: r.title, year } });
    await awardActivityPoints(r.assignee.id, "projekt", projectId, `${POINT_RULES.projekt.label}: ${project.title}`);
    await notify(r.assignee.id, "Abnahme erteilt – Auszahlung", `„${project.title}“ wurde abgenommen. Dein Honorar wurde ausgezahlt.`, "/finanzen");
    await sendMail(
      r.assignee.email,
      `Abnahme erteilt: ${project.title}`,
      `Hallo ${r.assignee.name.split(" ")[0]},\n\n${ownerLabel(project.owner)} hat „${project.title}“ abgenommen. ${paid.get(r.assignee.id) ? `${formatEur(paid.get(r.assignee.id)!)} ` : "Dein Honorar "}wurde an dich ausgezahlt (Demo). Das Projekt steht jetzt in deinen Credits.\n\nBewerte gern die Zusammenarbeit im Projektraum.\n\nDein Creative-Connect-Team`,
    );
  }
  await sendMail(project.owner.email, `Abnahme bestätigt: ${project.title}`, `Hallo ${project.owner.name.split(" ")[0]},\n\ndanke für deine Abnahme. Alle Zahlungen wurden freigegeben und an die Crew ausgezahlt.\n\nDein Creative-Connect-Team`);
  refresh(projectId);
  revalidatePath("/finanzen");
  return { ok: true, message: `Abnahme erteilt – Zahlungen freigegeben und ausgezahlt. Die Crew bekommt je +${POINT_RULES.projekt.points} Punkte.` };
}

export async function submitReviews(projectId: string, reviews: { targetId: string; rating: number; text: string }[]): Promise<Result> {
  const ctx = await asMember(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const { user, project } = ctx;
  if (project.status !== "abgeschlossen") return { ok: false, error: "Bewertungen sind nach Abschluss möglich." };
  const isOwner = project.ownerId === user.id;
  const allowed = new Set(isOwner ? project.roles.map((r) => r.assigneeId).filter((x): x is string => !!x) : [project.ownerId]);
  allowed.delete(user.id);

  let created = 0;
  let points = 0;
  for (const r of reviews) {
    const rating = Math.round(r.rating);
    if (!allowed.has(r.targetId) || rating < 1 || rating > 5) continue;
    const exists = await db.review.findFirst({ where: { projectId, authorId: user.id, targetId: r.targetId } });
    if (exists) continue;
    const review = await db.review.create({ data: { projectId, authorId: user.id, targetId: r.targetId, rating, text: r.text.trim().slice(0, 1000) || "Gerne wieder!" } });
    points += await awardActivityPoints(user.id, "bewertung", review.id);
    const agg = await db.review.aggregate({ where: { targetId: r.targetId }, _avg: { rating: true }, _count: true });
    await db.profile.updateMany({ where: { userId: r.targetId }, data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count } });
    await notify(r.targetId, "Neue Bewertung", `${user.name} hat dich für „${project.title}“ mit ${rating} Sternen bewertet.`, `/projekte/${projectId}`);
    created++;
  }
  refresh(projectId);
  return created ? { ok: true, message: `${created} Bewertung(en) gespeichert. Danke!${points ? ` +${points} Punkte` : ""}` } : { ok: false, error: "Bitte vergib mindestens eine Sternebewertung." };
}

export async function openDispute(projectId: string, formData: FormData): Promise<Result> {
  const ctx = await asMember(projectId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 10) return { ok: false, error: "Beschreibe das Problem bitte in ein, zwei Sätzen." };
  const by = ctx.project.ownerId === ctx.user.id ? ownerLabel(ctx.project.owner) : ctx.user.name;
  await db.dispute.create({
    data: { projectId, openedBy: by, reason: reason.slice(0, 2000), log: JSON.stringify([{ at: new Date().toISOString(), by, text: "Streitfall eröffnet." }]) },
  });
  await notifyAdmins("Neuer Streitfall", `${by} hat für „${ctx.project.title}“ ein Problem gemeldet: ${reason.slice(0, 140)}`, "/admin/streitfaelle");
  refresh(projectId);
  revalidatePath("/admin/streitfaelle");
  return { ok: true, message: "Problem gemeldet – Nesto kümmert sich darum. Zahlungen bleiben bis zur Klärung reserviert." };
}
