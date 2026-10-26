"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { CATEGORIES, CITIES, categoryName } from "@/lib/constants";
import { notify, sendMail } from "@/lib/services/mail";
import { awardActivityPoints } from "@/lib/points";
import { checkInvite } from "@/app/actions/public";
import {
  extractProfile, scoreApplication, LINK_FIELDS,
  type ApplicationInput, type ApplicationLinks, type ExtractedProfile, type NetworkContext,
} from "@/lib/services/profile-extract";
import type { ActionResult } from "@/components/admin/admin-constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REUSABLE_DEMO_CODE = "CC-DEMO-2026";

// ---------------------------------------------------------------- Fast-Track: Code / Empfehler:in prüfen

export type ReferrerHit = { id: string; name: string; avatarSeed: string | null; city: string | null; headline: string | null };

export type ReferralCheck =
  | { ok: true; kind: "code"; code: string; referrer: ReferrerHit | null }
  | { ok: true; kind: "member"; matches: ReferrerHit[] }
  | { ok: false; error: string };

const INVITE_REASONS: Record<string, string> = {
  unbekannt: "Diesen Code kennen wir nicht – prüfe die Schreibweise.",
  eingeloest: "Dieser Code wurde schon eingelöst.",
  abgelaufen: "Dieser Code ist abgelaufen.",
  freigabe: "Dieser Code wartet noch auf Freigabe durch das Team.",
};

async function referrerById(id: string): Promise<ReferrerHit | null> {
  const u = await db.user.findUnique({ where: { id }, include: { profile: true } });
  if (!u || u.status === "gesperrt") return null;
  return { id: u.id, name: u.name, avatarSeed: u.profile?.avatarSeed ?? null, city: u.profile?.city ?? null, headline: u.profile?.headline ?? null };
}

export async function checkReferralCode(rawCode: string): Promise<ReferralCheck> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) return { ok: false, error: "Bitte gib deinen Einladungscode ein." };
  const res = await checkInvite(code);
  if (!res.valid) return { ok: false, error: INVITE_REASONS[res.reason] ?? "Code ungültig." };
  const referrer = res.invite.sender ? await referrerById(res.invite.sender.id) : null;
  return { ok: true, kind: "code", code: res.invite.code, referrer };
}

export async function searchReferrer(rawQuery: string): Promise<ReferralCheck> {
  const q = rawQuery.trim();
  if (q.length < 3) return { ok: false, error: "Bitte mindestens 3 Zeichen von Name oder E-Mail eingeben." };
  const isEmail = q.includes("@");
  const users = await db.user.findMany({
    where: isEmail ? { email: q.toLowerCase() } : { name: { contains: q } },
    include: { profile: true },
    take: 20,
  });
  const lower = q.toLowerCase();
  const matches = users
    .filter((u) => u.status !== "gesperrt" && (u.isCreative || u.isAdmin) && (isEmail || u.name.toLowerCase().includes(lower)))
    .slice(0, 5)
    .map((u) => ({ id: u.id, name: u.name, avatarSeed: u.profile?.avatarSeed ?? null, city: u.profile?.city ?? null, headline: u.profile?.headline ?? null }));
  if (!matches.length) return { ok: false, error: "Kein Mitglied gefunden. Prüfe die Schreibweise – oder bewirb dich direkt." };
  return { ok: true, kind: "member", matches };
}

// ---------------------------------------------------------------- Auto-Analyse

export type ApplicationDraft = {
  track: "standard" | "netzwerk";
  referralCode?: string | null;
  referrerId?: string | null;
  name: string;
  email: string;
  city: string;
  categories: string[];
  links: ApplicationLinks;
  pitch: string;
  cvText?: string | null;
  fileName?: string | null;
};

