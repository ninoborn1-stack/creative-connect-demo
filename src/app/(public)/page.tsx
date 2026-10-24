import Link from "next/link";
import {
  ArrowRight, CalendarHeart, ChevronDown, Compass, FileSignature, Gift, HandCoins, HeartHandshake, MapPin, MessageSquareText,
  PartyPopper, Quote, ShieldCheck, Trophy, Users, Wallet,
} from "lucide-react";
import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { CATEGORIES, LEVELS, MARKETPLACE_MODES, POINT_RULES, SESSION_TYPES, categoryName } from "@/lib/constants";
import { formatDateLong, formatEur, formatNumber, parseJson } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileCard } from "@/components/profile-card";
import { CATEGORY_ICONS, Eyebrow, Section, SectionHeading } from "@/components/public/landing-bits";
import { cn } from "@/lib/utils";
import { stockPhoto } from "@/lib/stock";
import { Hero } from "@/components/public/hero";
import { nextFreeSlots } from "@/components/sessions/session-data";
import { SessionTypeBadge } from "@/components/sessions/session-badges";
import { timeLabel } from "@/components/sessions/session-utils";

const INVITE_HREF = "/invite/CC-DEMO-2026";

// Beispiel-Crews: Rollen werden mit echten Seed-Profilen besetzt
const CREW_TEMPLATES = [
  {
    title: "Musikvideo „Nachtfahrt“",
    meta: "Leipzig · 2 Drehtage",
    budget: 9800,
    cover: "cc-crew-musikvideo",
    city: "Leipzig",
    roles: [
      { label: "Regie & Kamera", category: "videografie" },
      { label: "Hauptrolle", category: "schauspiel" },
      { label: "Location", category: "booking" },
      { label: "Cover & Visuals", category: "grafikdesign" },
    ],
  },
  {
    title: "Single-Release „Glas“",
    meta: "Berlin · 3 Wochen",
    budget: 6200,
    cover: "cc-crew-release",
    city: "Berlin",
    roles: [
      { label: "Produktion", category: "musikproduktion" },
      { label: "Recording & Mix", category: "tonstudio" },
      { label: "Artwork", category: "grafikdesign" },
      { label: "Pressefotos", category: "fotografie" },
    ],
  },
  {
    title: "Kampagne Streetwear",
    meta: "Hamburg · 1 Shooting-Tag",
    budget: 7400,
    cover: "cc-crew-kampagne",
    city: "Hamburg",
    roles: [
      { label: "Fotografie", category: "fotografie" },
      { label: "Reels & Clips", category: "videografie" },
      { label: "Model", category: "schauspiel" },
    ],
  },
];

const STEPS = [
  { icon: MessageSquareText, title: "Briefing", text: "Beschreib dein Projekt in eigenen Worten – oder sprich es ein. Der Assistent macht daraus Rollen, Termine und eine Budgetaufteilung." },
  { icon: Users, title: "Crew", text: "Pro Rolle drei passende Vorschläge mit Begründung. Du fragst parallel an, vergleichst Angebote und bestätigst dein Team." },
  { icon: Wallet, title: "Projektraum & Zahlung", text: "Chat, Dateien, Zeitplan und Vertrag an einem Ort. Das Honorar wird reserviert und nach deiner Abnahme ausgezahlt." },
];

