"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { getMarketplaceMode } from "@/lib/settings";
import { sendMail, notify } from "@/lib/services/mail";
import { awardActivityPoints } from "@/lib/points";
import { CATEGORIES, COMPANY_SIZES, INDUSTRIES, categoryName, industryName } from "@/lib/constants";

export type FormState = { error?: string; success?: boolean; message?: string } | undefined;

// Demo: dieser Code lässt sich beliebig oft einlösen
const REUSABLE_DEMO_CODE = "CC-DEMO-2026";

const TEAM_INBOX = "admin@demo.cc"; // Postfach des Teams (Demo: Admin-Konto)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export type InviteCheck =
  | { valid: true; invite: { id: string; code: string; sender: { id: string; name: string; avatarSeed: string | null } | null } }
  | { valid: false; reason: "unbekannt" | "eingeloest" | "abgelaufen" | "freigabe" };

export async function checkInvite(rawCode: string): Promise<InviteCheck> {
  const code = rawCode.trim().toUpperCase();
  const invite = await db.invite.findUnique({
    where: { code },
    include: { sender: { select: { id: true, name: true, profile: { select: { avatarSeed: true } } } } },
  });
  if (!invite) return { valid: false, reason: "unbekannt" };
  if (invite.status === "eingeloest") return { valid: false, reason: "eingeloest" };
  if (invite.status === "freigabe") return { valid: false, reason: "freigabe" };
  if (invite.status === "abgelaufen" || invite.expiresAt < new Date()) return { valid: false, reason: "abgelaufen" };
  return {
    valid: true,
    invite: {
      id: invite.id,
      code: invite.code,
      sender: invite.sender ? { id: invite.sender.id, name: invite.sender.name, avatarSeed: invite.sender.profile?.avatarSeed ?? null } : null,
    },
  };
}