function sanitize(d: ApplicationDraft): ApplicationInput {
  const links: ApplicationLinks = {};
  for (const f of LINK_FIELDS) {
    const v = String(d.links?.[f.key] ?? "").trim().slice(0, 300);
    if (v) links[f.key] = v;
  }
  return {
    name: String(d.name ?? "").trim().slice(0, 120),
    email: String(d.email ?? "").trim().toLowerCase().slice(0, 200),
    city: String(d.city ?? "").trim().slice(0, 80),
    categories: (d.categories ?? []).filter((c) => CATEGORIES.some((k) => k.slug === c)),
    links,
    pitch: String(d.pitch ?? "").trim().slice(0, 4000),
    cvText: d.cvText ? String(d.cvText).slice(0, 30000) : null,
  };
}

// Netzwerk-Bezug serverseitig erneut prüfen (Client-Angaben sind nicht vertrauenswürdig)
async function resolveNetwork(d: ApplicationDraft): Promise<NetworkContext & { referrerId: string | null }> {
  if (d.track !== "netzwerk") return { track: "standard", verified: false, referrerId: null };
  if (d.referralCode) {
    const res = await checkReferralCode(d.referralCode);
    if (res.ok && res.kind === "code") return { track: "netzwerk", verified: true, code: res.code, referrerName: res.referrer?.name ?? null, referrerId: res.referrer?.id ?? null };
  }
  if (d.referrerId) {
    const r = await referrerById(d.referrerId);
    if (r) return { track: "netzwerk", verified: true, referrerName: r.name, referrerId: r.id, code: null };
  }
  return { track: "netzwerk", verified: false, referrerId: null };
}

function validate(input: ApplicationInput): string | null {
  if (input.name.length < 2) return "Bitte gib deinen Namen an.";
  if (!EMAIL_RE.test(input.email)) return "Bitte gib eine gültige E-Mail-Adresse an.";
  if (input.city.length < 2) return "Bitte gib deine Stadt an.";
  if (!input.categories.length) return "Bitte wähle mindestens einen Bereich.";
  if (input.pitch.length < 20) return "Erzähl uns in ein paar Sätzen, woran du gearbeitet hast (mind. 20 Zeichen).";
  return null;
}

export type AnalysisResult =
  | { ok: true; extracted: ExtractedProfile; score: number; checks: ReturnType<typeof scoreApplication>["checks"]; summary: string }
  | { ok: false; error: string };

export async function analyzeApplication(draft: ApplicationDraft): Promise<AnalysisResult> {
  const input = sanitize(draft);
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const [extracted, network] = await Promise.all([extractProfile(input), resolveNetwork(draft)]);
  const { score, checks, summary } = scoreApplication(input, extracted, network);
  return { ok: true, extracted, score, checks, summary };
}

// Bearbeitete Analyse neu bewerten (ohne erneute Extraktion)
export async function rescoreApplication(draft: ApplicationDraft, extracted: ExtractedProfile): Promise<AnalysisResult> {
  const input = sanitize(draft);
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const clean = cleanExtracted(extracted);
  const network = await resolveNetwork(draft);
  const { score, checks, summary } = scoreApplication(input, clean, network);
  return { ok: true, extracted: clean, score, checks, summary };
}

function cleanExtracted(e: ExtractedProfile): ExtractedProfile {
  const str = (arr: unknown, n: number, len: number) =>
    [...new Set((Array.isArray(arr) ? arr : []).map((s) => String(s).trim().slice(0, len)).filter(Boolean))].slice(0, n);
  const min = Math.min(5000, Math.max(50, Math.round(Number(e?.dayRate?.[0]) || 300)));
  const max = Math.min(5000, Math.max(min, Math.round(Number(e?.dayRate?.[1]) || min + 200)));
  return {
    skills: str(e?.skills, 20, 40),
    credits: str(e?.credits, 12, 140),
    industries: str(e?.industries, 6, 20),
    dayRate: [min, max],
    experienceYears: Math.min(40, Math.max(0, Math.round(Number(e?.experienceYears) || 0))),
    headline: e?.headline ? String(e.headline).slice(0, 80) : undefined,
    source: e?.source === "claude" ? "claude" : "mock",
  };
}

