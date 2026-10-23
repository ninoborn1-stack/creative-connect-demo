"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, requireAdmin } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { MANAGED_STAGES, MARKETPLACE_MODES } from "@/lib/constants";
import { notify, sendMail } from "@/lib/services/mail";
import { payments } from "@/lib/services/payments";
import { formatEur, parseJson } from "@/lib/format";
import { runSeed } from "@/lib/seed/run";
import { BLOCK_REASONS, DEFAULT_INVITE_QUOTA, DISPUTE_RESOLUTION_LABEL, type ActionResult } from "@/components/admin/admin-constants";

async function audit(actor: string, action: string, target: string, detail?: string) {
  await db.auditLog.create({ data: { actor, action, target, detail } });
}

const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (error: string): ActionResult => ({ ok: false, error });

function inviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CC-${part()}-${part()}`;
}

// ---------------------------------------------------------------- Demo zurücksetzen

export async function resetDemo(): Promise<ActionResult> {
  await requireAdmin();
  await runSeed(db);
  // Alle IDs sind neu – Session für den Demo-Admin neu ausstellen
  const admin = await db.user.findUnique({ where: { email: "admin@demo.cc" } });
  if (admin) await createSession(admin.id);
  revalidatePath("/", "layout");
  return ok("Demo zurückgesetzt – alle Daten sind wieder im Ausgangszustand.");
}

// ---------------------------------------------------------------- Mitglieder

async function loadMember(userId: string) {
  return db.user.findUnique({ where: { id: userId }, include: { profile: true } });
}

export async function approveMember(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const user = await loadMember(userId);
  if (!user) return fail("Mitglied nicht gefunden.");
  if (user.status !== "eingeladen") return fail("Nur eingeladene Personen können freigegeben werden.");
  await db.user.update({ where: { id: userId }, data: { status: "aktiv" } });
  await audit(admin.name, "Mitglied freigegeben", user.name);
  await notify(userId, "Willkommen im Netzwerk", "Dein Profil wurde freigegeben. Du kannst jetzt Projekte starten und angefragt werden.", "/dashboard");
  await sendMail(user.email, "Dein Zugang ist freigegeben", `Hallo ${user.name},\n\ndein Profil bei Creative Connect wurde freigegeben. Viel Spaß im Netzwerk!\n\nDein Creative-Connect-Team`);
  revalidatePath("/admin/mitglieder");
  return ok(`${user.name} ist jetzt aktiv.`);
}

export async function verifyMember(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const user = await loadMember(userId);
  if (!user) return fail("Mitglied nicht gefunden.");
  if (user.status === "gesperrt") return fail("Gesperrte Mitglieder bitte zuerst entsperren.");
  await db.user.update({ where: { id: userId }, data: { status: "verifiziert" } });
  await db.profile.updateMany({ where: { userId }, data: { verified: true } });
  await audit(admin.name, "Mitglied verifiziert", user.name);
  await notify(userId, "Du bist verifiziert", "Dein Profil trägt jetzt das Badge „Verifiziert“.", user.profile ? `/mitglieder/${user.profile.slug}` : "/dashboard");
  await sendMail(user.email, "Dein Profil ist verifiziert", `Hallo ${user.name},\n\nwir haben dein Profil geprüft – es trägt ab sofort das Badge „Verifiziert“.\n\nDein Creative-Connect-Team`);
  revalidatePath("/admin/mitglieder");
  return ok(`${user.name} ist jetzt verifiziert.`);
}

export async function blockMember(userId: string, reasonKey: string, note: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const reason = BLOCK_REASONS.find((r) => r.key === reasonKey);
  const text = note.trim();
  if (!reason) return fail("Bitte einen Sperrgrund auswählen.");
  if (text.length < 10) return fail("Bitte die Sperre kurz begründen (mind. 10 Zeichen).");
  if (userId === admin.id) return fail("Du kannst dich nicht selbst sperren.");
  const user = await loadMember(userId);
  if (!user) return fail("Mitglied nicht gefunden.");
  if (user.isAdmin) return fail("Admins können nicht gesperrt werden.");
  const blockReason = `${reason.label}: ${text}`;
  await db.user.update({ where: { id: userId }, data: { status: "gesperrt", blockReason } });
  await audit(admin.name, "Mitglied gesperrt", user.name, blockReason);
  await notify(userId, "Dein Konto wurde gesperrt", `Grund: ${blockReason}`);
  await sendMail(
    user.email,
    "Dein Konto bei Creative Connect wurde gesperrt",
    `Hallo ${user.name},\n\nwir haben dein Konto gesperrt.\n\nGrund (gemäß unseren AGB): ${blockReason}\n\nDu kannst innerhalb von 14 Tagen per Antwort auf diese Mail widersprechen. Wir prüfen jeden Widerspruch persönlich.\n\nDein Creative-Connect-Team`,
  );
  revalidatePath("/admin/mitglieder");
  return ok(`${user.name} wurde gesperrt.`);
}

export async function unblockMember(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const user = await loadMember(userId);
  if (!user) return fail("Mitglied nicht gefunden.");
  if (user.status !== "gesperrt") return fail("Dieses Mitglied ist nicht gesperrt.");
  const status = user.profile?.verified ? "verifiziert" : "aktiv";
  await db.user.update({ where: { id: userId }, data: { status, blockReason: null } });
  await audit(admin.name, "Mitglied entsperrt", user.name);
  await notify(userId, "Dein Konto ist wieder aktiv", "Die Sperre wurde aufgehoben.", "/dashboard");
  await sendMail(user.email, "Dein Konto ist wieder aktiv", `Hallo ${user.name},\n\ndie Sperre deines Kontos wurde aufgehoben. Willkommen zurück!\n\nDein Creative-Connect-Team`);
  revalidatePath("/admin/mitglieder");
  return ok(`${user.name} wurde entsperrt.`);
}

// ---------------------------------------------------------------- Einladungen

export async function createInvite(emailRaw: string, validDays: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  const email = emailRaw.trim().toLowerCase();
  if (email && !z.email().safeParse(email).success) return fail("Bitte eine gültige E-Mail-Adresse angeben.");
  const days = Number.isFinite(validDays) ? Math.min(Math.max(Math.round(validDays), 1), 90) : 30;
  const code = inviteCode();
  await db.invite.create({ data: { code, senderId: admin.id, email: email || null, status: "offen", expiresAt: addDays(new Date(), days) } });
  if (email) {
    await sendMail(email, "Deine Einladung zu Creative Connect", `Hallo,\n\n${admin.name} lädt dich in das Netzwerk von Creative Connect ein. Dein persönlicher Code: ${code}\n\nDer Code ist ${days} Tage gültig.\n\nDein Creative-Connect-Team`);
  }
  await audit(admin.name, "Einladungscode erzeugt", code, email ? `für ${email}` : undefined);
  revalidatePath("/admin/einladungen");
  return ok(email ? `Code ${code} erzeugt und an ${email} gesendet.` : `Code ${code} erzeugt.`);
}

export async function raiseInviteQuota(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return fail("Mitglied nicht gefunden.");
  const row = await db.setting.findUnique({ where: { key: "inviteQuota" } });
  const quota = parseJson<Record<string, number>>(row?.value, {});
  const next = (quota[userId] ?? DEFAULT_INVITE_QUOTA) + 5;
  quota[userId] = next;
  await db.setting.upsert({ where: { key: "inviteQuota" }, update: { value: JSON.stringify(quota) }, create: { key: "inviteQuota", value: JSON.stringify(quota) } });
  await audit(admin.name, "Einladungskontingent erhöht", user.name, `+5 Einladungen (jetzt ${next})`);
  await notify(userId, "Mehr Einladungen für dich", `Du kannst jetzt insgesamt ${next} Personen einladen. Danke, dass du das Netzwerk wachsen lässt!`, "/einladen");
  revalidatePath("/admin/einladungen");
  return ok(`Kontingent von ${user.name} auf ${next} erhöht.`);
}

export async function inviteFromWaitlist(entryId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry) return fail("Eintrag nicht gefunden.");
  if (entry.status !== "wartend") return fail("Dieser Eintrag wurde bereits bearbeitet.");
  const code = inviteCode();
  await db.invite.create({ data: { code, senderId: admin.id, email: entry.email, status: "offen", expiresAt: addDays(new Date(), 30) } });
  await db.waitlistEntry.update({ where: { id: entryId }, data: { status: "eingeladen" } });
  await sendMail(
    entry.email,
    "Du bist eingeladen: Creative Connect",
    `Hallo ${entry.name},\n\ndanke für deine Geduld! Ein Platz im Netzwerk ist frei. Dein persönlicher Einladungscode: ${code}\n\nDer Code ist 30 Tage gültig. Registriere dich unter /registrieren.\n\nDein Creative-Connect-Team`,
  );
  await audit(admin.name, "Warteliste: eingeladen", entry.name, code);
  revalidatePath("/admin/einladungen");
  return ok(`${entry.name} wurde eingeladen (Code ${code}).`);
}

export async function rejectWaitlist(entryId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry) return fail("Eintrag nicht gefunden.");
  if (entry.status !== "wartend") return fail("Dieser Eintrag wurde bereits bearbeitet.");
  await db.waitlistEntry.update({ where: { id: entryId }, data: { status: "abgelehnt" } });
  await audit(admin.name, "Warteliste: abgelehnt", entry.name);
  revalidatePath("/admin/einladungen");
  return ok(`${entry.name} wurde von der Warteliste genommen.`);
}

// ---------------------------------------------------------------- Managed Crews

// Projektstatus je Pipeline-Stufe (vereinfacht)
const STAGE_STATUS: Record<string, string> = { anfrage: "entwurf", angebot: "anfragen", crew: "anfragen", produktion: "produktion" };

export type ManagedOffer = { fee: number; margin: number; marginPct: number; total: number; at: string };

export async function moveManagedStage(projectId: string, direction: 1 | -1): Promise<ActionResult> {
  const admin = await requireAdmin();
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.type !== "managed") return fail("Managed-Projekt nicht gefunden.");
  const idx = MANAGED_STAGES.findIndex((s) => s.key === (project.managedStage ?? "anfrage"));
  const next = MANAGED_STAGES[idx + direction];
  if (!next) return fail("Weiter geht es in dieser Richtung nicht.");
  await db.project.update({ where: { id: projectId }, data: { managedStage: next.key, status: STAGE_STATUS[next.key] } });
  await audit(admin.name, "Managed-Pipeline", project.title, `→ ${next.label}`);
  await notify(project.ownerId, "Deine Managed Crew", `„${project.title}“ ist jetzt in der Phase „${next.label}“.`, `/projekte/${project.id}`);
  revalidatePath("/admin/managed");
  return ok(`„${project.title}“ → ${next.label}`);
}

export async function createManagedOffer(projectId: string, fee: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!Number.isFinite(fee) || fee < 100 || fee > 1_000_000) return fail("Bitte eine Honorarsumme zwischen 100 € und 1.000.000 € angeben.");
  const project = await db.project.findUnique({ where: { id: projectId }, include: { owner: true } });
  if (!project || project.type !== "managed") return fail("Managed-Projekt nicht gefunden.");
  const fees = await getFees();
  const amount = Math.round(fee);
  const margin = Math.round((amount * fees.managedMarginPct) / 100);
  const offer: ManagedOffer = { fee: amount, margin, marginPct: fees.managedMarginPct, total: amount + margin, at: new Date().toISOString() };

  const row = await db.setting.findUnique({ where: { key: "managedOffers" } });
  const offers = parseJson<Record<string, ManagedOffer>>(row?.value, {});
  offers[projectId] = offer;
  await db.setting.upsert({ where: { key: "managedOffers" }, update: { value: JSON.stringify(offers) }, create: { key: "managedOffers", value: JSON.stringify(offers) } });

  const stage = project.managedStage === "anfrage" || !project.managedStage ? "angebot" : project.managedStage;
  await db.project.update({ where: { id: projectId }, data: { managedStage: stage, status: STAGE_STATUS[stage] } });
  const text = `Angebot Managed Crew: Honorare ${formatEur(amount)} + ${fees.managedMarginPct} % Marge ${formatEur(margin)} = ${formatEur(offer.total)} (zzgl. USt.).`;
  await db.message.create({ data: { projectId, authorId: admin.id, body: text } });
  await notify(project.ownerId, "Neues Angebot für deine Managed Crew", text, `/projekte/${project.id}`);
  await sendMail(project.owner.email, `Angebot: ${project.title}`, `Hallo ${project.owner.name},\n\n${text}\n\nDu findest das Angebot im Projektraum.\n\nViele Grüße\n${admin.name}`);
  await audit(admin.name, "Managed-Angebot erstellt", project.title, `${formatEur(offer.total)} gesamt`);
  revalidatePath("/admin/managed");
  return ok(`Angebot über ${formatEur(offer.total)} versendet.`);
}

const managedSchema = z.object({
  ownerId: z.string().min(1, "Bitte Auftraggeber:in wählen."),
  title: z.string().trim().min(3, "Titel ist zu kurz.").max(120),
  budget: z.coerce.number().int().min(500, "Budget mindestens 500 €.").max(1_000_000),
  city: z.string().trim().min(2, "Bitte eine Stadt angeben."),
});

export async function createManagedProject(input: { ownerId: string; title: string; budget: number; city: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = managedSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Eingaben prüfen.");
  const owner = await db.user.findUnique({ where: { id: parsed.data.ownerId } });
  if (!owner?.isClient) return fail("Auftraggeber:in nicht gefunden.");
  const start = addDays(new Date(), 30);
  const project = await db.project.create({
    data: {
      title: parsed.data.title,
      description: `Managed-Crew-Anfrage von ${owner.company ?? owner.name}, angelegt durch das Creative-Connect-Team.`,
      type: "managed",
      status: "entwurf",
      managedStage: "anfrage",
      budget: parsed.data.budget,
      city: parsed.data.city,
      startDate: start,
      endDate: addDays(start, 2),
      coverSeed: `cc-managed-${Date.now()}`,
      ownerId: owner.id,
    },
  });
  await audit(admin.name, "Managed Crew angelegt", project.title, owner.company ?? owner.name);
  await notify(owner.id, "Managed Crew angelegt", `Wir kümmern uns um „${project.title}“ und melden uns mit einem Angebot.`, `/projekte/${project.id}`);
  revalidatePath("/admin/managed");
  return ok(`„${project.title}“ angelegt.`);
}

// ---------------------------------------------------------------- Streitfälle

type LogEntry = { at: string; by: string; text: string };

export async function addDisputeNote(disputeId: string, textRaw: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const text = textRaw.trim();
  if (text.length < 3) return fail("Bitte eine Notiz eingeben.");
  const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) return fail("Streitfall nicht gefunden.");
  const log = parseJson<LogEntry[]>(dispute.log, []);
  log.push({ at: new Date().toISOString(), by: `${admin.name} (Admin)`, text });
  await db.dispute.update({
    where: { id: disputeId },
    data: { log: JSON.stringify(log), status: dispute.status === "offen" ? "in_pruefung" : dispute.status },
  });
  revalidatePath(`/admin/streitfaelle/${disputeId}`);
  revalidatePath("/admin/streitfaelle");
  return ok("Notiz gespeichert.");
}

export async function resolveDispute(disputeId: string, decision: "freigegeben" | "erstattet" | "teilerstattet"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(decision in DISPUTE_RESOLUTION_LABEL)) return fail("Unbekannte Entscheidung.");
  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    include: { project: { include: { payments: true, roles: true } } },
  });
  if (!dispute) return fail("Streitfall nicht gefunden.");
  if (dispute.status === "geloest") return fail("Dieser Streitfall ist bereits entschieden.");

  const open = dispute.project.payments.filter((p) => p.status === "reserviert" || p.status === "freigegeben");
  for (const p of open) {
    if (decision === "erstattet") {
      await payments.refund(p.id);
      continue;
    }
    if (decision === "teilerstattet") {
      // Demo-Vereinfachung: Jede Zahlung wird halbiert. Die eine Hälfte wird ausgezahlt,
      // für die andere Hälfte wird eine eigene Zahlung angelegt und sofort erstattet.
      const half = Math.floor(p.amount / 2);
      const halfFee = Math.floor(p.serviceFee / 2);
      const halfMargin = Math.floor(p.margin / 2);
      await db.payment.update({
        where: { id: p.id },
        data: { amount: p.amount - half, serviceFee: p.serviceFee - halfFee, margin: p.margin - halfMargin, label: `${p.label} (50 % nach Streitfall)` },
      });
      const refund = await payments.reserve({
        projectId: p.projectId ?? undefined, payeeId: p.payeeId ?? undefined, label: `${p.label} (Teilerstattung 50 %)`,
        amount: half, serviceFee: halfFee, margin: halfMargin,
      });
      await payments.refund(refund.id);
    }
    if (p.status === "reserviert") await payments.release(p.id);
    await payments.payout(p.id);
  }

  const label = DISPUTE_RESOLUTION_LABEL[decision];
  const log = parseJson<LogEntry[]>(dispute.log, []);
  log.push({ at: new Date().toISOString(), by: `${admin.name} (Admin)`, text: `Entscheidung: ${label}. ${open.length} Zahlung(en) betroffen.` });
  await db.dispute.update({
    where: { id: disputeId },
    data: { status: "geloest", resolution: decision, resolvedAt: new Date(), log: JSON.stringify(log) },
  });
  await db.project.update({ where: { id: dispute.projectId }, data: { status: decision === "erstattet" ? "storniert" : "abgeschlossen" } });
  await audit(admin.name, "Streitfall entschieden", dispute.project.title, label);

  const involved = new Set<string>([dispute.project.ownerId]);
  for (const r of dispute.project.roles) if (r.assigneeId) involved.add(r.assigneeId);
  for (const p of dispute.project.payments) if (p.payeeId) involved.add(p.payeeId);
  for (const userId of involved) {
    await notify(userId, "Streitfall entschieden", `„${dispute.project.title}“: ${label}.`, `/projekte/${dispute.projectId}`);
  }
  revalidatePath(`/admin/streitfaelle/${disputeId}`);
  revalidatePath("/admin/streitfaelle");
  return ok(`Entschieden: ${label}.`);
}

// ---------------------------------------------------------------- Einstellungen

export async function setMarketplaceMode(mode: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entry = MARKETPLACE_MODES.find((m) => m.key === mode);
  if (!entry) return fail("Unbekannter Modus.");
  await db.setting.upsert({ where: { key: "marketplaceMode" }, update: { value: entry.key }, create: { key: "marketplaceMode", value: entry.key } });
  await audit(admin.name, "Marktplatz-Modus gesetzt", entry.key, entry.label);
  revalidatePath("/", "layout");
  return ok(`Marktplatz-Modus: ${entry.label}`);
}

const feesSchema = z.object({
  serviceFeePct: z.coerce.number().min(0, "Servicegebühr: mind. 0 %").max(30, "Servicegebühr: max. 30 %"),
  proPriceEur: z.coerce.number().min(0, "Pro-Abo: mind. 0 €").max(200, "Pro-Abo: max. 200 €"),
  managedMarginPct: z.coerce.number().min(0, "Managed-Marge: mind. 0 %").max(50, "Managed-Marge: max. 50 %"),
  kskRatePct: z.coerce.number().min(0, "KSK-Satz: mind. 0 %").max(20, "KSK-Satz: max. 20 %"),
  kskThresholdEur: z.coerce.number().int("Bagatellgrenze: ganze Euro").min(0, "Bagatellgrenze: mind. 0 €").max(100_000),
});

export async function saveFees(input: Record<string, string | number>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const normalized = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, typeof v === "string" ? v.replace(",", ".") : v]));
  const parsed = feesSchema.safeParse(normalized);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Eingaben prüfen.");
  const current = await getFees();
  const next = { ...current, ...parsed.data };
  await db.setting.upsert({ where: { key: "fees" }, update: { value: JSON.stringify(next) }, create: { key: "fees", value: JSON.stringify(next) } });
  const changes = (Object.keys(parsed.data) as (keyof typeof parsed.data)[])
    .filter((k) => current[k] !== next[k])
    .map((k) => `${k}: ${current[k]} → ${next[k]}`)
    .join(", ");
  await audit(admin.name, "Gebührensätze geändert", "fees", changes || "keine Änderung");
  revalidatePath("/", "layout");
  return ok("Gebührensätze gespeichert.");
}

export async function updateCategory(id: string, nameRaw: string, descriptionRaw: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const name = nameRaw.trim();
  const description = descriptionRaw.trim();
  if (name.length < 2) return fail("Name ist zu kurz.");
  if (description.length < 3) return fail("Beschreibung ist zu kurz.");
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return fail("Kategorie nicht gefunden.");
  await db.category.update({ where: { id }, data: { name, description } });
  await audit(admin.name, "Kategorie bearbeitet", cat.slug, `${cat.name} → ${name}`);
  revalidatePath("/", "layout");
  return ok(`Kategorie „${name}“ gespeichert.`);
}
