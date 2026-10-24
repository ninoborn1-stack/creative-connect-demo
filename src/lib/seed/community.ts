// Seed für den Community-Teil: Nestos Produktionskalender, Session-Buchungen, Punkte-Journal, Belohnungen.
import type { PrismaClient } from "@prisma/client";
import { addDays, addHours, startOfWeek } from "date-fns";
import { POINT_RULES, SESSION_TYPES } from "@/lib/constants";

type Ctx = {
  rand: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  pickMany: <T>(arr: readonly T[], n: number) => T[];
  today: Date;
  nestoId: string;
  juleId: string;
  kundeId: string;
  creatives: { id: string; name: string; category: string }[];
  doneProjects: { id: string; title: string; assignees: string[] }[];
};

const STUDIO = "Nestos Studio, Berlin-Kreuzberg";

// Wiederkehrender Wochenplan (Wochentag 0 = Montag)
const WEEK_PLAN = [
  { day: 0, type: "beat", start: 14, end: 17, capacity: 2, title: "Beat-Session: Drums & Bounce" },
  { day: 1, type: "songwriting", start: 15, end: 18, capacity: 2, title: "Songwriting-Session" },
  { day: 2, type: "mix-feedback", start: 18, end: 19, capacity: 1, title: "Mix-Feedback 1:1" },
  { day: 2, type: "mix-feedback", start: 19, end: 20, capacity: 1, title: "Mix-Feedback 1:1" },
  { day: 3, type: "open-studio", start: 19, end: 23, capacity: 12, title: "Open Studio Night" },
  { day: 4, type: "beat", start: 11, end: 14, capacity: 2, title: "Beat-Session: Samples flippen" },
];

const WORKSHOPS = ["Workshop: Vocals aufnehmen wie im Profi-Studio", "Workshop: Arrangement in 60 Minuten", "Workshop: Release-Plan für Independents", "Workshop: Mixdown-Grundlagen"];

const REWARDS = [
  { slug: "mix-feedback", title: "Mix-Feedback von Nesto", description: "30 Minuten 1:1 – Nesto hört deinen Mix und gibt konkrete Tipps.", cost: 300, kind: "session" },
  { slug: "studiostunde", title: "1 Stunde Studiozeit bei Nesto", description: "Eine Stunde in Nestos Studio inkl. Engineer, frei einlösbar.", cost: 500, kind: "studio" },
  { slug: "spotlight", title: "Spotlight im Netzwerk", description: "Dein Release wird im Feed und im Netzwerk-Newsletter vorgestellt.", cost: 200, kind: "sichtbarkeit" },
  { slug: "merch", title: "Creative-Connect-Merch", description: "Hoodie + Tote Bag aus der ersten Kollektion.", cost: 400, kind: "merch", stock: 25 },
  { slug: "prio-slot", title: "Priorität bei Nesto-Sessions", description: "Einen Monat lang 48 Stunden früher buchen als alle anderen.", cost: 600, kind: "session" },
  { slug: "gaesteliste", title: "Gästeliste Release-Party", description: "+1 auf der Gästeliste der nächsten Netzwerk-Party.", cost: 150, kind: "event", stock: 40 },
];