// ---------------------------------------------------------------- Absenden

export type SubmitResult = { ok: true; id: string } | { ok: false; error: string };

export async function submitApplication(draft: ApplicationDraft, extracted: ExtractedProfile): Promise<SubmitResult> {
  const input = sanitize(draft);
  const err = validate(input);
  if (err) return { ok: false, error: err };
  if (await db.user.findUnique({ where: { email: input.email } })) {
    return { ok: false, error: "Mit dieser E-Mail gibt es schon ein Konto. Melde dich einfach an." };
  }
  const open = await db.creativeApplication.findFirst({ where: { email: input.email, status: { in: ["eingereicht", "in_pruefung"] } } });
  if (open) return { ok: false, error: "Zu dieser E-Mail läuft bereits eine Bewerbung. Den Status findest du in deiner Bestätigungsmail." };

  const clean = cleanExtracted(extracted);
  const network = await resolveNetwork(draft);
  const { score, checks } = scoreApplication(input, clean, network);
  const track = network.track === "netzwerk" && network.verified ? "netzwerk" : "standard";

  const app = await db.creativeApplication.create({
    data: {
      name: input.name, email: input.email, city: input.city, categories: JSON.stringify(input.categories),
      links: JSON.stringify(input.links), pitch: input.pitch,
      cvText: input.cvText ? input.cvText : draft.fileName ? `[Datei: ${String(draft.fileName).slice(0, 120)} – Text wird im echten Betrieb ausgelesen]` : null,
      extracted: JSON.stringify(clean), checks: JSON.stringify(checks), score, track,
      referralCode: network.code ?? (track === "netzwerk" ? "EMPFEHLUNG" : null), referrerId: network.referrerId,
      status: "eingereicht",
    },
  });

  const statusPath = `/bewerben/status?id=${app.id}`;
  await sendMail(
    input.email,
    "Deine Bewerbung bei Creative Connect",
    `Hallo ${input.name},\n\ndanke für deine Bewerbung als ${input.categories.map(categoryName).join(", ")} aus ${input.city}!\n\n` +
      (track === "netzwerk"
        ? `Du kommst über das Netzwerk${network.referrerName ? ` (Empfehlung von ${network.referrerName})` : ""} – deine Bewerbung ist priorisiert. Eine Entscheidung gibt es meist innerhalb von 48 Stunden.\n\n`
        : "Nestos Team schaut sich jede Bewerbung persönlich an. Das dauert in der Regel ein bis zwei Wochen.\n\n") +
      `Den Stand siehst du jederzeit hier: ${statusPath}\n\nHinweis: Die automatische Vorprüfung hilft uns beim Sortieren – entschieden wird immer von Menschen.\n\nDein Creative-Connect-Team`,
  );
  const admins = await db.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  for (const a of admins) {
    await notify(
      a.id,
      track === "netzwerk" ? "Neue Fast-Track-Bewerbung" : "Neue Bewerbung",
      `${input.name} (${input.categories.map(categoryName).join(", ")}, ${input.city}) – Vorprüfung ${score}/100${network.referrerName ? `, empfohlen von ${network.referrerName}` : ""}.`,
      `/admin/bewerbungen/${app.id}`,
    );
  }
  if (network.referrerId && !admins.some((a) => a.id === network.referrerId)) {
    await notify(network.referrerId, "Deine Empfehlung hat sich beworben", `${input.name} hat sich über das Netzwerk beworben und dich als Empfehlung angegeben.`);
  }
  revalidatePath("/admin/bewerbungen");
  revalidatePath("/admin");
  return { ok: true, id: app.id };
}

// ---------------------------------------------------------------- Admin: Prüfen, Aufnehmen, Ablehnen

async function audit(actor: string, action: string, target: string, detail?: string) {
  await db.auditLog.create({ data: { actor, action, target, detail } });
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mitglied"
  );
}

