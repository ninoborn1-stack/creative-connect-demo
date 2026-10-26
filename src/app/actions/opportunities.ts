"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";
import { completeCrewIfReady } from "@/lib/crew";
import { awardPoints } from "@/lib/points";
import { CATEGORIES, INDUSTRIES, categoryName } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { canManageOpportunity } from "@/components/opportunities/permissions";

type Result = { ok: true; message?: string; projectId?: string } | { ok: false; error: string };

// Punkte für eine Zusage über eine Ausschreibung (wie Projekt-Crew: nur aktive Kreative, nicht Nesto/Admins)
const PITCH_WIN_POINTS = 40;

function refresh(slug?: string) {
  revalidatePath("/ausschreibungen");
  if (slug) revalidatePath(`/ausschreibungen/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/unternehmen", "layout");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "ausschreibung";
}


async function loadManaged(opportunityId: string) {
  const user = await requireUser();
  const opp = await db.opportunity.findUnique({ where: { id: opportunityId }, include: { company: true, author: true } });
  if (!opp || !canManageOpportunity(user, opp)) return null;
  return { user, opp };
}

// ---------- Ausschreibung anlegen ----------

export type OpportunityFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const CreateSchema = z
  .object({
    title: z.string().trim().min(8, "Bitte mind. 8 Zeichen").max(120, "Max. 120 Zeichen"),
    summary: z.string().trim().min(20, "Bitte mind. 20 Zeichen").max(240, "Max. 240 Zeichen"),
    description: z.string().trim().min(80, "Bitte beschreibe das Vorhaben ausführlicher (mind. 80 Zeichen)").max(8000),
    industry: z.enum(INDUSTRIES.map((i) => i.slug) as [string, ...string[]], { message: "Bitte Branche wählen" }),
    categories: z.array(z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]])).min(1, "Mind. eine Kategorie wählen").max(4, "Max. 4 Kategorien"),
    skills: z.array(z.string().trim().min(2).max(40)).max(10, "Max. 10 Skills"),
    budgetMin: z.coerce.number({ message: "Bitte Zahl angeben" }).int().min(100, "Mind. 100 €"),
    budgetMax: z.coerce.number({ message: "Bitte Zahl angeben" }).int().min(100, "Mind. 100 €").max(5_000_000),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte Datum wählen"),
    startDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    location: z.string().trim().max(60),
    remote: z.boolean(),
    licensing: z.boolean(),
    companyId: z.string().optional(),
  })
  .refine((d) => d.budgetMax >= d.budgetMin, { path: ["budgetMax"], message: "Muss ≥ Budget von sein" })
  .refine((d) => d.remote || d.location.length >= 2, { path: ["location"], message: "Ort angeben oder „Remote“ wählen" });

export async function createOpportunity(_: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const user = await requireUser();
  if (!user.companyId && !user.isAdmin) return { error: "Ausschreibungen können nur Unternehmen veröffentlichen." };
  const raw = {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    categories: formData.getAll("categories").map(String),
    skills: String(formData.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
    deadline: String(formData.get("deadline") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    location: String(formData.get("location") ?? ""),
    remote: formData.get("remote") === "on",
    licensing: formData.get("licensing") === "on",
    companyId: formData.get("companyId") ? String(formData.get("companyId")) : undefined,
  };
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Bitte prüfe die markierten Felder.", fieldErrors };
  }
  const d = parsed.data;
  // Admin darf für jedes Unternehmen ausschreiben, alle anderen nur für die eigene Firma
  const companyId = user.isAdmin && d.companyId ? d.companyId : user.companyId;
  const company = companyId ? await db.company.findUnique({ where: { id: companyId } }) : null;
  if (!company) return { error: "Bitte wähle ein Unternehmen.", fieldErrors: { companyId: "Bitte Unternehmen wählen" } };

  const deadline = new Date(`${d.deadline}T23:59:00`);
  if (deadline < new Date()) return { error: "Die Deadline liegt in der Vergangenheit.", fieldErrors: { deadline: "Datum in der Zukunft wählen" } };

  const base = slugify(d.title);
  let slug = base;
  for (let i = 2; await db.opportunity.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const opp = await db.opportunity.create({
    data: {
      slug, companyId: company.id, authorId: user.id, title: d.title, summary: d.summary, description: d.description, industry: d.industry,
      categories: JSON.stringify(d.categories), skills: JSON.stringify([...new Set(d.skills)]), budgetMin: d.budgetMin, budgetMax: d.budgetMax,
      deadline, startDate: d.startDate ? new Date(`${d.startDate}T12:00:00`) : null, location: d.remote ? "Remote" : d.location, remote: d.remote,
      licensing: d.licensing, status: "offen",
    },
  });

  // Follower des Unternehmens informieren (in-App)
  const followers = await db.companyFollow.findMany({ where: { companyId: company.id, userId: { not: user.id } }, select: { userId: true }, take: 200 });
  for (const f of followers) await notify(f.userId, `Neue Ausschreibung von ${company.name}`, `${d.title} · ${formatEur(d.budgetMin)}–${formatEur(d.budgetMax)}`, `/ausschreibungen/${slug}`);

  await db.auditLog.create({ data: { actor: user.email, action: "opportunity.create", target: opp.slug } });
  refresh(slug);
  redirect(`/ausschreibungen/${slug}?neu=1`);
}

export async function setOpportunityStatus(opportunityId: string, status: "offen" | "in_auswahl" | "geschlossen"): Promise<Result> {
  const ctx = await loadManaged(opportunityId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  if (!["offen", "in_auswahl", "geschlossen"].includes(status)) return { ok: false, error: "Unbekannter Status." };
  if (ctx.opp.status === "vergeben") return { ok: false, error: "Die Ausschreibung ist bereits vergeben." };
  await db.opportunity.update({ where: { id: opportunityId }, data: { status } });
  if (status === "geschlossen") {
    const open = await db.pitch.findMany({ where: { opportunityId, status: { in: ["eingereicht", "shortlist"] } } });
    for (const p of open) await notify(p.creativeId, "Ausschreibung geschlossen", `„${ctx.opp.title}“ wurde ohne Vergabe geschlossen. Danke für deinen Pitch!`, `/ausschreibungen/${ctx.opp.slug}`);
  }
  refresh(ctx.opp.slug);
  return { ok: true, message: status === "offen" ? "Wieder offen für Pitches." : status === "in_auswahl" ? "Status: In Auswahl." : "Ausschreibung geschlossen." };
}

// ---------- Pitches (Kreative) ----------

const PitchSchema = z.object({
  message: z.string().trim().min(30, "Bitte schreib mind. 30 Zeichen – warum passt du?").max(3000),
  price: z.coerce.number({ message: "Bitte Preis angeben" }).int().min(50, "Mind. 50 €").max(5_000_000),
  links: z.array(z.string().trim().url("Links bitte mit https://")).max(5),
});

export type PitchFormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function submitPitch(opportunityId: string, _: PitchFormState, formData: FormData): Promise<PitchFormState> {
  const user = await requireUser();
  if (!user.isCreative || !user.profile) return { error: "Pitchen können Kreative mit Profil." };
  const opp = await db.opportunity.findUnique({ where: { id: opportunityId }, include: { author: true, company: true } });
  if (!opp) return { error: "Ausschreibung nicht gefunden." };
  if (opp.status !== "offen" && opp.status !== "in_auswahl") return { error: "Diese Ausschreibung nimmt keine Pitches mehr an." };
  if (opp.deadline < new Date()) return { error: "Die Deadline ist abgelaufen." };
  if (canManageOpportunity(user, opp) && !user.isAdmin) return { error: "Auf eigene Ausschreibungen kannst du nicht pitchen." };

  const parsed = PitchSchema.safeParse({
    message: String(formData.get("message") ?? ""),
    price: formData.get("price"),
    links: String(formData.get("links") ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Bitte prüfe deinen Pitch.", fieldErrors };
  }
  const d = parsed.data;
  const existing = await db.pitch.findUnique({ where: { opportunityId_creativeId: { opportunityId, creativeId: user.id } } });
  if (existing && existing.status !== "zurueckgezogen") return { error: "Du hast bereits gepitcht." };
  const data = { message: d.message, price: d.price, links: JSON.stringify(d.links), status: "eingereicht", createdAt: new Date() };
  if (existing) await db.pitch.update({ where: { id: existing.id }, data });
  else await db.pitch.create({ data: { ...data, opportunityId, creativeId: user.id } });

  await notify(opp.authorId, "Neuer Pitch", `${user.name} hat auf „${opp.title}“ gepitcht (${formatEur(d.price)}).`, `/ausschreibungen/${opp.slug}#pitches`);
  await sendMail(
    opp.author.email,
    `Neuer Pitch: ${opp.title}`,
    `Hallo ${opp.author.name.split(" ")[0]},\n\n${user.name} (${user.profile.headline}) hat auf eure Ausschreibung „${opp.title}“ gepitcht.\n\nAngebot: ${formatEur(d.price)}\n\n„${d.message.slice(0, 400)}${d.message.length > 400 ? " …" : ""}“\n\nAlle Pitches findest du auf der Ausschreibung unter „Pitches“.\n\nDein Creative-Connect-Team`,
  );
  refresh(opp.slug);
  return { ok: true };
}

export async function withdrawPitch(pitchId: string): Promise<Result> {
  const user = await requireUser();
  const pitch = await db.pitch.findUnique({ where: { id: pitchId }, include: { opportunity: true } });
  if (!pitch || pitch.creativeId !== user.id) return { ok: false, error: "Pitch nicht gefunden." };
  if (!["eingereicht", "shortlist"].includes(pitch.status)) return { ok: false, error: "Dieser Pitch kann nicht mehr zurückgezogen werden." };
  await db.pitch.update({ where: { id: pitchId }, data: { status: "zurueckgezogen" } });
  await notify(pitch.opportunity.authorId, "Pitch zurückgezogen", `${user.name} hat den Pitch für „${pitch.opportunity.title}“ zurückgezogen.`, `/ausschreibungen/${pitch.opportunity.slug}#pitches`);
  refresh(pitch.opportunity.slug);
  return { ok: true, message: "Pitch zurückgezogen. Du kannst bis zur Deadline erneut pitchen." };
}

// ---------- Pitch-Board (Unternehmen) ----------

async function loadPitchManaged(pitchId: string) {
  const pitch = await db.pitch.findUnique({ where: { id: pitchId }, include: { creative: true } });
  if (!pitch) return null;
  const ctx = await loadManaged(pitch.opportunityId);
  return ctx ? { ...ctx, pitch } : null;
}

export async function setPitchStatus(pitchId: string, status: "eingereicht" | "shortlist" | "abgelehnt"): Promise<Result> {
  const ctx = await loadPitchManaged(pitchId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const { opp, pitch } = ctx;
  if (!["eingereicht", "shortlist", "abgelehnt"].includes(status)) return { ok: false, error: "Unbekannter Status." };
  if (opp.status === "vergeben" || ["angenommen", "zurueckgezogen"].includes(pitch.status)) return { ok: false, error: "Dieser Pitch kann nicht mehr geändert werden." };
  await db.pitch.update({ where: { id: pitchId }, data: { status } });
  if (status === "shortlist" && opp.status === "offen") await db.opportunity.update({ where: { id: opp.id }, data: { status: "in_auswahl" } });
  if (status === "shortlist") {
    await notify(pitch.creativeId, "Du bist auf der Shortlist", `${opp.company.name} hat deinen Pitch für „${opp.title}“ auf die Shortlist gesetzt.`, `/ausschreibungen/${opp.slug}`);
  }
  if (status === "abgelehnt") {
    await notify(pitch.creativeId, "Absage zu deinem Pitch", `${opp.company.name} hat sich bei „${opp.title}“ für andere Pitches entschieden. Danke für deine Zeit!`, `/ausschreibungen/${opp.slug}`);
    await sendMail(pitch.creative.email, `Absage: ${opp.title}`, `Hallo ${pitch.creative.name.split(" ")[0]},\n\n${opp.company.name} hat sich bei „${opp.title}“ für andere Pitches entschieden. Danke für deinen Pitch – weitere passende Ausschreibungen findest du unter „Ausschreibungen“.\n\nDein Creative-Connect-Team`);
  }
  refresh(opp.slug);
  return { ok: true, message: status === "shortlist" ? `${pitch.creative.name} ist auf der Shortlist.` : status === "abgelehnt" ? "Absage gesendet." : "Zurück zu „Eingereicht“." };
}

// Zusage: Projekt anlegen, Rolle besetzen, Ausschreibung vergeben, alle anderen absagen, Vertrag/Zahlung über completeCrewIfReady
export async function acceptPitch(pitchId: string): Promise<Result> {
  const ctx = await loadPitchManaged(pitchId);
  if (!ctx) return { ok: false, error: "Keine Berechtigung." };
  const { user, opp, pitch } = ctx;
  if (opp.status === "vergeben" || opp.projectId) return { ok: false, error: "Die Ausschreibung ist bereits vergeben." };
  if (opp.status === "geschlossen") return { ok: false, error: "Die Ausschreibung ist geschlossen." };
  if (!["eingereicht", "shortlist"].includes(pitch.status)) return { ok: false, error: "Dieser Pitch ist nicht mehr offen." };
  if (pitch.creative.status === "gesperrt") return { ok: false, error: "Diese Person ist derzeit gesperrt." };

  const cats = JSON.parse(opp.categories || "[]") as string[];
  const category = cats[0] ?? "musikproduktion";
  const startDate = opp.startDate ?? addDays(new Date(), 14);
  const endDate = addDays(startDate, 30);

  const project = await db.project.create({
    data: {
      title: opp.title,
      description: opp.summary,
      type: "self",
      status: "anfragen",
      budget: pitch.price,
      city: opp.remote ? "Remote" : opp.location,
      startDate,
      endDate,
      coverSeed: `cc-project-opp-${opp.slug}`,
      ownerId: opp.authorId,
    },
  });
  await db.milestone.createMany({
    data: [
      { projectId: project.id, title: "Briefing abgestimmt", dueDate: new Date(), done: true },
      { projectId: project.id, title: "Crew bestätigt", dueDate: new Date() },
      { projectId: project.id, title: "Vorproduktion", dueDate: addDays(startDate, -3) },
      { projectId: project.id, title: "Erste Fassung", dueDate: addDays(startDate, 14) },
      { projectId: project.id, title: "Finale Abgabe", dueDate: endDate },
    ],
  });
  const roleTitle = cats.length > 1 ? `${categoryName(category)} (${cats.slice(1).map(categoryName).join(", ")})` : categoryName(category);
  const role = await db.projectRole.create({
    data: { projectId: project.id, title: roleTitle, category, budget: pitch.price, assigneeId: pitch.creativeId, sort: 0 },
  });
  await db.request.create({
    data: {
      projectId: project.id, roleId: role.id, creativeId: pitch.creativeId, price: pitch.price, status: "angenommen",
      note: `Zusage über die Ausschreibung „${opp.title}“ von ${opp.company.name}.`,
    },
  });
  await db.message.create({
    data: { projectId: project.id, authorId: opp.authorId, body: `Willkommen im Projektraum! Wir freuen uns auf die Zusammenarbeit an „${opp.title}“. Briefing-Details aus der Ausschreibung: ${opp.summary}` },
  });

  await db.pitch.update({ where: { id: pitch.id }, data: { status: "angenommen" } });
  await db.opportunity.update({ where: { id: opp.id }, data: { status: "vergeben", projectId: project.id } });

  // alle anderen offenen Pitches absagen
  const others = await db.pitch.findMany({ where: { opportunityId: opp.id, id: { not: pitch.id }, status: { in: ["eingereicht", "shortlist"] } }, include: { creative: true } });
  await db.pitch.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { status: "abgelehnt" } });
  for (const o of others) {
    await notify(o.creativeId, "Ausschreibung vergeben", `„${opp.title}“ von ${opp.company.name} ist vergeben. Danke für deinen Pitch!`, `/ausschreibungen/${opp.slug}`);
    await sendMail(o.creative.email, `Vergeben: ${opp.title}`, `Hallo ${o.creative.name.split(" ")[0]},\n\n${opp.company.name} hat „${opp.title}“ vergeben – diesmal leider nicht an dich. Danke für deinen Pitch!\n\nDein Creative-Connect-Team`);
  }

  // Zusage an die Kreative:n
  await notify(pitch.creativeId, "Zusage für deinen Pitch", `${opp.company.name} hat dir „${opp.title}“ zugesagt (${formatEur(pitch.price)}). Der Projektraum ist bereit.`, `/projekte/${project.id}`);
  await sendMail(
    pitch.creative.email,
    `Zusage: ${opp.title}`,
    `Hallo ${pitch.creative.name.split(" ")[0]},\n\nGlückwunsch! ${opp.company.name} hat deinen Pitch für „${opp.title}“ angenommen. Honorar: ${formatEur(pitch.price)}.\n\nVertrag, Zahlung (treuhänderisch reserviert) und Projektraum findest du unter /projekte/${project.id}.\n\nDein Creative-Connect-Team`,
  );
  if (opp.authorId !== user.id) {
    await notify(opp.authorId, "Ausschreibung vergeben", `${user.name} hat „${opp.title}“ an ${pitch.creative.name} vergeben.`, `/projekte/${project.id}`);
  }

  // Punkte (Logik wie awardActivityPoints: nur aktive Kreative, nicht Nesto/Admins)
  if (pitch.creative.isCreative && !pitch.creative.isAdmin) {
    await awardPoints(pitch.creativeId, PITCH_WIN_POINTS, "auftrag", `Zusage für „${opp.title}“`, `pitch:${pitch.id}`);
  }

  await completeCrewIfReady(project.id);
  await db.auditLog.create({ data: { actor: user.email, action: "pitch.accept", target: opp.slug, detail: `${pitch.creative.email} · ${formatEur(pitch.price)}` } });
  refresh(opp.slug);
  revalidatePath("/projekte");
  revalidatePath(`/projekte/${project.id}`);
  return { ok: true, projectId: project.id, message: `Zusage an ${pitch.creative.name} – Projekt angelegt, Vertrag und Zahlung vorbereitet.` };
}
