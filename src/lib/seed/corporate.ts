// Seed für den Corporate-Teil: Unternehmensseiten, Lizenz-Katalog, Lizenzen, Ausschreibungen + Pitches,
// Kontakte (Vernetzen), Follower und Aufnahme-Bewerbungen. Alle Firmen und Personen sind frei erfunden.
import type { PrismaClient } from "@prisma/client";
import { addDays, addHours } from "date-fns";
import { LICENSE_TIERS } from "@/lib/constants";

type Ctx = {
  rand: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  pickMany: <T>(arr: readonly T[], n: number) => T[];
  today: Date;
  slugify: (s: string) => string;
  nestoId: string;
  juleId: string;
  kundeId: string;
  creatives: { id: string; name: string; category: string; city: string }[];
  clients: { id: string; name: string; company: string }[];
};

// Bestehende Auftraggeber:innen → Unternehmen
const EXISTING: Record<string, { industry: string; size: string; city: string; tagline: string; about: string; jobTitle: string; founded: number }> = {
  "Nordlicht Records": { industry: "musik", size: "11-50", city: "Hamburg", jobTitle: "A&R Manager", founded: 2014, tagline: "Independent-Label für Pop, Rap und alles dazwischen.", about: "Nordlicht Records veröffentlicht seit 2014 Musik aus Norddeutschland. Wir arbeiten mit Produzent:innen, Videocrews und Designer:innen aus dem Creative-Connect-Netzwerk – vom ersten Demo bis zur Kampagne." },
  "Nordwind Energy Drinks": { industry: "werbung", size: "201-1000", city: "München", jobTitle: "Brand Manager", founded: 2009, tagline: "Energy für Nachtschichten, Festivals und Gaming-Sessions.", about: "Nordwind sponsert Musik-, Sport- und Gaming-Events in ganz Europa. Für Kampagnen suchen wir Kreative, die Szene und Marke gleichermaßen verstehen – und Rechte, die international sauber geregelt sind." },
  "Kiezbeat Magazin": { industry: "musik", size: "11-50", city: "Berlin", jobTitle: "Chefredakteur", founded: 2011, tagline: "Print & Online für Rap, R&B und Clubkultur.", about: "Kiezbeat porträtiert Artists und Szenen. Wir buchen Fotograf:innen und Videocrews für Titelstorys und lizenzieren Musik für unsere Video-Formate." },
  "Fernweh Streetwear": { industry: "werbung", size: "11-50", city: "Köln", jobTitle: "Head of Marketing", founded: 2018, tagline: "Streetwear aus Köln, produziert in Europa.", about: "Zwei Kollektionen pro Jahr, jede mit Lookbook, Kampagne und Social-Content. Wir arbeiten am liebsten mit festen Crews, die wir über Creative Connect gefunden haben." },
  "Halle 7 Booking": { industry: "events", size: "1-10", city: "Frankfurt", jobTitle: "Geschäftsführer", founded: 2016, tagline: "Booking und Produktion für Clubs, Festivals und Brand-Events.", about: "Halle 7 bucht Acts, Locations und Visual-Artists für über 60 Events im Jahr." },
  "AVA (Independent)": { industry: "musik", size: "1-10", city: "Leipzig", jobTitle: "Artist", founded: 2021, tagline: "Independent-Artist zwischen Indie-Pop und Elektronik.", about: "Ich veröffentliche selbst und baue mir für jedes Release eine Crew aus dem Netzwerk." },
  "Blaupause Agentur": { industry: "werbung", size: "51-200", city: "Hannover", jobTitle: "Creative Director", founded: 2007, tagline: "Agentur für Marken, die nicht nach Agentur aussehen wollen.", about: "Wir setzen Kampagnen für Mobilität, Energie und Handel um und holen uns für jede Produktion spezialisierte Kreative und lizenzierbare Musik dazu." },
  "Rauschen Podcast GmbH": { industry: "corporate", size: "11-50", city: "Berlin", jobTitle: "Executive Producer", founded: 2019, tagline: "Podcasts für Unternehmen, Stiftungen und Medienhäuser.", about: "Wir produzieren Corporate-Podcasts von der Idee bis zur Distribution – mit Studios, Sprecher:innen und Sounddesign aus dem Netzwerk." },
  "Asphaltpoesie Records": { industry: "musik", size: "1-10", city: "Düsseldorf", jobTitle: "Label-Inhaber", founded: 2020, tagline: "Rap-Label mit Fokus auf Storytelling.", about: "Kleines Label, große Geschichten. Cover, Videos und Produktion kommen aus dem Creative-Connect-Netzwerk." },
  "NORA K. (Independent)": { industry: "musik", size: "1-10", city: "Nürnberg", jobTitle: "Artist", founded: 2022, tagline: "Singer-Songwriterin.", about: "Ich suche immer wieder Musiker:innen und Videocrews für meine Releases." },
  "Kraftwerk Sneaker Store": { industry: "werbung", size: "11-50", city: "Essen", jobTitle: "Owner", founded: 2015, tagline: "Sneaker-Store mit eigenen Limited Drops.", about: "Jeder Drop bekommt ein eigenes Video und eigene Visuals – produziert mit Kreativen aus dem Ruhrgebiet." },
  "Funkhaus Kollektiv": { industry: "musik", size: "1-10", city: "Mannheim", jobTitle: "Gründungsmitglied", founded: 2024, tagline: "Musiker:innen-Kollektiv aus Mannheim.", about: "Wir teilen uns Studio, Equipment und Netzwerk." },
};

