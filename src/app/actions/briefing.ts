"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { structureBriefing } from "@/lib/services/ai";
import { notify, sendMail } from "@/lib/services/mail";
import { suggestCrew } from "@/lib/matching";
import { CATEGORIES, categoryName } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import type { AnalyzedBriefing, CreateProjectInput, CrewSuggestion } from "@/components/briefing/types";

const MONTHS = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];

// Aus dem (freien) Termin-Text einen plausiblen Projektzeitraum ableiten – bleibt im Formular editierbar.
function guessDates(dates: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let start: Date | null = null;
  const d = dates.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/);
  if (d) {
    const year = d[3] ? (d[3].length === 2 ? 2000 + Number(d[3]) : Number(d[3])) : today.getFullYear();
    start = new Date(year, Number(d[2]) - 1, Number(d[1]), 12);
    if (!d[3] && start < today) start.setFullYear(start.getFullYear() + 1);
  } else {
    const m = MONTHS.findIndex((name) => dates.toLowerCase().includes(name));
    if (m >= 0) {
      start = new Date(today.getFullYear(), m, 1, 12);
      if (start < today) start.setFullYear(start.getFullYear() + 1);
    }
  }
  if (!start || Number.isNaN(start.getTime())) start = addDays(today, 30);
  const end = addDays(start, /wochenende/i.test(dates) ? 1 : 2);
  return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
}

async function suggestionsFor(category: string, budget: number, location: string, excludeIds: string[]): Promise<CrewSuggestion[]> {
  const list = await suggestCrew(category, budget, location, excludeIds);
  return list.map((s) => ({
    userId: s.user.id,
    name: s.user.name,
    slug: s.profile.slug,
    headline: s.profile.headline,
    city: s.profile.city,
    avatarSeed: s.profile.avatarSeed,
    dayRateMin: s.profile.dayRateMin,
    dayRateMax: s.profile.dayRateMax,
    ratingAvg: s.profile.ratingAvg,
    ratingCount: s.profile.ratingCount,
    verified: s.profile.verified,
    reasons: s.reasons,
  }));
}

export async function analyzeBriefing(raw: string): Promise<{ ok: true; briefing: AnalyzedBriefing } | { ok: false; error: string }> {
  const user = await requireUser();
  const text = raw.trim();
  if (text.length < 15) return { ok: false, error: "Beschreibe dein Projekt bitte in mindestens einem Satz." };

  const structured = await structureBriefing(text);
  const budget = Math.max(0, Math.round(structured.budget));

  // Rollenbudgets aus Prozentanteilen; Rundungsrest landet bei der ersten Rolle, damit die Summe stimmt.
  const shareSum = structured.roles.reduce((a, r) => a + r.sharePct, 0) || 100;
  const budgets = structured.roles.map((r) => Math.round((budget * (r.sharePct / shareSum)) / 10) * 10);
  const diff = budget - budgets.reduce((a, b) => a + b, 0);
  if (budgets.length) budgets[0] += diff;

  const roles = await Promise.all(
    structured.roles.map(async (r, i) => ({
      title: r.title,
      category: r.category,
      sharePct: r.sharePct,
      budget: budgets[i],
      reason: r.reason,
      suggestions: await suggestionsFor(r.category, budgets[i], structured.location, [user.id]),
    })),
  );

  return {
    ok: true,
    briefing: {
      source: structured.source,
      title: structured.title,
      goal: structured.goal,
      format: structured.format,
      dates: structured.dates,
      location: structured.location,
      style: structured.style,
      budget,
      ...guessDates(structured.dates),
      roles,
    },
  };
}

export async function suggestForRole(category: string, budget: number, location: string): Promise<CrewSuggestion[]> {
  const user = await requireUser();
  if (!CATEGORIES.some((c) => c.slug === category)) return [];
  return suggestionsFor(category, Math.max(0, Math.round(budget)), location, [user.id]);
}

const CreateSchema = z.object({
  rawText: z.string().max(5000),
  source: z.enum(["mock", "claude"]),
  title: z.string().trim().min(2).max(140),
  goal: z.string().max(1000),
  format: z.string().max(500),
  dates: z.string().max(300),
  location: z.string().trim().min(1).max(120),
  style: z.string().max(300),
  budget: z.number().int().min(0).max(10_000_000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["self", "managed"]),
  roles: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        category: z.string(),
        budget: z.number().int().min(0),
        selectedUserIds: z.array(z.string()).max(5),
      }),
    )
    .min(1)
    .max(10),
});