const FAQ = [
  { q: "Wie komme ich ins Netzwerk?", a: "In Phase 1 nur per Einladung durch ein Mitglied oder über die Warteliste. Jedes Profil wird vom Team gesichtet – so bleibt die Qualität hoch und das Vertrauen groß." },
  { q: "Was kostet Creative Connect für Kreative?", a: "Nichts. Kreative zahlen 0 % Provision und behalten ihr komplettes Honorar. Optional gibt es eine Pro-Mitgliedschaft mit Extras wie Statistiken und mehr Portfolio-Platz – ohne bessere Platzierung in der Suche." },
  { q: "Und für Auftraggeber:innen?", a: "Auf gebuchte Honorare kommt eine transparent ausgewiesene Servicegebühr. Keine Grundgebühr, kein Abo. Wer das Team lieber zusammenstellen lässt, bucht eine Managed Crew." },
  { q: "Was macht die KI – und was nicht?", a: "Der Assistent strukturiert dein Briefing, schlägt Rollen, Budgetaufteilung und passende Leute vor. Entscheiden, anfragen und buchen tust immer du. Alle KI-Vorschläge sind gekennzeichnet." },
  { q: "Wie läuft die Bezahlung?", a: "Über einen lizenzierten Zahlungsdienstleister: Das Honorar wird bei Buchung reserviert, nach der Abnahme freigegeben und an die Kreativen ausgezahlt. Rechnungen entstehen automatisch." },
  { q: "Wer legt die Preise fest?", a: "Die Kreativen selbst. Sie geben einen Tagessatz-Rahmen an, können Gegenangebote machen und Anfragen jederzeit ablehnen – ohne Nachteile im Ranking." },
  { q: "Was sind Sessions mit Nesto – und wofür gibt es Punkte?", a: "Nesto öffnet seinen Produktionskalender für die Community: Beat- und Songwriting-Sessions, Mix-Feedback, Workshops und Open-Studio-Abende – für Mitglieder kostenlos. Jede Teilnahme bringt Punkte, ebenso abgeschlossene Projekte, Event-Zusagen, Bewertungen und erfolgreiche Einladungen. Punkte tauschst du gegen Studiozeit, Feedback, Sichtbarkeit oder Merch; mit jedem Level wächst du tiefer ins Netzwerk hinein." },
  { q: "Was ist mit der Künstlersozialkasse?", a: "Wir zeigen dir als Auftraggeber:in, wann Künstlersozialabgabe anfallen kann, und liefern eine Jahresübersicht als Export. Rechtsberatung ersetzt das nicht." },
];

type CrewProfile = {
  userId: string; name: string; city: string; slug: string; avatarSeed: string; categories: string[]; ratingAvg: number;
};

const REWARD_EXAMPLES = ["studiostunde", "mix-feedback", "spotlight"];

