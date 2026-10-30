// Reproduzierbarer Demo-Seed (fester Zufalls-Seed). Wird von `pnpm db:seed` und vom Admin-Button „Demo zurücksetzen“ genutzt.
import type { PrismaClient } from "@prisma/client";
import { addDays, addHours, startOfDay, subMonths, format } from "date-fns";
import { CATEGORIES, CITIES, CONTRACT_TEMPLATES, DEFAULT_FEES } from "@/lib/constants";
import {
  ARTICLES, BIOS, CHAT_LINES, CLIENTS, COMMENTS, EQUIPMENT, EVENTS, FIRST_NAMES, HEADLINES, LAST_NAMES, POSTS,
  PROJECT_IDEAS, RATES, REVIEW_TEXTS, SKILLS, VENUES,
} from "./data";
import { seedCommunity } from "./community";
import { seedCorporate } from "./corporate";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AUDIO_FILES = 8;

export async function runSeed(db: PrismaClient) {
  const rand = mulberry32(20261023);
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const pickMany = <T,>(arr: readonly T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);
  const today = startOfDay(new Date());
  const slugify = (s: string) =>
    s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // ---------- Reset (Reihenfolge wegen Fremdschlüsseln) ----------
  await db.$transaction([
    db.auditLog.deleteMany(), db.outboxMail.deleteMany(), db.notification.deleteMany(), db.profileView.deleteMany(),
    db.dispute.deleteMany(), db.review.deleteMany(), db.credit.deleteMany(), db.invoice.deleteMany(), db.payment.deleteMany(),
    db.contract.deleteMany(), db.file.deleteMany(), db.message.deleteMany(), db.milestone.deleteMany(), db.request.deleteMany(),
    db.projectRole.deleteMany(), db.project.deleteMany(), db.briefing.deleteMany(), db.venueBooking.deleteMany(), db.venue.deleteMany(),
    db.rSVP.deleteMany(), db.event.deleteMany(), db.like.deleteMany(), db.comment.deleteMany(), db.post.deleteMany(),
    db.article.deleteMany(), db.equipmentListing.deleteMany(), db.portfolioItem.deleteMany(), db.invite.deleteMany(),
    db.waitlistEntry.deleteMany(), db.profile.deleteMany(), db.kpiSnapshot.deleteMany(), db.category.deleteMany(),
    db.setting.deleteMany(), db.rewardRedemption.deleteMany(), db.reward.deleteMany(), db.pointEvent.deleteMany(),
    db.sessionBooking.deleteMany(), db.nestoSession.deleteMany(),
    db.pitch.deleteMany(), db.opportunity.deleteMany(), db.license.deleteMany(), db.licensableWork.deleteMany(),
    db.connection.deleteMany(), db.companyFollow.deleteMany(), db.creativeApplication.deleteMany(),
  ]);
  await db.user.updateMany({ data: { invitedById: null, companyId: null } });
  await db.user.deleteMany();
  await db.company.deleteMany();

  // ---------- Einstellungen & Kategorien ----------
  await db.setting.createMany({
    data: [
      // Phase 2: Unternehmen können sich registrieren (Fokus Corporate/Licensing laut Kunden-Feedback)
      { key: "marketplaceMode", value: "clients" },
      { key: "fees", value: JSON.stringify(DEFAULT_FEES) },
    ],
  });
  await db.category.createMany({
    data: CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, description: c.description, icon: c.icon, sort: i })),
  });

  // ---------- Personen ----------
  type Creative = { id: string; name: string; category: string; city: string; dayRateMin: number };
  const creatives: Creative[] = [];

  async function createCreative(opts: {
    email: string; name: string; category: string; extraCategory?: string; city: (typeof CITIES)[number];
    isAdmin?: boolean; isClient?: boolean; invitedById?: string; verified?: boolean; isPro?: boolean; monthsAgo?: number;
    headline?: string; bio?: string;
  }) {
    const slug = slugify(opts.name);
    const [lo, hi] = RATES[opts.category];
    const dayRateMin = Math.round(int(lo, (lo + hi) / 2) / 10) * 10;
    const dayRateMax = dayRateMin + Math.round(int(150, 600) / 10) * 10;
    const cats = opts.extraCategory ? [opts.category, opts.extraCategory] : [opts.category];
    const skills = pickMany(SKILLS[opts.category], int(3, 5));
    const availability = pick(["verfuegbar", "verfuegbar", "teilweise", "ausgebucht"]);
    const verified = opts.verified ?? rand() > 0.3;
    const busy = Array.from({ length: int(2, 8) }, () => format(addDays(today, int(0, 60)), "yyyy-MM-dd"));
    const user = await db.user.create({
      data: {
        email: opts.email, password: "demo", name: opts.name, isAdmin: !!opts.isAdmin, isCreative: true, isClient: !!opts.isClient,
        status: verified ? "verifiziert" : "aktiv", invitedById: opts.invitedById,
        createdAt: subMonths(today, opts.monthsAgo ?? int(1, 14)),
        profile: {
          create: {
            slug, headline: opts.headline ?? pick(HEADLINES[opts.category]), bio: opts.bio ?? pick(BIOS[opts.category]),
            city: opts.city.name, state: opts.city.state, lat: opts.city.lat + (rand() - 0.5) * 0.08, lng: opts.city.lng + (rand() - 0.5) * 0.08,
            travelRadiusKm: pick([50, 100, 250, 500, 800]), categories: JSON.stringify(cats), skills: JSON.stringify(skills),
            dayRateMin, dayRateMax, availability, busyDates: JSON.stringify(busy), isPro: opts.isPro ?? rand() > 0.82,
            verified, instagram: `@${slug.replace(/-/g, ".")}`, website: rand() > 0.5 ? `https://${slug}.example` : null,
            taxIdProvided: rand() > 0.2, kskMember: rand() > 0.4, avatarSeed: `cc-${slug}`, coverSeed: `cc-cover-${slug}`,
            heightCm: opts.category === "schauspiel" ? int(158, 192) : null,
            hairColor: opts.category === "schauspiel" ? pick(["Braun", "Schwarz", "Blond", "Rot", "Dunkelblond"]) : null,
            eyeColor: opts.category === "schauspiel" ? pick(["Braun", "Blau", "Grün", "Grau"]) : null,
            playingAge: opts.category === "schauspiel" ? pick(["20–28", "25–35", "30–40", "18–25"]) : null,
            languages: opts.category === "schauspiel" ? pick(["Deutsch, Englisch", "Deutsch, Türkisch, Englisch", "Deutsch, Französisch"]) : null,
            equipment: opts.category === "tonstudio" || opts.category === "musikproduktion"
              ? JSON.stringify(pickMany(["Neumann U87", "SSL Bus Compressor", "Universal Audio Apollo", "Yamaha NS10", "Moog Sub 37", "Ableton Push 3", "Genelec 8351", "Neve 1073 Preamp"], 4))
              : null,
            topClientShare: int(12, 58),
            memberSince: subMonths(today, opts.monthsAgo ?? int(1, 14)),
          },
        },
      },
    });

    // Portfolio je Bereich
    const portfolio: { type: string; title: string; credits?: string; imageSeed?: string; audioUrl?: string; aiMarked?: boolean }[] = [];
    if (opts.category === "musikproduktion" || opts.category === "tonstudio") {
      for (let i = 0; i < 3; i++)
        portfolio.push({ type: "audio", title: pick(["Nachtfahrt", "Glas", "Beton & Blumen", "Kreise", "Lichtjahre", "Sonntag", "Echo"]) + ` (Demo ${i + 1})`, credits: pick(["Produktion", "Mix & Master", "Recording"]), audioUrl: `/demo-audio/demo-${int(1, AUDIO_FILES)}.wav`, imageSeed: `cc-audio-${slug}-${i}` });
    }
    if (opts.category === "videografie") {
      portfolio.push({ type: "video", title: "Showreel 2026", imageSeed: `cc-reel-${slug}` });
      portfolio.push({ type: "video", title: pick(["Musikvideo „Kreise“", "Kampagne Fernweh", "Tourdoku Teil 1"]), imageSeed: `cc-reel2-${slug}` });
    }
    if (["fotografie", "grafikdesign", "schauspiel", "booking", "videografie"].includes(opts.category)) {
      for (let i = 0; i < 6; i++)
        portfolio.push({ type: "bild", title: pick(["Cover", "Portrait", "Kampagne", "Backstage", "Lookbook", "Location", "Plakat"]) + ` ${i + 1}`, imageSeed: `cc-pf-${slug}-${i}`, aiMarked: opts.category === "grafikdesign" && i === 5 });
    }
    if (portfolio.length)
      await db.portfolioItem.createMany({ data: portfolio.map((p, i) => ({ ...p, userId: user.id, sort: i })) });

    creatives.push({ id: user.id, name: opts.name, category: opts.category, city: opts.city.name, dayRateMin });
    return user;
  }

  const berlin = CITIES[0];
  const nesto = await createCreative({
    email: "admin@demo.cc", name: "Nesto", category: "musikproduktion", city: berlin, isAdmin: true, isClient: true,
    verified: true, isPro: true, monthsAgo: 14, headline: "Gründer · Musikproduzent mit Diplom",
    bio: "Seit über zehn Jahren in Musik und Medien unterwegs. Ich habe Creative Connect gegründet, weil mein Netzwerk größer ist, als ich es allein ausschöpfen kann – jetzt bucht ihr euch gegenseitig.",
  });
  const jule = await createCreative({
    email: "kreativ@demo.cc", name: "Jule Brandt", category: "videografie", extraCategory: "fotografie", city: CITIES[5],
    isClient: true, invitedById: nesto.id, verified: true, isPro: true, monthsAgo: 11,
    headline: "Regie & Kamera für Musikvideos", bio: "Ich mache Musikvideos und Kampagnen mit kleinem Team und großem Look. Konzept, Dreh und Schnitt aus einer Hand – und wenn ich selbst eine Crew brauche, buche ich sie hier im Netzwerk.",
  });

  // 59 weitere Kreative, alle Bereiche, alle 15 Städte, Einladungsbaum
  const catCycle = CATEGORIES.map((c) => c.slug);
  for (let i = 0; i < 59; i++) {
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 11 + 3) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    if (creatives.some((c) => c.name === name)) continue;
    const category = catCycle[i % catCycle.length];
    const inviter = i < 10 ? nesto.id : pick(creatives).id;
    await createCreative({
      email: `${slugify(first)}.${slugify(last)}@demo.cc`, name, category, city: CITIES[i % CITIES.length], invitedById: inviter,
      extraCategory: rand() > 0.8 ? pick(catCycle.filter((c) => c !== category)) : undefined,
    });
  }

  // Auftraggeber:innen
  const clients: { id: string; name: string; company: string }[] = [];
  for (const c of CLIENTS) {
    const u = await db.user.create({
      data: {
        email: c.email ?? `${slugify(c.company)}@demo.cc`, password: "demo", name: c.name, company: c.company, clientType: c.type,
        isClient: true, status: "verifiziert", invitedById: nesto.id, createdAt: subMonths(today, int(1, 10)),
      },
    });
    clients.push({ id: u.id, name: c.name, company: c.company });
  }
  const kunde = clients[0];

  // ---------- Einladungen & Warteliste ----------
  await db.invite.createMany({
    data: [
      { code: "CC-DEMO-2026", senderId: nesto.id, status: "offen", expiresAt: addDays(today, 30) },
      { code: "CC-ALT-2023", senderId: nesto.id, status: "abgelaufen", expiresAt: subMonths(today, 20) },
      { code: "JULE-NETZWERK", senderId: jule.id, status: "offen", expiresAt: addDays(today, 21) },
      ...Array.from({ length: 14 }, (_, i) => ({
        code: `CC-${(1000 + i * 37).toString(36).toUpperCase()}-${i}`,
        senderId: i % 3 === 0 ? nesto.id : pick(creatives).id,
        status: i < 6 ? "eingeloest" : i < 11 ? "offen" : "abgelaufen",
        expiresAt: i < 11 ? addDays(today, int(5, 40)) : subMonths(today, 1),
        redeemedAt: i < 6 ? subMonths(today, int(1, 6)) : null,
      })),
    ],
  });
  await db.waitlistEntry.createMany({
    data: [
      { name: "Kai Lehmann", email: "kai@example.org", category: "videografie", city: "Bremen", message: "Habe über Jule von euch gehört." },
      { name: "Sina Ahmadi", email: "sina@example.org", category: "fotografie", city: "Hannover" },
      { name: "Oskar Thiel", email: "oskar@example.org", category: "musikproduktion", city: "Mannheim", message: "Produziere seit 5 Jahren Techno und House." },
      { name: "Dana Petrov", email: "dana@example.org", category: "schauspiel", city: "Köln" },
      { name: "Ruben Weiß", email: "ruben@example.org", category: "booking", city: "Nürnberg", status: "eingeladen" },
      { name: "Elif Tan", email: "elif@example.org", category: "grafikdesign", city: "Essen" },
    ],
  });

  // ---------- Studios & Locations ----------
  // Feste Stock-Motive je Raumtyp (Plattenspieler, Klavier, Kamera, Bühne …), damit die Bilder zum Raum passen
  const VENUE_PHOTOS: Record<string, number[]> = {
    tonstudio: [39, 1082, 145, 180],
    fotostudio: [250, 435, 823, 628],
    proberaum: [145, 453, 1082, 39],
    location: [42, 452, 513, 453],
  };
  const venueIds: string[] = [];
  const photoTurn: Record<string, number> = {};
  for (const [i, v] of VENUES.entries()) {
    const turn = (photoTurn[v.type] = (photoTurn[v.type] ?? -1) + 1);
    const owner = creatives.find((c) => c.city === v.city && (c.category === "tonstudio" || c.category === "booking")) ?? (i === 0 ? creatives[1] : pick(creatives));
    const city = CITIES.find((c) => c.name === v.city)!;
    const venue = await db.venue.create({
      data: {
        slug: slugify(v.name), ownerId: i === 0 ? jule.id : owner.id, name: v.name, type: v.type, city: v.city,
        address: `${pick(["Hafenstraße", "Gleisdreieck", "Industrieweg", "Am Kanal", "Werkstraße", "Lindenallee"])} ${int(1, 120)}, ${v.city}`,
        description: `${v.name} liegt mitten in ${v.city} (${city.state}) und ist Teil des Creative-Connect-Netzwerks. ${pick(["Ideal für Recording-Sessions und Podcasts.", "Perfekt für Shootings und Drehs mit kleinem Team.", "Raum für Events, Drehs und Release-Partys."])}`,
        features: JSON.stringify(v.features), pricePerHour: v.hour, pricePerDay: v.day, capacity: v.cap,
        imageSeeds: JSON.stringify([0, 1, 2, 3].map((n) => { const pool = VENUE_PHOTOS[v.type] ?? VENUE_PHOTOS.location; return `id:${pool[(n + turn) % pool.length]}`; })), ratingAvg: Math.round((4 + rand()) * 10) / 10,
      },
    });
    venueIds.push(venue.id);
    for (let b = 0; b < int(3, 7); b++) {
      const full = rand() > 0.6;
      const start = full ? 9 : int(9, 16);
      const end = full ? 21 : start + int(2, 5);
      await db.venueBooking.create({
        data: {
          venueId: venue.id, userId: pick([...creatives.map((c) => c.id), kunde.id]), date: addDays(today, int(-20, 40)),
          startHour: start, endHour: end, fullDay: full, amount: full ? v.day : (end - start) * v.hour,
        },
      });
    }
  }

  // ---------- Projekte ----------
  // Status-Verteilung über alle Phasen; 3 Managed Crews; 2 Streitfälle
  const plan: { status: string; type: "self" | "managed"; owner: string; managedStage?: string; dispute?: boolean }[] = [
    { status: "produktion", type: "self", owner: kunde.id },
    { status: "anfragen", type: "self", owner: kunde.id },
    { status: "abnahme", type: "self", owner: kunde.id },
    { status: "abgeschlossen", type: "self", owner: kunde.id },
    { status: "produktion", type: "managed", owner: clients[1].id, managedStage: "produktion" },
    { status: "bestaetigt", type: "self", owner: clients[4].id },
    { status: "abgeschlossen", type: "self", owner: clients[8].id },
    { status: "anfragen", type: "managed", owner: clients[10].id, managedStage: "angebot" },
    { status: "abgeschlossen", type: "self", owner: jule.id },
    { status: "abnahme", type: "self", owner: clients[2].id, dispute: true },
    { status: "entwurf", type: "managed", owner: clients[11].id, managedStage: "anfrage" },
    { status: "abgeschlossen", type: "self", owner: clients[11].id },
    { status: "produktion", type: "self", owner: clients[2].id, dispute: true },
    { status: "storniert", type: "self", owner: clients[9].id },
    { status: "abgeschlossen", type: "self", owner: clients[6].id },
  ];

  const julesCats = ["videografie", "fotografie"];
  const allProjects: { id: string; status: string; title: string; ownerId: string; assignees: string[] }[] = [];

  for (const [i, idea] of PROJECT_IDEAS.entries()) {
    const p = plan[i];
    const done = p.status === "abgeschlossen";
    const startOffset = done ? -int(30, 300) : p.status === "entwurf" || p.status === "anfragen" ? int(10, 50) : int(-10, 20);
    const startDate = addDays(today, startOffset);
    const briefing = await db.briefing.create({
      data: {
        rawText: `${idea.desc} Ort: ${idea.city}. Budget ${idea.budget} €.`,
        structured: JSON.stringify({ title: idea.title, goal: idea.desc, format: "Siehe Rollen", dates: "Siehe Zeitplan", location: idea.city, style: pick(["Cinematic", "Analog, warm", "Urban, clean", "Düster, Neon"]), budget: idea.budget }),
        budget: idea.budget, location: idea.city,
      },
    });
    const project = await db.project.create({
      data: {
        title: idea.title, description: idea.desc, type: p.type, status: p.status, managedStage: p.managedStage, budget: idea.budget,
        city: idea.city, startDate, endDate: addDays(startDate, int(1, 10)), coverSeed: `cc-project-${slugify(idea.title)}`,
        ownerId: p.owner, createdAt: addDays(startDate, -int(10, 40)),
        briefingId: briefing.id,
      },
    });

    const assignees: string[] = [];
    const shares = idea.roles.map(() => int(2, 5));
    const shareSum = shares.reduce((a, b) => a + b, 0);
    for (const [r, [title, cat]] of idea.roles.entries()) {
      const roleBudget = Math.round((idea.budget * shares[r]) / shareSum / 10) * 10;
      // Jule ist in mehreren Kundenprojekten gebucht
      const juleFits = julesCats.includes(cat) && p.owner !== jule.id && !assignees.includes(jule.id) && [0, 2, 3, 5, 9].includes(i);
      const candidatePool = creatives.filter((c) => c.category === cat && c.id !== p.owner && !assignees.includes(c.id));
      const person = juleFits ? creatives.find((c) => c.id === jule.id)! : pick(candidatePool.length ? candidatePool : creatives);
      const filled = !["entwurf", "anfragen"].includes(p.status) || (p.status === "anfragen" && r === 0);
      const role = await db.projectRole.create({
        data: { projectId: project.id, title, category: cat, budget: roleBudget, assigneeId: filled ? person.id : null, sort: r },
      });
      if (filled) assignees.push(person.id);
      if (p.status !== "entwurf") {
        await db.request.create({
          data: { projectId: project.id, roleId: role.id, creativeId: person.id, price: roleBudget, status: filled ? "angenommen" : "offen", note: "Hast du Lust auf das Projekt?" },
        });
        if (!filled) {
          const alt = pick(candidatePool.filter((c) => c.id !== person.id).length ? candidatePool.filter((c) => c.id !== person.id) : creatives);
          await db.request.create({
            data: { projectId: project.id, roleId: role.id, creativeId: alt.id, price: roleBudget, status: rand() > 0.5 ? "gegenangebot" : "abgelehnt", counterPrice: Math.round(roleBudget * 1.15), note: "Parallele Anfrage" },
          });
        }
      }
    }
    // offene Anfrage an Jule als Demo im Kreativ-Dashboard
    if (i === 1 || i === 7) {
      const role = await db.projectRole.findFirst({ where: { projectId: project.id, assigneeId: null } });
      if (role) await db.request.create({ data: { projectId: project.id, roleId: role.id, creativeId: jule.id, price: role.budget, status: "offen", note: "Wir würden dich gern für das Projekt anfragen – passt der Termin?" } });
    }

    // Meilensteine
    const ms = ["Briefing abgestimmt", "Crew bestätigt", "Vorproduktion", "Dreh / Session", "Erste Fassung", "Finale Abgabe"];
    const progressIdx = { entwurf: 0, anfragen: 1, bestaetigt: 2, produktion: 3, abnahme: 5, abgeschlossen: 6, storniert: 1 }[p.status] ?? 0;
    await db.milestone.createMany({
      data: ms.map((t, m) => ({ projectId: project.id, title: t, dueDate: addDays(startDate, (m - 2) * 4), done: m < progressIdx })),
    });

    // Chat und Dateien
    if (assignees.length && p.status !== "entwurf") {
      const people = [p.owner, ...assignees];
      for (const [m, line] of CHAT_LINES.entries())
        await db.message.create({ data: { projectId: project.id, authorId: people[m % people.length], body: line, createdAt: addHours(addDays(startDate, -5), m * 3) } });
      await db.file.createMany({
        data: [
          { projectId: project.id, uploaderId: p.owner, name: "Moodboard.pdf", sizeKb: 4820, url: "#" },
          { projectId: project.id, uploaderId: assignees[0], name: "Zeitplan_Dreh.xlsx", sizeKb: 38, url: "#" },
          { projectId: project.id, uploaderId: p.owner, name: "Referenzen.zip", sizeKb: 15200, url: "#" },
        ],
      });
    }

    // Vertrag, Zahlung, Rechnung (ab bestätigter Crew)
    const ownerName = clients.find((c) => c.id === p.owner)?.company ?? creatives.find((c) => c.id === p.owner)?.name ?? "Auftraggeber:in";
    if (["bestaetigt", "produktion", "abnahme", "abgeschlossen"].includes(p.status)) {
      const template = idea.roles[0][1] === "tonstudio" ? "studiomiete" : idea.roles.some(([, c]) => c === "fotografie" || c === "videografie") ? "nutzungsrechte" : "werkvertrag";
      await db.contract.create({
        data: {
          projectId: project.id, template, title: `${CONTRACT_TEMPLATES[template].title} – ${idea.title}`, partyA: ownerName,
          partyB: assignees.map((a) => creatives.find((c) => c.id === a)?.name).join(", "), service: idea.desc,
          usageRights: template === "nutzungsrechte" ? "Einfaches Nutzungsrecht, Online & Social Media, Deutschland, 24 Monate" : "Nach Abnahme vollständig auf Auftraggeber:in übertragen",
          compensation: idea.budget, signedA: true, signedB: p.status !== "bestaetigt", signedAName: ownerName, signedBName: p.status !== "bestaetigt" ? "Crew (gesammelt)" : null,
          signedAt: addDays(startDate, -7),
        },
      });
      const payStatus = p.status === "abgeschlossen" ? "ausgezahlt" : p.status === "abnahme" && !p.dispute ? "freigegeben" : "reserviert";
      const roles = await db.projectRole.findMany({ where: { projectId: project.id } });
      for (const role of roles) {
        await db.payment.create({
          data: {
            projectId: project.id, payeeId: role.assigneeId, label: role.title, amount: role.budget,
            serviceFee: Math.round(role.budget * 0.1), margin: p.type === "managed" ? Math.round(role.budget * 0.18) : 0,
            status: payStatus, providerRef: `mock_pi_${slugify(idea.title).slice(0, 8)}_${role.sort}`,
            createdAt: addDays(startDate, -6), releasedAt: payStatus !== "reserviert" ? addDays(startDate, 6) : null,
            paidOutAt: payStatus === "ausgezahlt" ? addDays(startDate, 8) : null,
          },
        });
      }
      await db.invoice.create({
        data: {
          number: `CC-${format(startDate, "yyyy")}-${String(i + 1).padStart(4, "0")}`, projectId: project.id, issuer: "Creative Connect (Demo) im Namen der Crew",
          recipient: ownerName, items: JSON.stringify([...roles.map((r) => ({ label: r.title, amount: r.budget })), { label: "Servicegebühr 10 %", amount: Math.round(idea.budget * 0.1) }]),
          net: Math.round(idea.budget * 1.1), issuedAt: addDays(startDate, 7),
        },
      });
    }

    if (p.dispute) {
      await db.dispute.create({
        data: {
          projectId: project.id, openedBy: ownerName, status: i === 9 ? "in_pruefung" : "offen",
          reason: i === 9 ? "Die finale Fassung weicht deutlich vom abgestimmten Konzept ab (Farblook, zwei Szenen fehlen)." : "Dreh wurde kurzfristig um zwei Tage verschoben, Zusatzkosten für die Location sind unklar.",
          log: JSON.stringify([
            { at: addDays(today, -4).toISOString(), by: ownerName, text: "Streitfall eröffnet." },
            { at: addDays(today, -3).toISOString(), by: "Crew", text: "Wir haben eine überarbeitete Fassung angeboten." },
            ...(i === 9 ? [{ at: addDays(today, -1).toISOString(), by: "Nesto (Admin)", text: "Ich schaue mir beide Fassungen an und melde mich bis Freitag." }] : []),
          ]),
        },
      });
    }

    allProjects.push({ id: project.id, status: p.status, title: idea.title, ownerId: p.owner, assignees });
  }

  // ---------- Bewertungen (80) & Credits (120) ----------
  const doneProjects = allProjects.filter((p) => p.status === "abgeschlossen");
  let reviewCount = 0;
  for (const p of doneProjects) {
    for (const a of p.assignees) {
      await db.review.create({ data: { projectId: p.id, authorId: p.ownerId, targetId: a, rating: pick([4, 5, 5, 5]), text: pick(REVIEW_TEXTS.slice(0, 9)), createdAt: addDays(today, -int(5, 200)) } });
      await db.review.create({ data: { projectId: p.id, authorId: a, targetId: p.ownerId, rating: pick([4, 5, 5]), text: REVIEW_TEXTS[9], createdAt: addDays(today, -int(5, 200)) } });
      reviewCount += 2;
    }
  }
  while (reviewCount < 80) {
    const target = pick(creatives);
    const author = pick([...creatives.filter((c) => c.id !== target.id).map((c) => c.id), ...clients.map((c) => c.id)]);
    await db.review.create({ data: { authorId: author, targetId: target.id, rating: pick([3, 4, 4, 5, 5, 5]), text: pick(REVIEW_TEXTS.slice(0, 9)), createdAt: addDays(today, -int(5, 400)) } });
    reviewCount++;
  }
  // Durchschnitt in Profile schreiben
  const agg = await db.review.groupBy({ by: ["targetId"], _avg: { rating: true }, _count: true });
  for (const a of agg) {
    await db.profile.updateMany({ where: { userId: a.targetId }, data: { ratingAvg: Math.round((a._avg.rating ?? 0) * 10) / 10, ratingCount: a._count } });
  }

  const creditRows: { userId: string; projectId?: string; title: string; role: string; year: number }[] = [];
  for (const p of allProjects.filter((x) => ["abgeschlossen", "abnahme", "produktion"].includes(x.status))) {
    const roles = await db.projectRole.findMany({ where: { projectId: p.id, assigneeId: { not: null } } });
    for (const r of roles) creditRows.push({ userId: r.assigneeId!, projectId: p.id, title: p.title, role: r.title, year: 2026 });
  }
  const externalTitles = ["„Kopfkino“ – Single", "Festivalsommer Doku", "„Neonherz“ – EP", "Kampagne Stadtwerke", "„Weite“ – Album", "Kurzfilm „Rückspiegel“", "Clubnacht Visuals", "„Salz“ – Musikvideo"];
  while (creditRows.length < 120) {
    const c = pick(creatives);
    creditRows.push({ userId: c.id, title: pick(externalTitles), role: pick(SKILLS[c.category]), year: int(2019, 2026) });
  }
  await db.credit.createMany({ data: creditRows.slice(0, 120) });

  // ---------- Community ----------
  for (const [i, e] of EVENTS.entries()) {
    const ev = await db.event.create({
      data: {
        slug: slugify(e.title), title: e.title, description: e.desc, date: addHours(addDays(today, e.offset), 19), city: e.city,
        venueName: e.venue, imageSeed: `cc-event-${i}`, capacity: e.cap,
      },
    });
    const guests = pickMany(creatives, int(4, 18));
    await db.rSVP.createMany({ data: guests.map((g) => ({ eventId: ev.id, userId: g.id })) });
  }
  for (const [i, body] of POSTS.entries()) {
    const author = i === 24 ? creatives.find((c) => c.id === jule.id)! : i === 13 ? creatives[0] : pick(creatives);
    const post = await db.post.create({
      data: { authorId: author.id, body, imageSeed: rand() > 0.55 ? `cc-post-${i}` : null, createdAt: addHours(today, -i * int(5, 14)) },
    });
    const likers = pickMany([...creatives.map((c) => c.id), kunde.id], int(0, 14));
    await db.like.createMany({ data: likers.map((u) => ({ postId: post.id, userId: u })) });
    for (let c = 0; c < int(0, 3); c++)
      await db.comment.create({ data: { postId: post.id, authorId: pick(creatives).id, body: pick(COMMENTS), createdAt: addHours(post.createdAt, c + 1) } });
  }
  await db.article.createMany({ data: ARTICLES.map((a, i) => ({ ...a, readMin: Math.max(2, Math.round(a.body.length / 400)), imageSeed: `cc-article-${i}`, createdAt: addDays(today, -i * 9) })) });
  await db.equipmentListing.createMany({
    data: EQUIPMENT.map((e, i) => {
      const owner = i === 0 ? creatives.find((c) => c.id === jule.id)! : pick(creatives);
      return { ownerId: owner.id, title: e.title, description: e.desc, mode: e.mode, price: e.price, condition: e.condition, city: owner.city, imageSeed: `cc-equipment-${i}`, createdAt: addDays(today, -int(1, 40)) };
    }),
  });

  // ---------- Profilaufrufe, Benachrichtigungen, Outbox, Audit ----------
  for (let i = 0; i < 14; i++) await db.profileView.create({ data: { viewedId: jule.id, viewerId: pick([...creatives.map((c) => c.id), kunde.id]), createdAt: addHours(today, -i * 9) } });
  await db.notification.createMany({
    data: [
      { userId: jule.id, title: "Neue Anfrage", body: "Nordlicht Records fragt dich für „Lookbook Frühjahr 2027“ an.", href: "/dashboard", createdAt: addHours(today, -2) },
      { userId: jule.id, title: "Zahlung ausgezahlt", body: "1.840 € für „Lookbook“ wurden ausgezahlt.", href: "/finanzen", read: true, createdAt: addHours(today, -30) },
      { userId: jule.id, title: "Event-Erinnerung", body: "Netzwerk-Abend Hamburg in 8 Tagen.", href: "/events", createdAt: addHours(today, -50) },
      { userId: kunde.id, title: "Crew-Mitglied hat zugesagt", body: "Für „Musikvideo „Nachtfahrt““ ist die Crew vollständig.", href: "/projekte", createdAt: addHours(today, -5) },
      { userId: kunde.id, title: "Abnahme ausstehend", body: "„Podcast „Rauschen“ – Staffel 2“ wartet auf deine Abnahme.", href: "/projekte", createdAt: addHours(today, -20) },
      { userId: nesto.id, title: "Managed-Crew-Anfrage", body: "Funkhaus Kollektiv möchte eine Managed Crew.", href: "/admin/managed", createdAt: addHours(today, -3) },
      { userId: nesto.id, title: "Neuer Streitfall", body: "Kiezbeat Magazin hat einen Streitfall eröffnet.", href: "/admin/streitfaelle", createdAt: addHours(today, -26) },
      { userId: nesto.id, title: "Warteliste", body: "6 Personen warten auf eine Einladung.", href: "/admin/einladungen", createdAt: addHours(today, -40) },
    ],
  });
  await db.outboxMail.createMany({
    data: [
      { to: "kreativ@demo.cc", subject: "Neue Anfrage: Lookbook Frühjahr 2027", body: "Hallo Jule,\n\nNordlicht Records möchte dich für ein Projekt anfragen. Öffne Creative Connect, um anzunehmen, abzulehnen oder ein Gegenangebot zu machen.\n\nDein Creative-Connect-Team", createdAt: addHours(today, -2) },
      { to: "kunde@demo.cc", subject: "Deine Crew ist vollständig", body: "Hallo Tarek,\n\nalle Rollen für „Musikvideo „Nachtfahrt““ sind besetzt. Die Zahlung ist beim Zahlungsdienstleister reserviert und wird nach deiner Abnahme ausgezahlt.\n\nViele Grüße", createdAt: addHours(today, -5) },
      { to: "kai@example.org", subject: "Du stehst auf der Warteliste", body: "Danke für dein Interesse! Creative Connect ist gerade ein geschlossenes Netzwerk. Wir melden uns, sobald ein Platz frei ist.", createdAt: addHours(today, -72) },
    ],
  });
  await db.auditLog.createMany({
    data: [
      { actor: "Nesto", action: "Mitglied verifiziert", target: "Jule Brandt", createdAt: subMonths(today, 10) },
      { actor: "Nesto", action: "Einladungskontingent erhöht", target: "Jule Brandt", detail: "+5 Einladungen", createdAt: subMonths(today, 6) },
      { actor: "System", action: "Marktplatz-Modus gesetzt", target: "closed", createdAt: subMonths(today, 12) },
    ],
  });

  // ---------- Corporate: Unternehmen, Lizenz-Katalog, Ausschreibungen, Kontakte, Bewerbungen ----------
  await seedCorporate(db, {
    rand, int, pick, pickMany, today, slugify, nestoId: nesto.id, juleId: jule.id, kundeId: kunde.id,
    creatives: creatives.map((c) => ({ id: c.id, name: c.name, category: c.category, city: c.city })), clients,
  });

  // ---------- Community: Sessions mit Nesto, Punkte, Belohnungen ----------
  await seedCommunity(db, {
    rand, int, pick, pickMany, today,
    nestoId: nesto.id, juleId: jule.id, kundeId: kunde.id,
    creatives: creatives.map((c) => ({ id: c.id, name: c.name, category: c.category })),
    doneProjects: allProjects.filter((p) => p.status === "abgeschlossen").map((p) => ({ id: p.id, title: p.title, assignees: p.assignees })),
  });

  // ---------- KPI-Verlauf (12 Monate) ----------
  for (let m = 11; m >= 0; m--) {
    const t = 11 - m;
    const active = Math.round(60 + t * 30 + t * t * 1.6);
    const volume = Math.round((4000 + t * 2600 + t * t * 260) / 100) * 100;
    await db.kpiSnapshot.create({
      data: {
        month: format(subMonths(today, m), "yyyy-MM"), activeMembers: active, newInvites: int(12, 30) + t * 4, volume,
        serviceFees: Math.round(volume * 0.1), proSubs: Math.round(active * 0.1), managedMargin: t % 3 === 0 ? 0 : Math.round(int(1500, 4200) * (1 + t / 10)),
        projectsStarted: 2 + Math.round(t * 1.4),
      },
    });
  }

  return { creatives: creatives.length, clients: clients.length, projects: allProjects.length, venues: venueIds.length };
}