// Neue Unternehmen – Gaming, Film, Corporate
const NEW_COMPANIES = [
  { name: "Pixelfjord Games", industry: "gaming", size: "51-200", city: "Hamburg", founded: 2013, contact: "Henrik Lund", jobTitle: "Audio Director", tagline: "Indie-to-Mid-Size-Studio für Story-Games mit nordischem Einschlag.", about: "Pixelfjord entwickelt narrative Abenteuer für PC und Konsole. Für unser nächstes Projekt „Ashfall“ suchen wir Komponist:innen, Sounddesigner:innen und Sprecher:innen – mit sauberen Buyouts für weltweite Veröffentlichung." },
  { name: "Nachtwerk Interactive", industry: "gaming", size: "201-1000", city: "Berlin", founded: 2008, contact: "Mira Okonkwo", jobTitle: "Head of Brand & Marketing", tagline: "Multiplayer-Games mit Millionen Spieler:innen weltweit.", about: "Nachtwerk betreibt Live-Service-Games mit saisonalen Updates. Pro Season brauchen wir Trailer, Key Visuals, Musik und Voice-Lines – schnell, in hoher Qualität und mit klaren Rechten." },
  { name: "Lumen Forge Studios", industry: "gaming", size: "11-50", city: "Leipzig", founded: 2019, contact: "Tomasz Wierzbicki", jobTitle: "Creative Lead", tagline: "Kleines Team, große Welten: Fantasy-RPGs aus Leipzig.", about: "Wir arbeiten eng mit freien Concept Artists, Komponist:innen und Voice-Actors aus der Region – Creative Connect ist dafür unser Netzwerk." },
  { name: "Silbersee Pictures", industry: "film-tv", size: "51-200", city: "Köln", founded: 2011, contact: "Ines Hartwig", jobTitle: "Produzentin", tagline: "Dokus und Serien für Streaming und TV.", about: "Wir produzieren Dokumentarserien und brauchen dafür Score, Sync-Lizenzen und Postproduktion – fair bezahlt und rechtssicher." },
  { name: "Brückner Mobility AG", industry: "corporate", size: "1000+", city: "Stuttgart", founded: 1952, contact: "Dr. Katharina Brückner", jobTitle: "Leiterin Unternehmenskommunikation", tagline: "Mobilitätslösungen für Städte und Industrie.", about: "Für Employer Branding, Messen und interne Kommunikation arbeiten wir mit kuratierten Kreativen statt großer Agentur-Ketten – mit Rahmenverträgen und klarer Rechtekette." },
  { name: "Elbstrom Energie", industry: "corporate", size: "1000+", city: "Hamburg", founded: 1998, contact: "Lars Petersen", jobTitle: "Head of Content", tagline: "Ökostrom für Norddeutschland.", about: "Wir erzählen die Energiewende mit echten Menschen – in Filmen, Podcasts und Kampagnen, produziert von Kreativen aus dem Norden." },
];

