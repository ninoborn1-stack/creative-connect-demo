"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { getMarketplaceMode } from "@/lib/settings";
import { sendMail, notify } from "@/lib/services/mail";
import { awardActivityPoints } from "@/lib/points";
import { CATEGORIES, categoryName } from "@/lib/constants";

export type FormState = { error?: string; success?: boolean; message?: string } | undefined;

// Demo: dieser Code lässt sich beliebig oft einlösen
const REUSABLE_DEMO_CODE = "CC-DEMO-2026";

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

const CLIENT_TYPES = ["Label", "Marke", "Agentur", "Magazin", "Independent-Artist"];

export async function registerClient(_: FormState, formData: FormData): Promise<FormState> {
  const mode = await getMarketplaceMode();
  if (mode === "closed") return { error: "Creative Connect ist gerade ein geschlossenes Netzwerk." };

  const name = field(formData, "name");
  const company = field(formData, "company");
  const clientType = field(formData, "clientType");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (company.length < 2) return { error: "Bitte gib deine Firma bzw. deinen Künstler:innen-Namen an." };
  if (!CLIENT_TYPES.includes(clientType)) return { error: "Bitte wähle aus, was dich am besten beschreibt." };
  if (!EMAIL_RE.test(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (password.length < 4) return { error: "Das Passwort muss mindestens 4 Zeichen haben (Demo)." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Mit dieser E-Mail gibt es schon ein Konto. Melde dich einfach an." };

  const user = await db.user.create({
    data: { email, password, name, company, clientType, isClient: true, status: "aktiv", onboarded: true },
  });
  await sendMail(
    email,
    "Dein Konto bei Creative Connect",
    `Hallo ${name},\n\nwillkommen bei Creative Connect! Starte jetzt mit deinem ersten Briefing – der Assistent schlägt dir Rollen, Budgetaufteilung und passende Kreative vor. Du entscheidest.\n\nDein Creative-Connect-Team`,
  );
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/briefing");
}