export default async function LandingPage() {
  const [mode, fees, profiles, creativeCount, reviews, slots, rewardExamples, nextEvent] = await Promise.all([
    getMarketplaceMode(),
    getFees(),
    db.profile.findMany({
      where: { verified: true, user: { status: { not: "gesperrt" } } },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      select: {
        slug: true, headline: true, city: true, categories: true, dayRateMin: true, dayRateMax: true, availability: true, verified: true,
        ratingAvg: true, ratingCount: true, avatarSeed: true, coverSeed: true, isPro: true, user: { select: { id: true, name: true } },
      },
    }),
    db.profile.count(),
    db.review.findMany({
      where: { rating: 5, author: { isClient: true }, target: { isCreative: true } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { select: { name: true, company: true, profile: { select: { avatarSeed: true } } } },
        target: { select: { name: true, profile: { select: { headline: true } } } },
      },
    }),
    nextFreeSlots(3),
    db.reward.findMany({ where: { slug: { in: REWARD_EXAMPLES }, active: true }, orderBy: { cost: "asc" } }),
    db.event.findFirst({ where: { date: { gte: startOfDay(new Date()) } }, orderBy: { date: "asc" } }),
  ]);

  // Crews besetzen: bevorzugt Profile aus der Stadt, jede Person nur einmal
  const pool: CrewProfile[] = profiles.map((p) => ({
    userId: p.user.id, name: p.user.name, city: p.city, slug: p.slug, avatarSeed: p.avatarSeed, categories: parseJson<string[]>(p.categories, []), ratingAvg: p.ratingAvg,
  }));
  const used = new Set<string>();
  const crews = CREW_TEMPLATES.map((crew) => ({
    ...crew,
    members: crew.roles.flatMap((role) => {
      const candidates = pool.filter((p) => p.categories.includes(role.category) && !used.has(p.userId));
      const pick = candidates.find((p) => p.city === crew.city) ?? candidates[0];
      if (!pick) return [];
      used.add(pick.userId);
      return [{ ...role, person: pick }];
    }),
  }));

  const seenTexts = new Set<string>();
  const quotes = reviews.filter((r) => !seenTexts.has(r.text) && seenTexts.add(r.text)).slice(0, 3);
  const cityCount = new Set(profiles.map((p) => p.city)).size;
  const phaseIndex = mode === "closed" ? 0 : mode === "clients" ? 1 : 2;
  const canRegister = mode !== "closed";

  const values = [
    { icon: HandCoins, title: "Fair bezahlt", text: `${fees.creativeCommissionPct} % Provision für Kreative. Das Honorar gehört denen, die die Arbeit machen.` },
    { icon: ShieldCheck, title: "Kuratiert", text: "Aufnahme per Einladung, Verifizierung durch das Team. Qualität vor Masse." },
    { icon: HeartHandshake, title: "Menschen vor Maschine", text: "KI organisiert, Menschen gestalten. Jede Entscheidung trifft ein Mensch." },
    { icon: Compass, title: "Transparent", text: "Offene Gebühren, nachvollziehbares Ranking, keine bezahlte Platzierung." },
  ];

  const ctas = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {canRegister && (
        <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
          <Link href="/registrieren">Projekt starten <ArrowRight className="size-4" aria-hidden /></Link>
        </Button>
      )}
      <Button asChild size="lg" variant={canRegister ? "outline" : "default"} className="h-12 rounded-full px-6 text-base">
        <Link href={INVITE_HREF}>Einladung einlösen {!canRegister && <ArrowRight className="size-4" aria-hidden />}</Link>
      </Button>
      <Button asChild size="lg" variant={canRegister ? "ghost" : "outline"} className="h-12 rounded-full px-6 text-base">
        <Link href="/warteliste">Auf die Warteliste</Link>
      </Button>
    </div>
  );

  return (
    <>
      {/* ---------- Hero: Bogen-Intro + Scroll-Übergang ---------- */}
      <Hero
        image={stockPhoto(453, 2400, 1600)} // Band auf der Bühne im Spotlight
        phaseLabel={MARKETPLACE_MODES[phaseIndex].label}
        creativeCount={creativeCount}
        cityCount={cityCount}
        commissionPct={fees.creativeCommissionPct}
        canRegister={canRegister}
        inviteHref={INVITE_HREF}
      />

      {/* ---------- Drei Schritte ---------- */}
      <Section id="so-gehts" labelledBy="steps-title" className="border-t">
        <SectionHeading id="steps-title" eyebrow="So funktioniert’s" title="Vom Briefing zur fertigen Crew in drei Schritten." />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
              <span aria-hidden className="absolute -top-4 right-4 font-heading text-[7rem] leading-none font-extrabold text-primary/10">{i + 1}</span>
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><s.icon className="size-5" aria-hidden /></span>
              <h3 className="mt-6 text-xl font-semibold"><span className="sr-only">Schritt {i + 1}: </span>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6">
            <Eyebrow className="text-muted-foreground">Weg 1</Eyebrow>
            <p className="mt-2 text-lg font-semibold">Self-Service</p>
            <p className="mt-1 text-sm text-muted-foreground">Du suchst, vergleichst und buchst selbst – mit dem Briefing-Assistenten als Abkürzung.</p>
          </div>
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6">
            <Eyebrow>Weg 2 · Premium</Eyebrow>
            <p className="mt-2 text-lg font-semibold">Managed Crew</p>
            <p className="mt-1 text-sm text-muted-foreground">Unser Team stellt die Crew für dich zusammen und koordiniert die Produktion – ein Angebot, ein Ansprechpartner.</p>
          </div>
        </div>
      </Section>

      {/* ---------- Community: mehr als Vermittlung ---------- */}
      <Section id="community" labelledBy="community-title" className="border-t bg-muted/30">
        <SectionHeading
          id="community-title"
          eyebrow="Mehr als Vermittlung"
          title="Die Community: Nesto und seine Leute profitieren voneinander."
          text="Creative Connect ist kein anonymer Marktplatz. Nesto teilt Studiozeit, Know-how und Kontakte – die Community bringt Ideen, Stimmen und Projekte mit. Wer sich einbringt, sammelt Punkte und steigt auf."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {/* Sessions mit Nesto: Kalender-Vorschau */}
          <article className="flex flex-col rounded-3xl border bg-card p-6 sm:p-8 lg:col-span-2">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><CalendarHeart className="size-5" aria-hidden /></span>
            <h3 className="mt-6 text-xl font-semibold">Sessions mit Nesto</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nestos Produktionskalender ist offen für Mitglieder: Beats bauen, Songs schreiben, Mix-Feedback holen oder einfach zum Open Studio vorbeikommen. Kostenlos – und jede Teilnahme bringt Punkte.
            </p>
            <p className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nächste freie Slots</p>
            {slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Gerade sind alle Slots vergeben – neue kommen jede Woche dazu.</p>
            ) : (
              <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                {slots.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1.5 rounded-2xl border bg-background/60 p-3">
                    <span className="flex items-center justify-between gap-2">
                      <SessionTypeBadge type={s.type} />
                      <span className="text-xs font-semibold text-primary">+{s.points}</span>
                    </span>
                    <span className="text-sm font-medium leading-snug">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDateLong(s.date)}</span>
                    <span className="text-xs text-muted-foreground">{timeLabel(s.startHour, s.endHour)} · noch {s.free} {s.free === 1 ? "Platz" : "Plätze"}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Punkte & Level */}
          <article className="flex flex-col rounded-3xl border bg-card p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Trophy className="size-5" aria-hidden /></span>
            <h3 className="mt-6 text-xl font-semibold">Punkte & Level</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Punkte für Sessions (bis +{Math.max(...Object.values(SESSION_TYPES).map((t) => t.points))}), abgeschlossene Projekte (+{POINT_RULES.projekt.points}), Event-Zusagen und Einladungen.
            </p>
            <ol className="mt-6 space-y-2" aria-label="Level-Leiter">
              {LEVELS.map((l, i) => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", i === LEVELS.length - 1 ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{l.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">ab {formatNumber(l.min)}</span>
                </li>
              ))}
            </ol>
          </article>

          {/* Belohnungen */}
          <article className="flex flex-col rounded-3xl border bg-card p-6 sm:p-8 lg:col-span-2">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Gift className="size-5" aria-hidden /></span>
            <h3 className="mt-6 text-xl font-semibold">Belohnungen</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Punkte tauschst du gegen das, was dich wirklich weiterbringt.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {rewardExamples.map((r) => (
                <li key={r.id} className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="relative aspect-[16/10] bg-muted">
                    <StockImage seed={r.imageSeed} w={480} h={300} sizes="(max-width: 640px) 100vw, 22vw" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(r.cost)} Punkte</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Events & Open Studio */}
          <article className="flex flex-col rounded-3xl border border-primary/40 bg-primary/10 p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary"><PartyPopper className="size-5" aria-hidden /></span>
            <h3 className="mt-6 text-xl font-semibold">Events & Open Studio</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Jeden Donnerstag Open Studio Night bei Nesto, dazu Meetups, Release-Partys und Workshops in mehreren Städten. Hier entstehen die Crews von morgen.
            </p>
            {nextEvent && (
              <p className="mt-4 rounded-2xl border bg-background/60 p-3 text-sm">
                <span className="block text-xs text-muted-foreground">Nächstes Event</span>
                <span className="font-medium">{nextEvent.title}</span>
                <span className="block text-xs text-muted-foreground">{formatDateLong(nextEvent.date)} · {nextEvent.city}</span>
              </p>
            )}
          </article>
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
          <strong className="text-foreground">Gegenseitig statt einseitig:</strong> Nesto findet neue Stimmen, Talente und Crews für seine Produktionen – die Community bekommt Studiozeit, ehrliches Feedback und Zugang zu Projekten. Je mehr alle mitmachen, desto stärker wird das Netzwerk.
        </p>
      </Section>

      {/* ---------- Bereiche ---------- */}
      <Section id="bereiche" labelledBy="cats-title">
        <SectionHeading id="cats-title" eyebrow="Sieben Bereiche" title="Die komplette Produktionskette auf einen Blick." text="Vom ersten Beat bis zum fertigen Cover: alle Gewerke, die ein Release, ein Video oder eine Kampagne braucht." />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.icon];
            return (
              <li key={c.slug} className={cn("group relative isolate overflow-hidden rounded-2xl border", i === 0 ? "col-span-2 aspect-[2/1] lg:aspect-auto lg:row-span-2" : "aspect-square sm:aspect-[4/3]")}>
                <StockImage seed={`cc-cat-${c.slug}`} w={800} h={800} sizes="(max-width: 1024px) 50vw, 25vw" className="-z-10 transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
                <div className="flex h-full flex-col justify-between p-4 text-white sm:p-5">
                  <span className="grid size-9 place-items-center rounded-lg bg-white/15 backdrop-blur"><Icon className="size-4" aria-hidden /></span>
                  <div>
                    <h3 className={cn("font-semibold", i === 0 ? "text-2xl sm:text-3xl" : "text-base sm:text-lg")}>{c.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-white/75 sm:text-sm">{c.description}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------- Beispiel-Crews ---------- */}
      <Section id="crews" labelledBy="crews-title" className="border-t bg-muted/30">
        <SectionHeading id="crews-title" eyebrow="Beispiel-Crews" title="So sieht ein Team aus, das sich gefunden hat." text="Echte Rollen, echte Budgets – zusammengestellt aus Mitgliedern des Netzwerks." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {crews.map((crew) => (
            <article key={crew.title} className="flex flex-col overflow-hidden rounded-3xl border bg-card">
              <div className="relative aspect-[16/10]">
                <StockImage seed={crew.cover} w={800} h={500} sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">{crew.title}</h3>
                  <p className="text-xs text-white/75">{crew.meta}</p>
                </div>
              </div>
              <ul className="flex-1 divide-y px-4">
                {crew.members.map((m) => (
                  <li key={m.person.userId} className="flex items-center gap-3 py-3">
                    <UserAvatar name={m.person.name} seed={m.person.avatarSeed} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.label} · {categoryName(m.category)}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{m.person.city}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold">{formatEur(crew.budget)}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------- Stimmen ---------- */}
      {quotes.length > 0 && (
        <Section id="stimmen" labelledBy="voices-title">
          <SectionHeading id="voices-title" eyebrow="Stimmen aus der Community" title="Was Auftraggeber:innen über ihre Crews sagen." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {quotes.map((r, i) => (
              <figure key={r.id} className={cn("flex flex-col rounded-3xl border p-6", i === 1 ? "bg-primary text-primary-foreground" : "bg-card")}>
                <Quote className={cn("size-7", i === 1 ? "text-primary-foreground/60" : "text-primary")} aria-hidden />
                <blockquote className="mt-4 flex-1 font-heading text-lg leading-snug font-medium">„{r.text}“</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <UserAvatar name={r.author.name} seed={r.author.profile?.avatarSeed ?? `client-${r.authorId}`} className="size-10" />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{r.author.name}</p>
                    <p className={cn("truncate text-xs", i === 1 ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {r.author.company ?? "Mitglied"} über {r.target.name}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Werte & Erlösmodell ---------- */}
      <Section id="werte" labelledBy="values-title" className="border-t">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading id="values-title" eyebrow="Unsere Werte" title="Ein Netzwerk, das denen gehört, die es tragen." />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v.title}>
                  <v.icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-3 font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="glow relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
            <Eyebrow>Erlösmodell</Eyebrow>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Transparent bis auf den Cent.</h3>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-background/60 p-5">
                <p className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">{fees.creativeCommissionPct}<span className="text-2xl">&nbsp;%</span></p>
                <p className="mt-2 text-sm font-medium">für Kreative</p>
                <p className="text-xs text-muted-foreground">Keine Provision auf Honorare.</p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-5">
                <p className="font-heading text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">{fees.serviceFeePct}<span className="text-2xl">&nbsp;%</span></p>
                <p className="mt-2 text-sm font-medium">Servicegebühr</p>
                <p className="text-xs text-muted-foreground">für Auftraggeber:innen, separat ausgewiesen.</p>
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between gap-4 border-b pb-2"><span>Pro-Mitgliedschaft (optional)</span><span className="font-medium text-foreground">{fees.proPriceEur} € / Monat</span></li>
              <li className="flex justify-between gap-4 border-b pb-2"><span>Managed Crew</span><span className="font-medium text-foreground">{fees.managedMarginPct} % Marge im Angebot</span></li>
              <li className="flex justify-between gap-4"><span>Bezahlte Platzierung</span><span className="font-medium text-foreground">gibt es nicht</span></li>
            </ul>
            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <FileSignature className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Zahlungen laufen über einen lizenzierten Zahlungsdienstleister. Ranking-Kriterien stehen offen in den <Link href="/agb#ranking" className="underline underline-offset-4">AGB</Link>.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Roadmap ---------- */}
      <Section id="roadmap" labelledBy="roadmap-title" className="border-t bg-muted/30">
        <SectionHeading id="roadmap-title" eyebrow="Roadmap" title="Erst Vertrauen, dann Öffnung." text="Wir starten als geschlossenes Netzwerk, in dem sich Mitglieder gegenseitig buchen – und öffnen Schritt für Schritt." />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {MARKETPLACE_MODES.map((m, i) => {
            const state = i < phaseIndex ? "erledigt" : i === phaseIndex ? "aktuell" : "geplant";
            return (
              <li key={m.key} aria-current={state === "aktuell" ? "step" : undefined} className={cn("relative rounded-3xl border p-6", state === "aktuell" ? "border-primary bg-primary/10" : "bg-card", state === "geplant" && "opacity-75")}>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold text-muted-foreground">Phase {i + 1}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", state === "aktuell" ? "bg-primary text-primary-foreground" : state === "erledigt" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
                    {state === "aktuell" ? "Jetzt" : state === "erledigt" ? "Erreicht" : "Geplant"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{m.label.replace(/ \(Phase \d\)/, "")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* ---------- Verzeichnis-Teaser (nur Modus offen) ---------- */}
      {mode === "open" && (
        <Section id="verzeichnis" labelledBy="dir-title">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="dir-title" eyebrow="Verzeichnis" title="Entdecke das Netzwerk." text="Profile sind jetzt öffentlich sichtbar. Eine kleine Auswahl:" />
            <Button asChild variant="outline" className="h-11 w-fit rounded-full px-5">
              <Link href="/verzeichnis">Verzeichnis ansehen <ArrowRight className="size-4" aria-hidden /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.slice(0, 6).map((p) => <ProfileCard key={p.slug} profile={p} />)}
          </div>
        </Section>
      )}

      {/* ---------- FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title" className="border-t">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Häufige Fragen." text="Noch etwas offen? Schreib uns über die Warteliste – wir antworten persönlich." />
          <div className="divide-y rounded-3xl border bg-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-1 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section aria-labelledby="cta-title" className="px-4 pb-20 sm:pb-28">
        <div className="glow relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="mx-auto flex -space-x-3 justify-center">
            {pool.slice(0, 6).map((p) => <UserAvatar key={p.userId} name={p.name} seed={p.avatarSeed} className="size-11 ring-4 ring-card" />)}
          </div>
          <h2 id="cta-title" className="mx-auto mt-6 max-w-2xl text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl">
            Deine nächste Crew wartet schon.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {canRegister
              ? "Starte dein Projekt in wenigen Minuten – oder werde Teil des Netzwerks."
              : "Creative Connect ist gerade ein geschlossenes Netzwerk. Löse deine Einladung ein oder sichere dir einen Platz auf der Warteliste."}
          </p>
          <div className="mt-8 flex justify-center">{ctas}</div>
        </div>
      </section>
    </>
  );
}