const WORKS: { type: string; owner: string; title: string; description: string; tags: string[]; industries: string[]; dur?: number; bpm?: number; key?: string; prices: [number, number, number | null] }[] = [
  { type: "track", owner: "musikproduktion", title: "Ashen Shores", description: "Orchestral-elektronischer Score mit nordischer Melancholie – ideal für Story-Trailer und Menüs.", tags: ["Cinematic", "Orchestral", "Melancholisch"], industries: ["gaming", "film-tv"], dur: 164, bpm: 84, key: "d-Moll", prices: [290, 890, 3900] },
  { type: "track", owner: "musikproduktion", title: "Neon Velocity", description: "Treibender Synthwave mit Druck – für Racing-Spots, Gaming-Trailer und Brand-Reels.", tags: ["Synthwave", "Energetisch", "Retro"], industries: ["gaming", "werbung"], dur: 132, bpm: 118, key: "a-Moll", prices: [290, 890, 3500] },
  { type: "track", owner: "musikproduktion", title: "Kaltfront", description: "Dunkler Trap-Beat mit Streicher-Samples, gebaut für Social-Kampagnen.", tags: ["Trap", "Dunkel", "Urban"], industries: ["werbung", "musik"], dur: 118, bpm: 140, key: "f-Moll", prices: [190, 590, 2400] },
  { type: "track", owner: "musikproduktion", title: "Sonntagslicht", description: "Warmer Indie-Pop-Instrumental mit Gitarren und Glockenspiel – positiv, menschlich, nahbar.", tags: ["Indie", "Warm", "Positiv"], industries: ["corporate", "werbung"], dur: 148, bpm: 96, key: "G-Dur", prices: [240, 790, 2900] },
  { type: "track", owner: "musikproduktion", title: "Hafenlichter", description: "Atmosphärischer Ambient-Track für Dokus, Imagefilme und Ladebildschirme.", tags: ["Ambient", "Ruhig", "Weit"], industries: ["film-tv", "gaming", "corporate"], dur: 205, bpm: 70, key: "E-Dur", prices: [240, 790, 3200] },
  { type: "track", owner: "musikproduktion", title: "Boss Rush", description: "Episches Hybrid-Orchester mit Chor und Percussion für Bosskämpfe und Launch-Trailer.", tags: ["Episch", "Hybrid", "Action"], industries: ["gaming"], dur: 176, bpm: 150, key: "c-Moll", prices: [390, 1190, 4900] },
  { type: "beat", owner: "musikproduktion", title: "Beton & Blumen (Beat)", description: "Boom-Bap mit Jazz-Sample, Lizenz für Artists und Brand-Content.", tags: ["Boom-Bap", "Jazz", "Chill"], industries: ["musik", "werbung"], dur: 150, bpm: 88, key: "B-Dur", prices: [150, 490, 1900] },
  { type: "beat", owner: "musikproduktion", title: "Drift (Beat)", description: "Melodischer Drill-Beat mit 808-Glides.", tags: ["Drill", "Melodisch"], industries: ["musik"], dur: 142, bpm: 144, key: "g-Moll", prices: [150, 490, 1900] },
  { type: "beat", owner: "musikproduktion", title: "Vapor Lane (Beat)", description: "Lo-Fi-Beat für Streams, Podcasts und Social Clips.", tags: ["Lo-Fi", "Chill"], industries: ["corporate", "gaming"], dur: 128, bpm: 82, key: "Es-Dur", prices: [120, 390, 1500] },
  { type: "sfx", owner: "tonstudio", title: "UI Clicks & Menüsounds (120 Sounds)", description: "Saubere, moderne UI-Sounds für Games und Apps – in 48 kHz/24 Bit.", tags: ["UI", "Clean", "Modern"], industries: ["gaming", "corporate"], prices: [79, 249, null] },
  { type: "sfx", owner: "tonstudio", title: "Nordsee-Ambiences (40 Loops)", description: "Wind, Wellen, Möwen, Hafen – nahtlose Loops für Spielwelten und Dokus.", tags: ["Ambience", "Natur", "Loops"], industries: ["gaming", "film-tv"], prices: [99, 299, 1200] },
  { type: "sfx", owner: "tonstudio", title: "Foley: Rüstungen & Waffen", description: "Über 300 Foley-Aufnahmen für Fantasy- und Action-Games.", tags: ["Foley", "Fantasy", "Action"], industries: ["gaming", "film-tv"], prices: [129, 390, 1600] },
  { type: "sfx", owner: "tonstudio", title: "Sound-Logo-Baukasten", description: "30 kurze Brand-Stings und Signets als Ausgangspunkt für Sound-Branding.", tags: ["Sound-Branding", "Signet"], industries: ["werbung", "corporate"], prices: [149, 490, 2400] },
  { type: "stems", owner: "tonstudio", title: "Live-Session Stems „Glas“", description: "Multitracks einer Live-Session – für Remixe, Edits und Sync.", tags: ["Live", "Pop", "Stems"], industries: ["musik", "werbung"], dur: 214, bpm: 102, key: "A-Dur", prices: [190, 590, null] },
  { type: "voice", owner: "schauspiel", title: "Voice-Pack: Erzählerin, warm & ruhig", description: "120 Voice-Lines (Deutsch/Englisch) für Tutorials, Imagefilme und Games.", tags: ["Erzählerin", "Warm", "DE/EN"], industries: ["gaming", "corporate"], prices: [120, 450, 1500] },
  { type: "voice", owner: "schauspiel", title: "Voice-Pack: Antagonist, rau", description: "Bedrohliche Voice-Lines und Kampfgeräusche für Fantasy-Games.", tags: ["Antagonist", "Rau", "Fantasy"], industries: ["gaming"], prices: [140, 520, 1800] },
  { type: "voice", owner: "schauspiel", title: "Werbesprecher: jung & urban", description: "Kurze Claims und Callouts für Social Ads und Radio.", tags: ["Werbung", "Urban"], industries: ["werbung"], prices: [110, 390, 1400] },
  { type: "artwork", owner: "grafikdesign", title: "Concept Art: Küstendorf im Sturm", description: "Environment-Konzept mit drei Tageszeiten – Grundlage für Level-Design und Key Visual.", tags: ["Concept Art", "Environment", "Fantasy"], industries: ["gaming", "film-tv"], prices: [190, 690, 2900] },
  { type: "artwork", owner: "grafikdesign", title: "Charakter-Sheet: Die Lotsin", description: "Charakterdesign mit Turnaround, Ausdrücken und Farbvarianten.", tags: ["Charakter", "Concept Art"], industries: ["gaming"], prices: [220, 790, 3400] },
  { type: "artwork", owner: "grafikdesign", title: "Cover-Artwork „Mitternachtsblau“", description: "Abstraktes Cover-Artwork, auch als Kampagnen-Key-Visual nutzbar.", tags: ["Abstrakt", "Cover", "Blau"], industries: ["musik", "werbung"], prices: [150, 490, 1900] },
  { type: "artwork", owner: "grafikdesign", title: "Icon-Set: Energie & Mobilität (60 Icons)", description: "Einheitliches Icon-Set für Präsentationen, Websites und Messen.", tags: ["Icons", "Corporate"], industries: ["corporate"], prices: [99, 290, 990] },
  { type: "artwork", owner: "grafikdesign", title: "Key Visual: Neon Arena", description: "Key Visual für E-Sport-Turniere und Gaming-Events, mit Ebenen.", tags: ["E-Sport", "Neon", "Key Visual"], industries: ["gaming", "events"], prices: [260, 890, 3600] },
  { type: "foto", owner: "fotografie", title: "Serie: Menschen der Energiewende", description: "12 Portraits von Techniker:innen auf Windparks – für Employer Branding und Berichte.", tags: ["Portrait", "Industrie", "Echt"], industries: ["corporate"], prices: [190, 590, 2200] },
  { type: "foto", owner: "fotografie", title: "Serie: Club bei Nacht", description: "20 Fotos aus Clubs und Backstage-Bereichen, alle Model-Releases vorhanden.", tags: ["Nacht", "Club", "Musik"], industries: ["musik", "werbung", "events"], prices: [150, 490, 1900] },
  { type: "foto", owner: "fotografie", title: "Serie: Stadt im Regen", description: "Urbane Stimmungsbilder für Kampagnen und Editorials.", tags: ["Urban", "Regen", "Moody"], industries: ["werbung", "film-tv"], prices: [120, 390, 1500] },
  { type: "footage", owner: "videografie", title: "Drohnenflug: Nordseeküste 4K", description: "Zwölf Drohnen-Clips (4K, 50 fps, Log) von Dünen, Leuchttürmen und Wattflächen.", tags: ["Drohne", "4K", "Natur"], industries: ["film-tv", "werbung", "gaming"], prices: [160, 520, 2200] },
  { type: "footage", owner: "videografie", title: "Gaming-Setup B-Roll", description: "B-Roll von Gaming-Setups, Händen auf Controllern, RGB-Licht – für Trailer und Ads.", tags: ["Gaming", "B-Roll", "RGB"], industries: ["gaming", "werbung"], prices: [140, 460, 1900] },
  { type: "footage", owner: "videografie", title: "Fabrikhalle & Robotik", description: "Industrie-Footage in 6K für Imagefilme und Messen.", tags: ["Industrie", "6K", "Technik"], industries: ["corporate"], prices: [190, 590, 2400] },
];

