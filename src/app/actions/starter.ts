"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";
import { categoryName } from "@/lib/constants";
import { findPackage } from "@/lib/packages";
import { formatEur, parseJson } from "@/lib/format";

// Die zwei Anfrage-Wege der Ausbaustufe 1: ein Paket anfragen (→ Managed Crew bei Nesto) oder einen Artist direkt anfragen.

type Result = { ok: true; message: string; projectId: string } | { ok: false; error: string };

const requestSchema = z.object({
  title: z.string().trim().min(3, "Bitte kurz beschreiben, worum es geht.").max(120),
  city: z.string().trim().min(2, "Bitte eine Stadt angeben.").max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Wunschdatum wählen."),
  note: z.string().trim().max(1000).optional(),
});

function startDate(date: string) {
  const d = new Date(`${date}T10:00:00`);
  return Number.isNaN(d.getTime()) || d < new Date() ? addDays(new Date(), 14) : d;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/projekte");
  revalidatePath("/admin/managed");
}

export async function requestPackage(input: { slug: string; title: string; city: string; date: string; note?: string }): Promise<Result> {
  const user = await requireUser();
  const pkg = findPackage(input.slug);
  if (!pkg) return { ok: false, error: "Paket nicht gefunden." };
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Eingaben prüfen." };
  const { title, city, date, note } = parsed.data;
  const start = startDate(date);

  const project = await db.project.create({
    data: {
      title: `${pkg.name}: ${title}`,
      description: [`Paket „${pkg.name}“ (ab ${formatEur(pkg.price)}): ${pkg.includes.join(", ")}.`, note].filter(Boolean).join("\n\n"),
      type: "managed",
      status: "entwurf",
      managedStage: "anfrage",
      budget: pkg.price,
      city,
      startDate: start,
      endDate: addDays(start, 2),
      coverSeed: pkg.imageSeed,
      ownerId: user.id,
      roles: { create: pkg.roles.map((r, i) => ({ title: r.title, category: r.category, budget: Math.round(pkg.price * r.share), sort: i })) },
    },
  });
  if (!user.isClient) await db.user.update({ where: { id: user.id }, data: { isClient: true } });

  const from = user.company ?? user.name;
  for (const admin of await db.user.findMany({ where: { isAdmin: true } })) {
    await notify(admin.id, "Neue Paket-Anfrage", `${from} fragt „${pkg.name}“ an: ${title}.`, "/admin/managed");
    await sendMail(admin.email, `Paket-Anfrage: ${pkg.name}`, `${from} möchte das Paket „${pkg.name}“ buchen.\n\nProjekt: ${title}\nOrt: ${city}\nWunschtermin: ${date}${note ? `\n\n${note}` : ""}`);
  }
  await notify(user.id, "Paket angefragt", `Nesto und das Team stellen die Crew für „${pkg.name}“ zusammen und melden sich mit einem Angebot.`, `/projekte/${project.id}`);
  refresh();
  return { ok: true, message: `„${pkg.name}“ angefragt – wir melden uns mit einem Angebot.`, projectId: project.id };
}

const artistSchema = requestSchema.extend({
  budget: z.coerce.number().int().min(50, "Budget mindestens 50 €.").max(500_000),
});