export async function redeemInvite(_: FormState, formData: FormData): Promise<FormState> {
  const code = field(formData, "code");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (password.length < 4) return { error: "Das Passwort muss mindestens 4 Zeichen haben (Demo)." };

  const check = await checkInvite(code);
  if (!check.valid) return { error: "Diese Einladung ist nicht mehr gültig." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Mit dieser E-Mail gibt es schon ein Konto. Melde dich einfach an." };

  const { invite } = check;
  const user = await db.user.create({
    data: { email, password, name, status: "aktiv", onboarded: false, invitedById: invite.sender?.id ?? null },
  });
  if (invite.code !== REUSABLE_DEMO_CODE) {
    await db.invite.update({ where: { id: invite.id }, data: { status: "eingeloest", redeemedAt: new Date(), email } });
  }

  await sendMail(
    email,
    "Willkommen bei Creative Connect",
    `Hallo ${name},\n\nschön, dass du da bist! ${invite.sender ? `${invite.sender.name} hat dich eingeladen. ` : ""}Richte jetzt dein Profil ein – das dauert etwa fünf Minuten.\n\nDein Creative-Connect-Team`,
  );
  if (invite.sender) {
    await notify(invite.sender.id, "Deine Einladung wurde eingelöst", `${name} ist über deinen Code ${invite.code} dem Netzwerk beigetreten.`, "/einladen");
    await awardActivityPoints(invite.sender.id, "einladung", user.id, `${name} ist über deine Einladung beigetreten`);
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function joinWaitlist(_: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const category = field(formData, "category");
  const city = field(formData, "city");
  const message = field(formData, "message");

  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (!CATEGORIES.some((c) => c.slug === category)) return { error: "Bitte wähle deinen Bereich." };
  if (city.length < 2) return { error: "Bitte gib deine Stadt an." };

  await db.waitlistEntry.create({ data: { name, email, category, city, message: message || null } });
  await sendMail(
    email,
    "Du stehst auf der Warteliste",
    `Hallo ${name},\n\ndanke für dein Interesse an Creative Connect! Wir haben dich für den Bereich ${categoryName(category)} in ${city} auf die Warteliste gesetzt.\n\nCreative Connect wächst bewusst langsam und kuratiert – sobald ein Platz frei wird oder ein Mitglied dich einlädt, melden wir uns.\n\nDein Creative-Connect-Team`,
  );
  revalidatePath("/admin");
  return { success: true, message: name };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  const user = await db.user.findUnique({ where: { email } });
  // Immer dieselbe Antwort, damit niemand herausfinden kann, welche Adressen registriert sind.
  if (user) {
    await sendMail(
      email,
      "Passwort zurücksetzen",
      `Hallo ${user.name},\n\nüber diesen Link kannst du ein neues Passwort setzen (Demo – der Link führt nirgendwohin):\nhttps://creative-connect.example/passwort/neu?token=demo\n\nDer Link ist 60 Minuten gültig. Wenn du das nicht warst, ignoriere diese Mail einfach.\n\nDein Creative-Connect-Team`,
    );
  }
  return { success: true, message: email };
}

const CLIENT_TYPE_BY_INDUSTRY: Record<string, string> = { gaming: "Studio", musik: "Label", werbung: "Marke", "film-tv": "Produktion", corporate: "Unternehmen", events: "Agentur" };

function slugifyCompany(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50) || "unternehmen";
}

// Firmen-Onboarding: legt Unternehmen + erstes Teamkonto an
export async function registerClient(_: FormState, formData: FormData): Promise<FormState> {
  const mode = await getMarketplaceMode();
  if (mode === "closed") return { error: "Creative Connect ist gerade ein geschlossenes Netzwerk." };

  const company = field(formData, "company");
  const industry = field(formData, "industry");
  const size = field(formData, "size");
  const city = field(formData, "city");
  let website = field(formData, "website");
  const jobTitle = field(formData, "jobTitle");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (company.length < 2) return { error: "Bitte gib den Namen deines Unternehmens an." };
  if (!INDUSTRIES.some((i) => i.slug === industry)) return { error: "Bitte wähle eure Branche." };
  if (!(COMPANY_SIZES as readonly string[]).includes(size)) return { error: "Bitte wähle die Unternehmensgröße." };
  if (city.length < 2) return { error: "Bitte gib den Standort an." };
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(website)) return { error: "Bitte gib eine gültige Website an (oder lass das Feld leer)." };
  if (jobTitle.length < 2) return { error: "Bitte gib deine Position an." };
  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige geschäftliche E-Mail-Adresse an." };
  if (password.length < 4) return { error: "Das Passwort muss mindestens 4 Zeichen haben (Demo)." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Mit dieser E-Mail gibt es schon ein Konto. Melde dich einfach an." };

  const base = slugifyCompany(company);
  let slug = base;
  for (let n = 2; await db.company.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  const ind = INDUSTRIES.find((i) => i.slug === industry)!;
  const created = await db.company.create({
    data: {
      slug, name: company, industry, size, city, website: website || null,
      tagline: `${ind.name} aus ${city}`,
      about: `${company} arbeitet über Creative Connect mit kuratierten Kreativen zusammen.`,
      logoSeed: `cc-logo-${slug}`, coverSeed: `cc-company-${slug}`, verified: false,
    },
  });
  const user = await db.user.create({
    data: {
      email, password, name, company, companyId: created.id, jobTitle, clientType: CLIENT_TYPE_BY_INDUSTRY[industry] ?? "Unternehmen",
      isClient: true, status: "aktiv", onboarded: true,
    },
  });
  await sendMail(
    email,
    `Willkommen bei Creative Connect, ${company}`,
    `Hallo ${name},\n\neuer Firmenkonto für ${company} ist eingerichtet. Ab sofort könnt ihr\n\n• Kreative direkt beauftragen oder eine Managed Crew anfragen,\n• Werke aus dem Lizenz-Katalog lizenzieren (mit Lizenzzertifikat),\n• Ausschreibungen veröffentlichen und Pitches erhalten.\n\nWeitere Kolleg:innen ladet ihr später als Teamkonten ein. Bei Fragen zu Rahmenverträgen oder Sammelrechnungen meldet sich Nesto gern persönlich.\n\nDein Creative-Connect-Team`,
  );
  await sendMail(TEAM_INBOX, `Neues Firmenkonto: ${company}`, `${name} (${jobTitle}) hat ${company} registriert – ${ind.name}, ${size} Mitarbeitende, ${city}.`);
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ---------- Unternehmen: Demo anfragen + Firmen-Onboarding ----------

const DEMO_INTERESTS = ["Self-Service", "Managed Crew", "Licensing", "Ausschreibungen", "Enterprise / Rahmenvertrag"];

export async function requestDemo(_: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name");
  const company = field(formData, "company");
  const email = field(formData, "email").toLowerCase();
  const industry = field(formData, "industry");
  const interest = field(formData, "interest");
  const message = field(formData, "message");

  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (company.length < 2) return { error: "Bitte gib dein Unternehmen an." };
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige geschäftliche E-Mail-Adresse an." };
  if (!INDUSTRIES.some((i) => i.slug === industry)) return { error: "Bitte wähle eure Branche." };
  if (!DEMO_INTERESTS.includes(interest)) return { error: "Bitte wähle, wofür ihr euch interessiert." };

  await sendMail(
    TEAM_INBOX,
    `Demo-Anfrage: ${company} (${industryName(industry)})`,
    `Neue Demo-Anfrage über „Für Unternehmen“.\n\nName: ${name}\nUnternehmen: ${company}\nE-Mail: ${email}\nBranche: ${industryName(industry)}\nInteresse: ${interest}\n\nNachricht:\n${message || "–"}`,
  );
  await sendMail(
    email,
    "Deine Demo-Anfrage bei Creative Connect",
    `Hallo ${name},\n\ndanke für dein Interesse an Creative Connect! Nesto und das Team melden sich innerhalb von zwei Werktagen mit Terminvorschlägen für eine persönliche Demo (Schwerpunkt: ${interest}).\n\nViele Grüße\nDein Creative-Connect-Team`,
  );
  revalidatePath("/outbox");
  return { success: true, message: name };
}
