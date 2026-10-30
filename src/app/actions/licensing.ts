"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { payments } from "@/lib/services/payments";
import { notify, sendMail } from "@/lib/services/mail";
import { storeFile } from "@/lib/services/storage";
import { awardPoints } from "@/lib/points";
import { INDUSTRIES, LICENSE_MEDIA, LICENSE_TIERS, TERRITORIES, WORK_TYPES } from "@/lib/constants";
import { formatDate, formatEur } from "@/lib/format";
import {
  RESERVED_SLUGS, TIER_KEYS, calcLicensePrice, isAudioType, isExclusivelyTaken, licenseEndDate, normalizeConfig, slugifyTitle,
  type LicenseTier,
} from "@/lib/licensing";

const LICENSE_POINTS = 20;

// ---------- Lizenz kaufen ----------
export type LicenseWorkInput = {
  workId: string;
  tier: string;
  media: string[];
  territory: string;
  durationMonths: number | null;
  projectName: string;
  asCompany: boolean;
};
export type LicenseWorkResult =
  | { ok: true; number: string; licenseFee: number; serviceFee: number; providerRef: string; endsAt: string | null }
  | { ok: false; error: string };

async function nextLicenseNumber() {
  const year = new Date().getFullYear();
  const prefix = `CC-L-${year}-`;
  const existing = await db.license.findMany({ where: { number: { startsWith: prefix } }, select: { number: true } });
  let n = existing.reduce((max, l) => Math.max(max, Number(l.number.slice(prefix.length)) || 0), 0) + 1;
  while (await db.license.findUnique({ where: { number: `${prefix}${String(n).padStart(5, "0")}` } })) n++;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export async function licenseWork(input: LicenseWorkInput): Promise<LicenseWorkResult> {
  const user = await requireUser();
  const work = await db.licensableWork.findUnique({
    where: { id: input.workId },
    include: { owner: { include: { profile: true } }, licenses: { select: { tier: true, status: true } } },
  });
  if (!work) return { ok: false, error: "Dieses Werk gibt es nicht mehr." };
  if (work.ownerId === user.id) return { ok: false, error: "Dein eigenes Werk kannst du nicht lizenzieren." };
  if (isExclusivelyTaken(work.licenses)) return { ok: false, error: "Dieses Werk wurde exklusiv lizenziert und ist nicht mehr verfügbar." };
  if (!TIER_KEYS.includes(input.tier as LicenseTier)) return { ok: false, error: "Bitte wähle eine Lizenzstufe." };
  const tier = input.tier as LicenseTier;
  if (tier === "exklusiv" && work.priceExclusive == null) return { ok: false, error: "Für dieses Werk wird keine Exklusiv-Lizenz angeboten." };

  const config = normalizeConfig({ tier, media: (input.media ?? []).filter((m) => LICENSE_MEDIA[m]), territory: input.territory, durationMonths: input.durationMonths });
  if (config.media.length === 0) return { ok: false, error: "Bitte wähle mindestens ein Medium." };
  const projectName = String(input.projectName ?? "").trim().slice(0, 120);
  if (projectName.length < 2) return { ok: false, error: "Bitte gib einen Projektnamen an." };

  const fees = await getFees();
  const price = calcLicensePrice(work, config, fees.serviceFeePct);
  if (!price) return { ok: false, error: "Für diese Stufe gibt es keinen Preis." };

  const companyId = input.asCompany && user.companyId ? user.companyId : null;
  const company = companyId ? await db.company.findUnique({ where: { id: companyId } }) : null;
  const number = await nextLicenseNumber();

  const license = await db.license.create({
    data: {
      number, workId: work.id, buyerId: user.id, companyId, tier, media: JSON.stringify(config.media), territory: config.territory,
      durationMonths: config.durationMonths, projectName, price: price.licenseFee, serviceFee: price.serviceFee,
    },
  });

  // Mock-Zahlung: reservieren, sofort freigeben und auszahlen (Lizenz wird mit Zahlung wirksam)
  const payment = await payments.reserve({ payeeId: work.ownerId, label: `Lizenz ${number} – ${work.title}`, amount: price.licenseFee, serviceFee: price.serviceFee });
  await payments.release(payment.id);
  await payments.payout(payment.id);
  const providerRef = (await db.payment.findUnique({ where: { id: payment.id } }))?.providerRef ?? "";

  const tierLabel = LICENSE_TIERS[tier].label;
  const licensee = company ? `${company.name} (${user.name})` : user.name;
  const endsAt = licenseEndDate(license.createdAt, config.durationMonths);
  const scope = `${tierLabel} · ${config.media.map((m) => LICENSE_MEDIA[m]).join(", ")} · ${TERRITORIES[config.territory]} · ${endsAt ? `bis ${formatDate(endsAt)}` : "unbefristet"}`;
  const certHref = `/lizenzen/zertifikat/${number}`;

  await notify(work.ownerId, `Neue Lizenz: ${work.title}`, `${licensee} hat „${work.title}“ lizenziert (${tierLabel}) – ${formatEur(price.licenseFee)} an dich.`, "/lizenzen/werke");
  await sendMail(
    work.owner.email,
    `Dein Werk „${work.title}“ wurde lizenziert`,
    `Hallo ${work.owner.name.split(" ")[0]},\n\n${licensee} hat „${work.title}“ für das Projekt „${projectName}“ lizenziert.\nUmfang: ${scope}\nLizenznummer: ${number}\n\nLizenzgebühr: ${formatEur(price.licenseFee)} – geht zu 100 % an dich. Auszahlung über den Zahlungsdienstleister, Referenz ${providerRef}.\n\nDein Creative-Connect-Team`,
  );
  await notify(user.id, `Lizenz ${number} erteilt`, `„${work.title}“ ist lizenziert – das Zertifikat liegt bereit.`, "/lizenzen/meine");
  await sendMail(
    user.email,
    `Lizenzbestätigung ${number} – ${work.title}`,
    `Hallo ${user.name.split(" ")[0]},\n\ndeine Lizenz ist erteilt.\nWerk: ${work.title} von ${work.owner.name}\nLizenznehmer:in: ${licensee}\nProjekt: ${projectName}\nUmfang: ${scope}\n\nLizenzgebühr ${formatEur(price.licenseFee)} + Servicegebühr ${formatEur(price.serviceFee)} = ${formatEur(price.total)} (Demo – keine echte Zahlung).\n\nZertifikat (PDF): ${certHref}\n\nDein Creative-Connect-Team`,
  );

  if (tier === "exklusiv") {
    const otherBuyers = await db.license.findMany({ where: { workId: work.id, id: { not: license.id } }, select: { buyerId: true } });
    for (const b of new Set(otherBuyers.map((x) => x.buyerId))) {
      if (b !== user.id) await notify(b, `„${work.title}“ exklusiv vergeben`, "Deine bestehende Lizenz bleibt im vereinbarten Umfang gültig.", "/lizenzen/meine");
    }
  }

  // Punkte für die:den Urheber:in (nur aktive Kreative, nicht Admins)
  if (!work.owner.isAdmin && work.owner.isCreative && work.owner.status !== "gesperrt") {
    await awardPoints(work.ownerId, LICENSE_POINTS, "lizenz", `Werk lizenziert: ${work.title}`, license.id);
  }

  revalidatePath("/lizenzen");
  revalidatePath(`/lizenzen/${work.slug}`);
  revalidatePath("/lizenzen/meine");
  revalidatePath("/lizenzen/werke");
  revalidatePath("/finanzen");
  return { ok: true, number, licenseFee: price.licenseFee, serviceFee: price.serviceFee, providerRef, endsAt: endsAt ? endsAt.toISOString() : null };
}

// ---------- Werke verwalten ----------
export type WorkFormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | undefined;

const FIELDS = ["type", "title", "description", "tags", "durationSec", "bpm", "musicalKey", "priceStandard", "priceExtended", "priceExclusive", "aiMarked"];

function echo(formData: FormData) {
  const values: Record<string, string> = {};
  for (const k of FIELDS) values[k] = String(formData.get(k) ?? "");
  values.industries = formData.getAll("industries").map(String).join(",");
  return values;
}

function parseDuration(v: string) {
  if (!v) return null;
  const m = /^(\d+):([0-5]\d)$/.exec(v);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : NaN;
}

function readWorkForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const int = (k: string) => (str(k) === "" ? null : Math.round(Number(str(k).replace(",", "."))));
  const type = str("type");
  const audio = isAudioType(type);
  const data = {
    type,
    title: str("title").slice(0, 120),
    description: str("description").slice(0, 2000),
    tags: str("tags").split(/[,\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 12),
    industries: formData.getAll("industries").map(String).filter((i) => INDUSTRIES.some((x) => x.slug === i)),
    durationSec: audio ? parseDuration(str("durationSec")) : null,
    bpm: audio ? int("bpm") : null,
    musicalKey: audio ? str("musicalKey").slice(0, 20) || null : null,
    priceStandard: int("priceStandard"),
    priceExtended: int("priceExtended"),
    priceExclusive: int("priceExclusive"),
    aiMarked: str("aiMarked"),
  };
  const fe: Record<string, string> = {};
  if (!WORK_TYPES[data.type]) fe.type = "Bitte wähle einen Typ.";
  if (data.title.length < 3) fe.title = "Bitte gib einen Titel mit mindestens 3 Zeichen an.";
  if (data.description.length < 20) fe.description = "Beschreibe das Werk in mindestens 20 Zeichen.";
  if (data.durationSec != null && !(data.durationSec > 0)) fe.durationSec = "Dauer als mm:ss oder Sekunden angeben.";
  if (data.bpm != null && !(data.bpm >= 20 && data.bpm <= 300)) fe.bpm = "BPM zwischen 20 und 300.";
  if (!(data.priceStandard! > 0)) fe.priceStandard = "Preis Standard muss größer als 0 sein.";
  if (!(data.priceExtended! > 0)) fe.priceExtended = "Preis Erweitert muss größer als 0 sein.";
  else if (data.priceStandard && data.priceExtended! < data.priceStandard) fe.priceExtended = "Erweitert sollte mindestens so viel kosten wie Standard.";
  if (data.priceExclusive != null && !(data.priceExclusive >= (data.priceExtended ?? 0))) fe.priceExclusive = "Exklusiv muss mindestens so viel kosten wie Erweitert (oder leer lassen).";
  if (data.aiMarked !== "ja" && data.aiMarked !== "nein") fe.aiMarked = "Bitte gib an, ob KI bei der Erstellung eingesetzt wurde (Pflichtangabe).";
  return { data, fieldErrors: fe };
}

async function uploadPreview(formData: FormData, type: string): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.size > 8 * 1024 * 1024) return { error: "Die Datei ist größer als 8 MB." };
  const audio = isAudioType(type);
  if (audio && !file.type.startsWith("audio/")) return { error: "Für Audio-Werke bitte eine Audiodatei (MP3, WAV) hochladen." };
  if (!audio && !file.type.startsWith("image/")) return { error: "Für visuelle Werke bitte ein Vorschaubild (JPG, PNG, WebP) hochladen." };
  const stored = await storeFile(file);
  return { url: stored.url };
}