const OPPORTUNITIES = [
  { company: "Pixelfjord Games", title: "Soundtrack für das Story-Game „Ashfall“", summary: "Komponist:in für 45–60 Minuten adaptive Musik (Wwise), nordisch-orchestral.", industry: "gaming", categories: ["musikproduktion"], skills: ["Game-Audio", "Adaptive Music (Wwise/FMOD)", "Film-Scoring"], budget: [18000, 26000], days: 21, remote: true, licensing: true, status: "offen" },
  { company: "Pixelfjord Games", title: "Voice Cast: 6 Charaktere (DE)", summary: "Sprecher:innen für Haupt- und Nebenrollen, ca. 1.800 Lines, Aufnahme in Hamburg.", industry: "gaming", categories: ["schauspiel", "tonstudio"], skills: ["Voice Acting", "Voice-Recording für Games"], budget: [9000, 14000], days: 14, remote: false, licensing: true, status: "offen" },
  { company: "Nachtwerk Interactive", title: "Launch-Trailer Season 7", summary: "90-Sekunden-Trailer aus Gameplay-Capture plus Key Visual für alle Kanäle.", industry: "gaming", categories: ["videografie", "grafikdesign"], skills: ["Game-Trailer", "3D & Key Visuals"], budget: [22000, 35000], days: 10, remote: true, licensing: true, status: "in_auswahl" },
  { company: "Lumen Forge Studios", title: "Concept Art: Küstenregion & Leuchtturm-Dungeon", summary: "Environment-Konzepte (8 Motive) für ein Fantasy-RPG.", industry: "gaming", categories: ["grafikdesign"], skills: ["Concept Art"], budget: [6000, 9000], days: 18, remote: true, licensing: true, status: "offen" },
  { company: "Nordwind Energy Drinks", title: "Sound-Logo & Audio-Guidelines", summary: "Akustische Markenidentität: Sound-Logo, drei Varianten, Guidelines für Agenturen.", industry: "werbung", categories: ["musikproduktion", "tonstudio"], skills: ["Sounddesign", "Sync & Licensing"], budget: [12000, 20000], days: 25, remote: true, licensing: true, status: "offen" },
  { company: "Nordwind Energy Drinks", title: "Gaming-Event-Content Gamescom-Woche", summary: "Fotos, Reels und Live-Visuals für drei Brand-Events in Köln.", industry: "events", categories: ["fotografie", "videografie", "grafikdesign"], skills: ["Event", "Reels", "Live-Visuals"], budget: [15000, 22000], days: 30, remote: false, licensing: false, status: "offen" },
  { company: "Brückner Mobility AG", title: "Employer-Branding-Film „Menschen bei Brückner“", summary: "Dokumentarischer Imagefilm (3 Min.) plus 6 Social Cuts, Dreh an zwei Standorten.", industry: "corporate", categories: ["videografie", "musikproduktion"], skills: ["Imagefilm", "Kamera", "Schnitt"], budget: [28000, 40000], days: 20, remote: false, licensing: true, status: "offen" },
  { company: "Elbstrom Energie", title: "Corporate-Podcast: 8 Folgen", summary: "Studio, Moderation und Postproduktion für einen Podcast zur Energiewende.", industry: "corporate", categories: ["tonstudio", "musikproduktion"], skills: ["Podcast-Aufnahme", "Mixing"], budget: [9000, 13000], days: 16, remote: false, licensing: false, status: "offen" },
  { company: "Silbersee Pictures", title: "Score für Doku-Serie „Küstenmenschen“", summary: "Score für 4 × 45 Minuten, Sync auch für Trailer.", industry: "film-tv", categories: ["musikproduktion"], skills: ["Film-Scoring", "Sync & Licensing"], budget: [16000, 24000], days: 28, remote: true, licensing: true, status: "in_auswahl" },
  { company: "Nordlicht Records", title: "Musikvideo für die Single „Nachtfahrt“", summary: "Regie, Kamera und Schnitt für ein Performance-Video in Hamburg.", industry: "musik", categories: ["videografie"], skills: ["Musikvideos", "Regie"], budget: [6000, 9000], days: 12, remote: false, licensing: false, status: "offen" },
  { company: "Blaupause Agentur", title: "Kampagnenfotografie Frühjahr", summary: "Zwei Shooting-Tage für eine Mobilitäts-Kampagne, Buyout DACH.", industry: "werbung", categories: ["fotografie"], skills: ["Fashion", "Studio-Licht"], budget: [7000, 11000], days: -5, remote: false, licensing: true, status: "vergeben" },
  { company: "Halle 7 Booking", title: "Visuals für Festival „Sommerkante“", summary: "Live-Visuals für drei Bühnen an zwei Tagen.", industry: "events", categories: ["grafikdesign", "videografie"], skills: ["Motion Design"], budget: [5000, 8000], days: -12, remote: false, licensing: false, status: "geschlossen" },
];