export async function requestArtist(input: { creativeId: string; title: string; budget: number; city: string; date: string; note?: string }): Promise<Result> {
  const user = await requireUser();
  if (input.creativeId === user.id) return { ok: false, error: "Du kannst dich nicht selbst anfragen." };
  const parsed = artistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Eingaben prüfen." };
  const creative = await db.user.findUnique({ where: { id: input.creativeId }, include: { profile: true } });
  if (!creative?.isCreative || !creative.profile || creative.status === "gesperrt") return { ok: false, error: "Dieser Artist kann gerade nicht angefragt werden." };

  const { title, city, date, note, budget } = parsed.data;
  const category = parseJson<string[]>(creative.profile.categories, [])[0] ?? "musikproduktion";
  const roleTitle = categoryName(category);
  const start = startDate(date);

  const project = await db.project.create({
    data: {
      title, description: note || `Direkte Anfrage an ${creative.name}.`, type: "self", status: "anfragen", budget, city,
      startDate: start, endDate: addDays(start, 1), coverSeed: `cc-anfrage-${Date.now().toString(36)}`, ownerId: user.id,
      roles: { create: { title: roleTitle, category, budget } },
    },
    include: { roles: true },
  });
  await db.request.create({
    data: { projectId: project.id, roleId: project.roles[0].id, creativeId: creative.id, price: budget, status: "offen", note: note || `Anfrage als ${roleTitle} für „${title}“.` },
  });
  if (!user.isClient) await db.user.update({ where: { id: user.id }, data: { isClient: true } });

  const from = user.company ?? user.name;
  await notify(creative.id, "Neue Anfrage", `${from} fragt dich für „${title}“ an (${formatEur(budget)}).`, "/dashboard");
  await sendMail(
    creative.email,
    `Neue Anfrage: ${title}`,
    `Hallo ${creative.name.split(" ")[0]},\n\n${from} möchte dich für „${title}“ in ${city} anfragen. Honorar: ${formatEur(budget)}.${note ? `\n\n${note}` : ""}\n\nDu entscheidest frei: annehmen, ablehnen oder Gegenangebot.\n\nDein Creative-Connect-Team`,
  );
  refresh();
  return { ok: true, message: `Anfrage an ${creative.name} gesendet.`, projectId: project.id };
}

// Musik & Stock: Werk anhören/ansehen und die Nutzung beim Artist anfragen (noch kein Direktkauf).
// Läuft wie eine Artist-Anfrage – der Artist nimmt an, lehnt ab oder macht ein Gegenangebot.
const WORK_CATEGORY: Record<string, string> = { foto: "fotografie", footage: "videografie", artwork: "grafikdesign" };

const workSchema = z.object({
  usage: z.string().trim().min(3, "Bitte kurz beschreiben, wofür du das Werk nutzen willst.").max(120),
  budget: z.coerce.number().int().min(50, "Budget mindestens 50 €.").max(500_000),
  note: z.string().trim().max(1000).optional(),
});

export async function requestWork(input: { workId: string; usage: string; budget: number; note?: string }): Promise<Result> {
  const user = await requireUser();
  const parsed = workSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Eingaben prüfen." };
  const work = await db.licensableWork.findUnique({ where: { id: input.workId }, include: { owner: { include: { profile: true } } } });
  if (!work) return { ok: false, error: "Werk nicht gefunden." };
  if (work.ownerId === user.id) return { ok: false, error: "Das ist dein eigenes Werk." };

  const { usage, budget, note } = parsed.data;
  const category = WORK_CATEGORY[work.type] ?? "musikproduktion";
  const start = addDays(new Date(), 14);
  const title = `Nutzung „${work.title}“: ${usage}`;

  const project = await db.project.create({
    data: {
      title, description: [`Anfrage zur Nutzung von „${work.title}“ (/lizenzen/${work.slug}).`, note].filter(Boolean).join("\n\n"),
      type: "self", status: "anfragen", budget, city: work.owner.profile?.city ?? "Online",
      startDate: start, endDate: addDays(start, 1), coverSeed: work.imageSeed, ownerId: user.id,
      roles: { create: { title: `Nutzungsrechte: ${work.title}`, category, budget } },
    },
    include: { roles: true },
  });
  await db.request.create({
    data: { projectId: project.id, roleId: project.roles[0].id, creativeId: work.ownerId, price: budget, status: "offen", note: note || `Nutzung von „${work.title}“ für: ${usage}.` },
  });
  if (!user.isClient) await db.user.update({ where: { id: user.id }, data: { isClient: true } });

  const from = user.company ?? user.name;
  await notify(work.ownerId, "Anfrage für dein Werk", `${from} möchte „${work.title}“ nutzen (${formatEur(budget)}).`, "/dashboard");
  await sendMail(
    work.owner.email,
    `Anfrage für „${work.title}“`,
    `Hallo ${work.owner.name.split(" ")[0]},\n\n${from} möchte dein Werk „${work.title}“ nutzen.\n\nWofür: ${usage}\nBudget: ${formatEur(budget)}${note ? `\n\n${note}` : ""}\n\nDu entscheidest frei: annehmen, ablehnen oder Gegenangebot.\n\nDein Creative-Connect-Team`,
  );
  refresh();
  return { ok: true, message: `Anfrage an ${work.owner.name} gesendet.`, projectId: project.id };
}