async function uniqueSlug(base: string) {
  let slug = base;
  for (let i = 2; ; i++) {
    if (!(await db.profile.findUnique({ where: { slug }, select: { id: true } }))) return slug;
    slug = `${base}-${i}`;
  }
}

function revalidateApplication(id: string) {
  revalidatePath("/admin/bewerbungen");
  revalidatePath(`/admin/bewerbungen/${id}`);
  revalidatePath("/bewerben/status");
  revalidatePath("/admin");
}

export async function markApplicationInReview(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const app = await db.creativeApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, error: "Bewerbung nicht gefunden." };
  if (app.status !== "eingereicht") return { ok: false, error: "Nur neue Bewerbungen können in Prüfung gehen." };
  await db.creativeApplication.update({ where: { id }, data: { status: "in_pruefung" } });
  await audit(admin.name, "Bewerbung in Prüfung", app.name);
  revalidateApplication(id);
  return { ok: true, message: `${app.name} ist jetzt in Prüfung.` };
}

export async function saveApplicationNote(id: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  const text = note.trim().slice(0, 2000);
  await db.creativeApplication.update({ where: { id }, data: { reviewNote: text || null } });
  revalidateApplication(id);
  return { ok: true, message: "Notiz gespeichert." };
}

export async function acceptApplication(id: string, note: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const app = await db.creativeApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, error: "Bewerbung nicht gefunden." };
  if (app.status === "angenommen" || app.status === "abgelehnt") return { ok: false, error: "Über diese Bewerbung wurde bereits entschieden." };
  const email = app.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return { ok: false, error: "Mit dieser E-Mail gibt es schon ein Konto." };

  const ex = (() => {
    try {
      return JSON.parse(app.extracted) as Partial<ExtractedProfile>;
    } catch {
      return {} as Partial<ExtractedProfile>;
    }
  })();
  const links = (() => {
    try {
      return JSON.parse(app.links) as ApplicationLinks;
    } catch {
      return {} as ApplicationLinks;
    }
  })();
  const categories = (() => {
    try {
      return (JSON.parse(app.categories) as string[]).filter((c) => CATEGORIES.some((k) => k.slug === c));
    } catch {
      return [] as string[];
    }
  })();
  const city = CITIES.find((c) => c.name.toLowerCase() === app.city.trim().toLowerCase()) ?? CITIES[0];
  const referrer = app.referrerId ? await db.user.findUnique({ where: { id: app.referrerId }, select: { id: true, name: true } }) : null;
  const slug = await uniqueSlug(slugify(app.name));
  const dayRateMin = Math.max(50, Math.round(Number(ex.dayRate?.[0]) || 300));
  const dayRateMax = Math.max(dayRateMin, Math.round(Number(ex.dayRate?.[1]) || dayRateMin + 300));
  const headline =
    (ex.headline && String(ex.headline).slice(0, 80)) ||
    `${categories[0] ? categoryName(categories[0]) : "Kreativ"} aus ${app.city}`;

  const user = await db.user.create({
    data: {
      email, password: "demo", name: app.name, isCreative: true, status: "verifiziert", onboarded: false,
      invitedById: referrer?.id ?? admin.id,
      profile: {
        create: {
          slug, headline, bio: app.pitch.slice(0, 1200), city: city.name, state: city.state, lat: city.lat, lng: city.lng,
          categories: JSON.stringify(categories.length ? categories : ["musikproduktion"]),
          skills: JSON.stringify((ex.skills ?? []).slice(0, 20)), dayRateMin, dayRateMax, verified: true,
          instagram: links.instagram ? (links.instagram.startsWith("@") ? links.instagram : `@${links.instagram.replace(/^.*instagram\.com\//i, "").replace(/\/$/, "")}`) : null,
          website: links.website ?? links.portfolio ?? null,
          avatarSeed: `cc-${slug}`, coverSeed: `cc-cover-${slug}`,
        },
      },
    },
  });

  // Erkannte Credits ins Profil übernehmen (externe Credits, Jahr aus dem Text)
  const nowYear = new Date().getFullYear();
  for (const c of (ex.credits ?? []).slice(0, 8)) {
    const year = Number(String(c).match(/\b(19[89]\d|20[0-3]\d)\b/)?.[1]) || nowYear;
    await db.credit.create({ data: { userId: user.id, title: String(c).slice(0, 140), role: categories[0] ? categoryName(categories[0]) : "Kreativ", year } });
  }

  // Einladungscode verbrauchen (außer Demo-Code)
  if (app.referralCode && app.referralCode !== REUSABLE_DEMO_CODE) {
    const inv = await db.invite.findUnique({ where: { code: app.referralCode } });
    if (inv && inv.status === "offen") await db.invite.update({ where: { id: inv.id }, data: { status: "eingeloest", redeemedAt: new Date(), email } });
  }

  await db.creativeApplication.update({
    where: { id },
    data: { status: "angenommen", reviewedAt: new Date(), reviewNote: note.trim().slice(0, 2000) || app.reviewNote },
  });
  await audit(admin.name, "Bewerbung aufgenommen", app.name, `Profil /mitglieder/${slug}${referrer ? `, empfohlen von ${referrer.name}` : ""}`);
  await sendMail(
    email,
    "Willkommen bei Creative Connect – du bist aufgenommen",
    `Hallo ${app.name},\n\nwir freuen uns: Deine Bewerbung wurde angenommen${referrer ? ` (Empfehlung von ${referrer.name})` : ""}! Dein Profil ist bereits aus deiner Bewerbung vorbefüllt und verifiziert.\n\n` +
      `So meldest du dich an:\nE-Mail: ${email}\nPasswort (Demo): demo\n\nBitte prüfe beim ersten Login deine Angaben – das Onboarding dauert nur ein paar Minuten.\n\nDein Creative-Connect-Team`,
  );
  if (referrer) {
    await notify(referrer.id, "Deine Empfehlung ist dabei", `${app.name} wurde ins Netzwerk aufgenommen – danke fürs Empfehlen!`, `/mitglieder/${slug}`);
    await awardActivityPoints(referrer.id, "einladung", user.id, `${app.name} ist über deine Empfehlung beigetreten`);
  }
  revalidateApplication(id);
  revalidatePath("/admin/mitglieder");
  return { ok: true, message: `${app.name} ist aufgenommen – Zugangsdaten liegen in der Outbox.` };
}