const PITCH_TEXTS = [
  "Ich habe in den letzten drei Jahren genau solche Projekte umgesetzt – Referenzen hängen an. Gerne stelle ich in einem kurzen Call einen ersten Ansatz vor.",
  "Das Briefing passt perfekt zu meinem Schwerpunkt. Ich würde mit einer Skizze in fünf Werktagen starten und euch zwei Richtungen zur Auswahl geben.",
  "Ich arbeite seit Jahren mit Studios aus dem Netzwerk und kann ein eingespieltes Team mitbringen. Rechte und Buyout regeln wir über die Vertragsvorlage.",
  "Spannendes Projekt! Ich habe Erfahrung mit internationalen Releases und kenne die Anforderungen an Rechteketten und Lieferformate.",
  "Kurz und knapp: Ich kann zum Wunschtermin liefern und habe im Portfolio passende Arbeiten aus derselben Branche.",
];

export async function seedCorporate(db: PrismaClient, ctx: Ctx) {
  const { rand, int, pick, pickMany, today, slugify, nestoId, juleId, kundeId, creatives, clients } = ctx;

  // ---------- Unternehmen ----------
  const companyIds = new Map<string, string>();
  for (const c of clients) {
    const meta = EXISTING[c.company];
    if (!meta) continue;
    const company = await db.company.create({
      data: {
        slug: slugify(c.company), name: c.company, industry: meta.industry, size: meta.size, city: meta.city, tagline: meta.tagline, about: meta.about,
        founded: meta.founded, website: `https://${slugify(c.company)}.example`, logoSeed: `cc-logo-${slugify(c.company)}`, coverSeed: `cc-company-${slugify(c.company)}`,
        verified: rand() > 0.25 || c.id === kundeId, createdAt: addDays(today, -int(60, 400)),
      },
    });
    companyIds.set(c.company, company.id);
    await db.user.update({ where: { id: c.id }, data: { companyId: company.id, jobTitle: meta.jobTitle } });
  }
  for (const c of NEW_COMPANIES) {
    const company = await db.company.create({
      data: {
        slug: slugify(c.name), name: c.name, industry: c.industry, size: c.size, city: c.city, tagline: c.tagline, about: c.about, founded: c.founded,
        website: `https://${slugify(c.name)}.example`, logoSeed: `cc-logo-${slugify(c.name)}`, coverSeed: `cc-company-${slugify(c.name)}`, verified: true,
        createdAt: addDays(today, -int(20, 200)),
      },
    });
    companyIds.set(c.name, company.id);
    await db.user.create({
      data: {
        email: `${slugify(c.name)}@demo.cc`, password: "demo", name: c.contact, company: c.name, companyId: company.id, jobTitle: c.jobTitle,
        clientType: c.industry === "gaming" ? "Gaming-Studio" : c.industry === "film-tv" ? "Produktionsfirma" : "Unternehmen",
        isClient: true, status: "verifiziert", invitedById: nestoId, createdAt: company.createdAt,
      },
    });
  }
  const companyUsers = await db.user.findMany({ where: { companyId: { not: null } }, select: { id: true, companyId: true, company: true } });
  const contactOf = (companyName: string) => companyUsers.find((u) => u.company === companyName)!;

  // ---------- Lizenz-Katalog ----------
  const workIds: { id: string; prices: [number, number, number | null]; industries: string[] }[] = [];
  const byCat = (cat: string) => creatives.filter((c) => c.category === cat && c.id !== juleId);
  for (const [i, w] of WORKS.entries()) {
    // Nesto produziert drei der Tracks selbst, Jule (Video/Foto) bietet Footage und Fotos an
    const owner =
      w.type === "track" && i < 3 ? nestoId : (w.type === "footage" || w.type === "foto") && i % 2 === 0 ? juleId : pick(byCat(w.owner).length ? byCat(w.owner) : creatives).id;
    const audio = ["track", "beat", "sfx", "stems", "voice"].includes(w.type);
    const work = await db.licensableWork.create({
      data: {
        slug: slugify(w.title), ownerId: owner, type: w.type, title: w.title, description: w.description, tags: JSON.stringify(w.tags),
        industries: JSON.stringify(w.industries), durationSec: w.dur, bpm: w.bpm, musicalKey: w.key,
        previewUrl: audio ? `/demo-audio/demo-${(i % 8) + 1}.wav` : null, imageSeed: `cc-work-${slugify(w.title)}`,
        priceStandard: w.prices[0], priceExtended: w.prices[1], priceExclusive: w.prices[2], aiMarked: w.type === "artwork" && i % 5 === 0,
        featured: [0, 1, 5, 9, 17, 25].includes(i), plays: int(40, 2400), createdAt: addDays(today, -int(3, 240)),
      },
    });
    workIds.push({ id: work.id, prices: w.prices, industries: w.industries });
  }

  // ---------- Lizenzen ----------
  let licenseNo = 1;
  const buyers = companyUsers.filter((u) => u.companyId);
  for (let n = 0; n < 26; n++) {
    const work = pick(workIds);
    const buyer = n < 3 ? companyUsers.find((u) => u.id === kundeId)! : n < 8 ? contactOf(pick(["Pixelfjord Games", "Nachtwerk Interactive", "Lumen Forge Studios"])) : pick(buyers);
    const tier = work.prices[2] && rand() > 0.85 ? "exklusiv" : rand() > 0.55 ? "erweitert" : "standard";
    const t = LICENSE_TIERS[tier as keyof typeof LICENSE_TIERS];
    const price = tier === "exklusiv" ? work.prices[2]! : tier === "erweitert" ? work.prices[1] : work.prices[0];
    await db.license.create({
      data: {
        number: `CC-L-2026-${String(licenseNo++).padStart(5, "0")}`, workId: work.id, buyerId: buyer.id, companyId: buyer.companyId,
        tier, media: JSON.stringify(t.media), territory: t.territory, durationMonths: t.durationMonths,
        projectName: pick(["Kampagne Frühjahr", "Season-Trailer", "Imagefilm 2026", "Social-Serie", "Launch-Video", "Messe-Loop", "Doku Folge 3", "Menü-Musik"]),
        price, serviceFee: Math.round(price * 0.1), createdAt: addDays(today, -int(1, 200)),
      },
    });
  }

  // ---------- Ausschreibungen & Pitches ----------
  for (const o of OPPORTUNITIES) {
    const contact = contactOf(o.company);
    const created = addDays(today, -int(4, 30));
    const opp = await db.opportunity.create({
      data: {
        slug: slugify(o.title), companyId: contact.companyId!, authorId: contact.id, title: o.title, summary: o.summary,
        description: `${o.summary}\n\nWas wir erwarten: Erfahrung in vergleichbaren Projekten, nachvollziehbare Referenzen und Lieferung in professionellen Formaten.\n\nRechte: ${o.licensing ? "Nutzungsrechte bzw. Buyout sind Teil der Leistung und werden über die Vertragsvorlage geregelt." : "Nutzungsrechte nach Absprache."}\n\nAblauf: Pitch einreichen → Shortlist → kurzer Call → Zusage über Creative Connect inkl. Vertrag und Zahlungsabwicklung.`,
        industry: o.industry, categories: JSON.stringify(o.categories), skills: JSON.stringify(o.skills), budgetMin: o.budget[0], budgetMax: o.budget[1],
        deadline: addDays(today, o.days), startDate: addDays(today, o.days + int(7, 21)), location: o.remote ? "Remote" : contact.company ? (EXISTING[o.company]?.city ?? NEW_COMPANIES.find((c) => c.name === o.company)?.city ?? "Berlin") : "Berlin",
        remote: o.remote, licensing: o.licensing, status: o.status, createdAt: created,
      },
    });
    const pool = creatives.filter((c) => o.categories.includes(c.category) && c.id !== nestoId);
    const pitchers = pickMany(pool, Math.min(pool.length, int(2, 5)));
    if (o.categories.some((c) => c === "videografie" || c === "fotografie") && o.status === "offen" && rand() > 0.3 && !pitchers.some((p) => p.id === juleId)) {
      pitchers.push(creatives.find((c) => c.id === juleId)!);
    }
    for (const [k, p] of pitchers.entries()) {
      const status = o.status === "vergeben" ? (k === 0 ? "angenommen" : "abgelehnt") : o.status === "in_auswahl" ? (k < 2 ? "shortlist" : "eingereicht") : p.id === juleId && rand() > 0.5 ? "shortlist" : "eingereicht";
      await db.pitch.create({
        data: {
          opportunityId: opp.id, creativeId: p.id, message: pick(PITCH_TEXTS), price: Math.round(int(o.budget[0], o.budget[1]) / 100) * 100,
          links: JSON.stringify([`https://portfolio.example/${slugify(p.name)}`]), status, createdAt: addHours(created, int(4, 200)),
        },
      });
    }
  }

  // ---------- Kontakte (Vernetzen) & Follower ----------
  const people = [...creatives.map((c) => c.id), ...companyUsers.map((u) => u.id)];
  const pairs = new Set<string>();
  const addConnection = async (fromId: string, toId: string, status: string) => {
    const key = [fromId, toId].sort().join(":");
    if (fromId === toId || pairs.has(key)) return;
    pairs.add(key);
    await db.connection.create({ data: { fromId, toId, status, createdAt: addDays(today, -int(1, 300)) } });
  };
  for (const id of people) {
    for (const other of pickMany(people, int(2, 6))) await addConnection(id, other, rand() > 0.12 ? "verbunden" : "angefragt");
  }
  // Nesto ist mit allen Kreativen verbunden – das gewachsene Netzwerk
  for (const c of creatives) await addConnection(nestoId, c.id, "verbunden");
  // Jule: offene Anfragen von Firmen
  await addConnection(contactOf("Pixelfjord Games").id, juleId, "angefragt");
  await addConnection(contactOf("Brückner Mobility AG").id, juleId, "angefragt");

  for (const [name, companyId] of companyIds) {
    const followers = pickMany(creatives, int(5, 28));
    for (const f of followers) await db.companyFollow.create({ data: { companyId, userId: f.id, createdAt: addDays(today, -int(1, 200)) } });
    if (["Pixelfjord Games", "Nachtwerk Interactive"].includes(name)) {
      await db.companyFollow.upsert({ where: { companyId_userId: { companyId, userId: juleId } }, update: {}, create: { companyId, userId: juleId } });
    }
  }

  // ---------- Aufnahme-Bewerbungen ----------
  const APPLICATIONS = [
    { name: "Kai Lehmann", email: "kai.lehmann@example.org", city: "Bremen", categories: ["videografie"], track: "netzwerk", referrer: juleId, status: "in_pruefung", score: 86, pitch: "Videograf aus Bremen, Schwerpunkt Musikvideos und Gaming-Trailer. Ich habe mit Jule an zwei Drehs gearbeitet.", extracted: { skills: ["Regie", "Kamera", "Game-Trailer", "DaVinci Resolve"], credits: ["Musikvideo „Kopfkino“ (2025)", "Trailer „Ironvale“ für ein Indie-Studio (2026)"], industries: ["musik", "gaming"], dayRate: [550, 950], experienceYears: 6 } },
    { name: "Sina Ahmadi", email: "sina.ahmadi@example.org", city: "Hannover", categories: ["fotografie"], track: "standard", status: "eingereicht", score: 71, pitch: "Fotografin für Corporate-Portraits und Industrie-Reportagen.", extracted: { skills: ["Portrait", "Industrie", "Studio-Licht"], credits: ["Geschäftsbericht eines Energieversorgers (2025)"], industries: ["corporate"], dayRate: [650, 1100], experienceYears: 8 } },
    { name: "Oskar Thiel", email: "oskar.thiel@example.org", city: "Mannheim", categories: ["musikproduktion"], track: "standard", status: "eingereicht", score: 64, pitch: "Produziere Techno und House, suche Sync-Möglichkeiten für Games und Werbung.", extracted: { skills: ["Ableton", "Sounddesign", "Mixing"], credits: ["EP „Neonregen“ (2024)"], industries: ["musik", "gaming"], dayRate: [300, 600], experienceYears: 4 } },
    { name: "Dana Petrov", email: "dana.petrov@example.org", city: "Köln", categories: ["schauspiel"], track: "netzwerk", referrer: nestoId, status: "angenommen", score: 92, pitch: "Sprecherin und Schauspielerin, Schwerpunkt Games und Hörspiel (DE/EN/RU).", extracted: { skills: ["Voice Acting", "Synchron", "Motion Capture"], credits: ["Hauptrolle in einem Fantasy-RPG (2025)", "Hörspielserie (12 Folgen)"], industries: ["gaming", "film-tv"], dayRate: [400, 800], experienceYears: 9 } },
    { name: "Elif Tan", email: "elif.tan@example.org", city: "Essen", categories: ["grafikdesign"], track: "standard", status: "in_pruefung", score: 78, pitch: "Concept Artist und Illustratorin, arbeite für zwei Indie-Studios.", extracted: { skills: ["Concept Art", "Illustration", "3D & Key Visuals"], credits: ["Environment-Konzepte für ein Indie-Game (2026)"], industries: ["gaming"], dayRate: [350, 700], experienceYears: 5 } },
    { name: "Ruben Weiß", email: "ruben.weiss@example.org", city: "Nürnberg", categories: ["booking"], track: "standard", status: "abgelehnt", score: 38, pitch: "Ich will in die Eventbranche einsteigen.", extracted: { skills: ["Event-Planung"], credits: [], industries: ["events"], dayRate: [150, 250], experienceYears: 1 } },
    { name: "Jana Vogt", email: "jana.vogt@example.org", city: "Dresden", categories: ["tonstudio", "musikproduktion"], track: "netzwerk", referrer: nestoId, status: "eingereicht", score: 88, pitch: "Toningenieurin mit eigenem Studio, Foley und Game-Audio.", extracted: { skills: ["Foley", "Voice-Recording für Games", "Dolby Atmos"], credits: ["Sounddesign für ein Mobile-Game (2025)", "Foley für eine Doku-Serie (2026)"], industries: ["gaming", "film-tv"], dayRate: [450, 850], experienceYears: 11 } },
  ];
  for (const a of APPLICATIONS) {
    const checks = [
      { label: "Portfolio-Links erreichbar", ok: true, hint: "Website und Social-Profile gefunden" },
      { label: "Referenzen / Credits", ok: a.extracted.credits.length > 0, hint: a.extracted.credits.length ? `${a.extracted.credits.length} Credits erkannt` : "Keine Credits gefunden" },
      { label: "Branchenfit", ok: a.extracted.industries.length > 0, hint: a.extracted.industries.join(", ") },
      { label: "Netzwerk-Bezug", ok: a.track === "netzwerk", hint: a.track === "netzwerk" ? "Empfehlung aus dem Netzwerk" : "Keine Empfehlung" },
      { label: "Preisrahmen plausibel", ok: a.extracted.dayRate[0] >= 250, hint: `${a.extracted.dayRate[0]}–${a.extracted.dayRate[1]} € Tagessatz` },
    ];
    await db.creativeApplication.create({
      data: {
        name: a.name, email: a.email, city: a.city, categories: JSON.stringify(a.categories),
        links: JSON.stringify({ website: `https://${slugify(a.name)}.example`, instagram: `@${slugify(a.name).replace(/-/g, ".")}` }),
        pitch: a.pitch, extracted: JSON.stringify(a.extracted), score: a.score, checks: JSON.stringify(checks), track: a.track,
        referrerId: a.referrer ?? null, referralCode: a.track === "netzwerk" ? "NETZWERK" : null, status: a.status,
        reviewNote: a.status === "abgelehnt" ? "Noch zu wenig Referenzen – gerne in 6 Monaten erneut bewerben." : a.status === "angenommen" ? "Starke Game-Referenzen, direkt verifiziert." : null,
        createdAt: addDays(today, -int(1, 20)), reviewedAt: ["angenommen", "abgelehnt"].includes(a.status) ? addDays(today, -int(0, 3)) : null,
      },
    });
  }
}