function canManage(user: { isCreative: boolean; isAdmin: boolean }) {
  return user.isCreative || user.isAdmin;
}

export async function createWork(_: WorkFormState, formData: FormData): Promise<WorkFormState> {
  const user = await requireUser();
  if (!canManage(user)) return { error: "Nur Kreative können Werke anbieten." };
  const { data, fieldErrors } = readWorkForm(formData);
  if (Object.keys(fieldErrors).length) return { error: "Bitte prüfe die markierten Felder.", fieldErrors, values: echo(formData) };
  const upload = await uploadPreview(formData, data.type);
  if (upload.error) return { error: upload.error, fieldErrors: { file: upload.error }, values: echo(formData) };

  const base = slugifyTitle(data.title) || "werk";
  let slug = RESERVED_SLUGS.includes(base) ? `${base}-werk` : base;
  for (let n = 2; await db.licensableWork.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  await db.licensableWork.create({
    data: {
      slug, ownerId: user.id, type: data.type, title: data.title, description: data.description, tags: JSON.stringify(data.tags),
      industries: JSON.stringify(data.industries), durationSec: data.durationSec, bpm: data.bpm, musicalKey: data.musicalKey,
      previewUrl: upload.url ?? (isAudioType(data.type) ? `/demo-audio/demo-${(slug.length % 8) + 1}.wav` : null),
      imageSeed: `cc-work-${slug}`, priceStandard: data.priceStandard!, priceExtended: data.priceExtended!, priceExclusive: data.priceExclusive,
      aiMarked: data.aiMarked === "ja",
    },
  });
  revalidatePath("/lizenzen");
  revalidatePath("/lizenzen/werke");
  redirect(`/lizenzen/werke?neu=${encodeURIComponent(slug)}`);
}

export async function updateWork(workId: string, _: WorkFormState, formData: FormData): Promise<WorkFormState> {
  const user = await requireUser();
  const work = await db.licensableWork.findUnique({ where: { id: workId } });
  if (!work || (work.ownerId !== user.id && !user.isAdmin)) return { error: "Du kannst nur deine eigenen Werke bearbeiten." };
  const { data, fieldErrors } = readWorkForm(formData);
  if (Object.keys(fieldErrors).length) return { error: "Bitte prüfe die markierten Felder.", fieldErrors, values: echo(formData) };
  const upload = await uploadPreview(formData, data.type);
  if (upload.error) return { error: upload.error, fieldErrors: { file: upload.error }, values: echo(formData) };

  const typeFamilyChanged = isAudioType(work.type) !== isAudioType(data.type);
  const previewUrl = upload.url ?? (typeFamilyChanged ? (isAudioType(data.type) ? `/demo-audio/demo-${(work.slug.length % 8) + 1}.wav` : null) : work.previewUrl);

  await db.licensableWork.update({
    where: { id: work.id },
    data: {
      type: data.type, title: data.title, description: data.description, tags: JSON.stringify(data.tags), industries: JSON.stringify(data.industries),
      durationSec: data.durationSec, bpm: data.bpm, musicalKey: data.musicalKey, previewUrl,
      priceStandard: data.priceStandard!, priceExtended: data.priceExtended!, priceExclusive: data.priceExclusive, aiMarked: data.aiMarked === "ja",
    },
  });
  revalidatePath("/lizenzen");
  revalidatePath(`/lizenzen/${work.slug}`);
  revalidatePath("/lizenzen/werke");
  redirect(`/lizenzen/werke?gespeichert=${encodeURIComponent(work.slug)}`);
}

export async function deleteWork(workId: string): Promise<{ ok: false; error: string } | void> {
  const user = await requireUser();
  const work = await db.licensableWork.findUnique({ where: { id: workId }, include: { _count: { select: { licenses: true } } } });
  if (!work || (work.ownerId !== user.id && !user.isAdmin)) return { ok: false, error: "Du kannst nur deine eigenen Werke löschen." };
  if (work._count.licenses > 0) return { ok: false, error: "Werke mit erteilten Lizenzen können nicht gelöscht werden – die Rechtekette muss erhalten bleiben." };
  await db.licensableWork.delete({ where: { id: work.id } });
  revalidatePath("/lizenzen");
  revalidatePath("/lizenzen/werke");
  redirect("/lizenzen/werke?geloescht=1");
}