export async function rejectApplication(id: string, note: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const text = note.trim();
  if (text.length < 10) return { ok: false, error: "Bitte die Ablehnung kurz begründen (mind. 10 Zeichen)." };
  const app = await db.creativeApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, error: "Bewerbung nicht gefunden." };
  if (app.status === "angenommen" || app.status === "abgelehnt") return { ok: false, error: "Über diese Bewerbung wurde bereits entschieden." };
  await db.creativeApplication.update({ where: { id }, data: { status: "abgelehnt", reviewedAt: new Date(), reviewNote: text.slice(0, 2000) } });
  await audit(admin.name, "Bewerbung abgelehnt", app.name, text);
  await sendMail(
    app.email,
    "Deine Bewerbung bei Creative Connect",
    `Hallo ${app.name},\n\ndanke für dein Interesse an Creative Connect. Wir haben deine Bewerbung persönlich geprüft und können dich aktuell leider nicht aufnehmen.\n\nBegründung: ${text}\n\nDu kannst dich jederzeit mit neuen Referenzen erneut bewerben – oder über eine Empfehlung aus dem Netzwerk.\n\nDein Creative-Connect-Team`,
  );
  revalidateApplication(id);
  return { ok: true, message: `Bewerbung von ${app.name} abgelehnt.` };
}