export async function createProjectFromBriefing(input: CreateProjectInput): Promise<{ error: string } | void> {
  const user = await requireUser();
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { error: "Bitte prüfe Titel, Ort, Termine und Rollen." };
  const data = parsed.data;
  const roleSum = data.roles.reduce((a, r) => a + r.budget, 0);
  if (roleSum !== data.budget) return { error: "Die Rollenbudgets müssen zusammen das Gesamtbudget ergeben." };

  const startDate = new Date(`${data.startDate}T12:00:00`);
  let endDate = new Date(`${data.endDate}T12:00:00`);
  if (endDate < startDate) endDate = startDate;

  const briefing = await db.briefing.create({
    data: {
      rawText: data.rawText,
      structured: JSON.stringify({
        title: data.title, goal: data.goal, format: data.format, dates: data.dates, location: data.location, style: data.style,
        budget: data.budget, source: data.source,
        roles: data.roles.map((r) => ({ title: r.title, category: r.category, budget: r.budget })),
      }),
      budget: data.budget,
      startDate,
      endDate,
      location: data.location,
      style: data.style,
    },
  });

  const managed = data.mode === "managed";
  const project = await db.project.create({
    data: {
      title: data.title,
      description: data.goal || data.rawText.slice(0, 280),
      type: data.mode,
      status: managed ? "entwurf" : "anfragen",
      managedStage: managed ? "anfrage" : null,
      budget: data.budget,
      city: data.location,
      startDate,
      endDate,
      coverSeed: `cc-project-${briefing.id}`,
      ownerId: user.id,
      briefingId: briefing.id,
    },
  });

  await db.milestone.createMany({
    data: [
      { projectId: project.id, title: "Briefing abgestimmt", dueDate: new Date(), done: true },
      { projectId: project.id, title: "Crew bestätigt", dueDate: addDays(startDate, -14) },
      { projectId: project.id, title: "Vorproduktion", dueDate: addDays(startDate, -5) },
      { projectId: project.id, title: "Dreh / Session", dueDate: startDate },
      { projectId: project.id, title: "Erste Fassung", dueDate: addDays(endDate, 7) },
      { projectId: project.id, title: "Finale Abgabe", dueDate: addDays(endDate, 14) },
    ],
  });

  const ownerLabel = user.company ?? user.name;
  for (const [i, r] of data.roles.entries()) {
    const role = await db.projectRole.create({
      data: { projectId: project.id, title: r.title, category: r.category, budget: r.budget, sort: i },
    });
    const ids = [...new Set(r.selectedUserIds)].filter((id) => id !== user.id);
    const creatives = await db.user.findMany({ where: { id: { in: ids }, isCreative: true, status: { not: "gesperrt" } } });
    for (const c of creatives) {
      await db.request.create({
        data: {
          projectId: project.id, roleId: role.id, creativeId: c.id, price: r.budget, status: "offen",
          note: `${ownerLabel} würde dich gern als ${r.title} für „${data.title}“ anfragen.`,
        },
      });
      await notify(c.id, "Neue Anfrage", `${ownerLabel} fragt dich als ${r.title} für „${data.title}“ an (${formatEur(r.budget)}).`, "/dashboard");
      await sendMail(
        c.email,
        `Neue Anfrage: ${data.title}`,
        `Hallo ${c.name.split(" ")[0]},\n\n${ownerLabel} möchte dich als ${r.title} (${categoryName(r.category)}) für „${data.title}“ in ${data.location} anfragen. Honorar: ${formatEur(r.budget)}.\n\nÖffne Creative Connect, um anzunehmen, abzulehnen oder ein Gegenangebot zu machen.\n\nDein Creative-Connect-Team`,
      );
    }
  }

  if (managed) {
    const admins = await db.user.findMany({ where: { isAdmin: true } });
    for (const a of admins) {
      await notify(a.id, "Managed-Crew-Anfrage", `${ownerLabel} möchte für „${data.title}“ eine Managed Crew.`, "/admin/managed");
      await sendMail(a.email, `Managed-Crew-Anfrage: ${data.title}`, `${ownerLabel} hat eine Managed Crew angefragt.\n\nBudget: ${formatEur(data.budget)}\nOrt: ${data.location}\nZeitraum: ${data.dates}\n\nBitte Angebot erstellen.`);
    }
  }

  revalidatePath("/projekte");
  revalidatePath("/dashboard");
  redirect(`/projekte/${project.id}?tab=crew`);
}
