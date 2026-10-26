"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type Result = { ok: true; message?: string; following?: boolean; followers?: number } | { ok: false; error: string };

export async function toggleFollowCompany(companyId: string): Promise<Result> {
  const user = await requireUser();
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return { ok: false, error: "Unternehmen nicht gefunden." };
  const existing = await db.companyFollow.findUnique({ where: { companyId_userId: { companyId, userId: user.id } } });
  if (existing) await db.companyFollow.delete({ where: { id: existing.id } });
  else await db.companyFollow.create({ data: { companyId, userId: user.id } });
  const followers = await db.companyFollow.count({ where: { companyId } });
  revalidatePath("/unternehmen", "layout");
  revalidatePath("/netzwerk");
  return {
    ok: true,
    following: !existing,
    followers,
    message: existing ? `Du folgst ${company.name} nicht mehr.` : `Du folgst jetzt ${company.name}. Neue Ausschreibungen siehst du zuerst.`,
  };
}

async function asCompanyMember(companyId: string) {
  const user = await requireUser();
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return null;
  if (user.companyId !== company.id && !user.isAdmin) return null;
  return { user, company };
}

export type CompanyFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const CompanySchema = z.object({
  tagline: z.string().trim().min(5, "Mind. 5 Zeichen").max(140, "Max. 140 Zeichen"),
  about: z.string().trim().min(40, "Bitte mind. 40 Zeichen").max(3000),
  industry: z.enum(INDUSTRIES.map((i) => i.slug) as [string, ...string[]], { message: "Bitte Branche wählen" }),
  size: z.enum(COMPANY_SIZES as unknown as [string, ...string[]], { message: "Bitte Größe wählen" }),
  city: z.string().trim().min(2, "Bitte Stadt angeben").max(60),
  website: z.union([z.literal(""), z.string().trim().url("Bitte vollständige URL (https://…)")]),
  founded: z.union([z.literal(""), z.coerce.number().int().min(1800, "Jahr prüfen").max(new Date().getFullYear(), "Jahr prüfen")]),
});

export async function updateCompany(companyId: string, _: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const ctx = await asCompanyMember(companyId);
  if (!ctx) return { error: "Nur Mitglieder des Unternehmens können die Seite bearbeiten." };
  const raw = Object.fromEntries(["tagline", "about", "industry", "size", "city", "website", "founded"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = CompanySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Bitte prüfe die markierten Felder.", fieldErrors };
  }
  const d = parsed.data;
  await db.company.update({
    where: { id: companyId },
    data: { tagline: d.tagline, about: d.about, industry: d.industry, size: d.size, city: d.city, website: d.website || null, founded: d.founded === "" ? null : d.founded },
  });
  await db.auditLog.create({ data: { actor: ctx.user.email, action: "company.update", target: ctx.company.slug } });
  revalidatePath("/unternehmen", "layout");
  redirect(`/unternehmen/${ctx.company.slug}?gespeichert=1`);
}

function inviteCode(slug: string) {
  const prefix = slug.replace(/[^a-z0-9]/g, "").slice(0, 6).toUpperCase() || "TEAM";
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function inviteColleague(companyId: string, input: { email: string; note: string; origin: string }): Promise<Result> {
  const ctx = await asCompanyMember(companyId);
  if (!ctx) return { ok: false, error: "Nur Mitglieder des Unternehmens können Kolleg:innen einladen." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Bitte gib eine gültige E-Mail-Adresse an." };
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.companyId === companyId) return { ok: false, error: "Diese Person ist bereits im Team." };

  const origin = /^https?:\/\/[^\s/]+$/.test(input.origin) ? input.origin : "";
  const note = input.note.trim().slice(0, 500);
  const { user, company } = ctx;

  if (existing) {
    // bestehendes Mitglied: Hinweis statt Einladungscode (Demo: Zuordnung erfolgt durch das Team von Creative Connect)
    await notify(existing.id, `Einladung ins Team von ${company.name}`, `${user.name} möchte dich als Kolleg:in auf der Unternehmensseite von ${company.name} hinzufügen.`, `/unternehmen/${company.slug}`);
  }
  let code = inviteCode(company.slug);
  while (await db.invite.findUnique({ where: { code } })) code = inviteCode(company.slug);
  const expiresAt = addDays(new Date(), 30);
  await db.invite.create({ data: { code, senderId: user.id, email, status: "offen", expiresAt } });
  await sendMail(
    email,
    `${user.name} lädt dich ins Team von ${company.name} ein`,
    `Hallo,\n\n${user.name}${user.jobTitle ? ` (${user.jobTitle})` : ""} lädt dich ein, ${company.name} auf Creative Connect zu vertreten – Ausschreibungen veröffentlichen, Pitches sichten, Werke lizenzieren und Crews buchen.${note ? `\n\nPersönliche Nachricht:\n„${note}“` : ""}\n\nDein Einladungscode: ${code}\nEinlösen: ${origin}/invite/${code}\nUnternehmensseite: ${origin}/unternehmen/${company.slug}\n\nDer Code ist gültig bis ${formatDate(expiresAt)}.\n\nDein Creative-Connect-Team`,
  );
  revalidatePath(`/unternehmen/${company.slug}`);
  return { ok: true, message: `Einladung an ${email} gesendet.` };
}