export async function seedCommunity(db: PrismaClient, ctx: Ctx) {
  const { rand, int, pick, pickMany, today, nestoId, juleId, kundeId, creatives, doneProjects } = ctx;
  const others = creatives.filter((c) => c.id !== nestoId);
  const musicPeople = others.filter((c) => ["musikproduktion", "tonstudio", "schauspiel"].includes(c.category));
  const pointRows: { userId: string; points: number; kind: string; reason: string; refId?: string; createdAt: Date }[] = [];

  // ---------- Belohnungen ----------
  for (const r of REWARDS) {
    await db.reward.create({ data: { ...r, imageSeed: `cc-reward-${r.slug}` } });
  }

  // ---------- Sessions: 6 Wochen zurück bis 4 Wochen voraus ----------
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  let juleUpcomingBooked = false;
  let julePastCount = 0;

  for (let w = -6; w <= 3; w++) {
    const monday = addDays(thisMonday, w * 7);
    const plan = [...WEEK_PLAN];
    if (w % 2 === 0) plan.push({ day: 5, type: "workshop", start: 12, end: 16, capacity: 8, title: WORKSHOPS[(w + 6) % WORKSHOPS.length] });
    if (w % 3 === 0) plan.push({ day: 2, type: "podcast", start: 11, end: 13, capacity: 2, title: "Netzwerk-Podcast: Aufnahme" });

    for (const slot of plan) {
      const date = addDays(monday, slot.day);
      const past = date < today;
      const meta = SESSION_TYPES[slot.type];
      const session = await db.nestoSession.create({
        data: {
          hostId: nestoId, type: slot.type, title: slot.title, description: meta.description, date,
          startHour: slot.start, endHour: slot.end, location: STUDIO, capacity: slot.capacity, points: meta.points,
          createdAt: addDays(date, -21),
        },
      });

      // Auslastung: Vergangenheit fast voll, Zukunft teilweise frei
      const fill = past ? Math.max(1, Math.round(slot.capacity * (0.6 + rand() * 0.4))) : Math.floor(slot.capacity * rand() * 0.7);
      const guests = new Set(pickMany(slot.type === "open-studio" || slot.type === "workshop" ? others : musicPeople, fill).map((c) => c.id));

      // Jule: einige vergangene Sessions, eine kommende Buchung
      if (past && julePastCount < 6 && ["open-studio", "workshop", "mix-feedback", "songwriting"].includes(slot.type) && rand() > 0.2) {
        guests.add(juleId);
        julePastCount++;
      }
      if (!past && !juleUpcomingBooked && slot.type === "open-studio" && date > addDays(today, 1)) {
        guests.add(juleId);
        juleUpcomingBooked = true;
      }
      if (!past && slot.type === "open-studio" && w === 1) guests.add(kundeId);

      // Demo-Personen zuerst, damit sie bei voller Kapazität nicht herausfallen
      const ordered = [...guests].sort((a, b) => Number([juleId, kundeId].includes(b)) - Number([juleId, kundeId].includes(a)));
      for (const userId of ordered.slice(0, slot.capacity)) {
        const attended = past && rand() > 0.08;
        await db.sessionBooking.create({
          data: {
            sessionId: session.id, userId, status: past ? (attended ? "teilgenommen" : "abgesagt") : "gebucht",
            note: !past && rand() > 0.6 ? pick(["Bringe zwei Beat-Skizzen mit.", "Würde gern an meiner Hook arbeiten.", "Erstes Mal dabei – freue mich!", "Habe einen Mix, der nicht laut genug wird."]) : null,
            createdAt: addDays(date, -int(2, 12)),
          },
        });
        if (attended) {
          pointRows.push({ userId, points: session.points, kind: "session", reason: `${slot.title} mit Nesto`, refId: session.id, createdAt: addHours(date, slot.end) });
        }
      }
    }
  }

  // ---------- Punkte aus bisherigen Aktivitäten ----------
  for (const c of others) {
    pointRows.push({ userId: c.id, points: 50, kind: "bonus", reason: "Willkommensbonus im Netzwerk", createdAt: addDays(today, -int(60, 300)) });
  }
  // Gründungsmitglieder (von Nesto persönlich eingeladen) bekommen einen Startbonus
  const founders = await db.user.findMany({ where: { invitedById: nestoId, isCreative: true }, select: { id: true } });
  for (const f of founders) {
    pointRows.push({ userId: f.id, points: 200, kind: "bonus", reason: "Gründungsmitglied – von Nesto eingeladen", createdAt: addDays(today, -int(200, 330)) });
  }
  for (const p of doneProjects) {
    for (const a of p.assignees) pointRows.push({ userId: a, points: POINT_RULES.projekt.points, kind: "projekt", reason: `${POINT_RULES.projekt.label}: ${p.title}`, refId: p.id, createdAt: addDays(today, -int(10, 200)) });
  }
  const [posts, rsvps, reviews, invitees] = await Promise.all([
    db.post.findMany({ select: { id: true, authorId: true, createdAt: true } }),
    db.rSVP.findMany({ select: { id: true, userId: true, eventId: true } }),
    db.review.findMany({ select: { id: true, authorId: true, createdAt: true } }),
    db.user.findMany({ where: { invitedById: { not: null } }, select: { id: true, name: true, invitedById: true, createdAt: true } }),
  ]);
  for (const p of posts) pointRows.push({ userId: p.authorId, points: POINT_RULES.post.points, kind: "post", reason: POINT_RULES.post.label, refId: p.id, createdAt: p.createdAt });
  for (const r of rsvps) pointRows.push({ userId: r.userId, points: POINT_RULES.event.points, kind: "event", reason: POINT_RULES.event.label, refId: r.eventId, createdAt: addDays(today, -int(1, 90)) });
  for (const r of reviews) pointRows.push({ userId: r.authorId, points: POINT_RULES.bewertung.points, kind: "bewertung", reason: POINT_RULES.bewertung.label, refId: r.id, createdAt: r.createdAt });
  for (const u of invitees) {
    if (u.invitedById && u.invitedById !== nestoId) pointRows.push({ userId: u.invitedById, points: POINT_RULES.einladung.points, kind: "einladung", reason: `${u.name} ist über deine Einladung beigetreten`, refId: u.id, createdAt: u.createdAt });
  }

  // ---------- Einlösungen (negativ) ----------
  const balances = new Map<string, number>();
  for (const r of pointRows) balances.set(r.userId, (balances.get(r.userId) ?? 0) + r.points);
  const rewards = await db.reward.findMany();
  const rich = [...balances.entries()].filter(([id, b]) => b > 400 && id !== juleId).slice(0, 8);
  for (const [userId] of rich) {
    const reward = pick(rewards.filter((r) => r.cost <= 400));
    await db.rewardRedemption.create({ data: { rewardId: reward.id, userId, status: rand() > 0.4 ? "eingeloest" : "offen", createdAt: addDays(today, -int(2, 40)) } });
    pointRows.push({ userId, points: -reward.cost, kind: "einloesung", reason: `Eingelöst: ${reward.title}`, refId: reward.id, createdAt: addDays(today, -int(2, 40)) });
  }
  // Jule hat schon einmal ein Spotlight eingelöst
  const spotlight = rewards.find((r) => r.slug === "spotlight")!;
  await db.rewardRedemption.create({ data: { rewardId: spotlight.id, userId: juleId, status: "eingeloest", createdAt: addDays(today, -18) } });
  pointRows.push({ userId: juleId, points: -spotlight.cost, kind: "einloesung", reason: `Eingelöst: ${spotlight.title}`, refId: spotlight.id, createdAt: addDays(today, -18) });

  await db.pointEvent.createMany({ data: pointRows });
}
