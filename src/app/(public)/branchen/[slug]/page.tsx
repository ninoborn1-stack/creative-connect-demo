import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowUpRight, AudioLines, BadgeCheck, Clapperboard, Globe, Languages, Mic2, Palette, Waves,
} from "lucide-react";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_TIERS } from "@/lib/constants";
import { formatEur, parseJson } from "@/lib/format";
import { ProfileCard } from "@/components/profile-card";
import { UserAvatar } from "@/components/user-avatar";
import { StockImage } from "@/components/stock-image";
import { CtaLink, Eyebrow, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS, rankProfilesForIndustry, worksForIndustry } from "@/components/public/industry-data";
import { PUBLIC_WORK_SELECT, WorkRow } from "@/components/public/work-card";
import { OpportunityList, PUBLIC_OPPORTUNITY_SELECT } from "@/components/public/opportunity-list";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  return ind ? { title: `${ind.name} – Branchen`, description: ind.tagline } : { title: "Branche" };
}

// ---------- Gaming-Spezial ----------
const GAMING_SERVICES = [
  { icon: Waves, title: "Adaptive Musik", text: "Soundtracks mit Layern, Stingern und Loops – implementierungsfertig für Wwise und FMOD, inklusive Stems." },
  { icon: AudioLines, title: "Sounddesign & Foley", text: "UI-Sounds, Ambiences, Waffen, Kreaturen – aufgenommen in Studios aus dem Netzwerk, geliefert in 48 kHz/24 Bit." },
  { icon: Mic2, title: "Voice Acting mit Buyouts", text: "Casting, Regie und Aufnahme für Haupt- und Nebenrollen. Buyouts weltweit, unbefristet, für alle Plattformen." },
  { icon: Palette, title: "Concept Art & Key Visuals", text: "Environments, Charaktere, Key Art für Store-Pages und Kampagnen – mit Ebenen und Rechten für Marketing." },
  { icon: Clapperboard, title: "Trailer & Capture", text: "Announcement-, Launch- und Season-Trailer aus Gameplay-Capture, plus Social Cuts für alle Kanäle." },
  { icon: Languages, title: "Lokalisierung", text: "Deutsche Sprachfassungen, Synchron und Lip-Sync – mit Sprecher:innen, Studios und Regie aus einer Hand." },
];

const GAME_LICENSES = [
  { model: "Katalog-Lizenz „Erweitert“", scope: LICENSE_TIERS.erweitert.summary, fit: "Indie-Titel, Early Access, Prototypen" },
  { model: "Exklusiv / Buyout", scope: LICENSE_TIERS.exklusiv.summary, fit: "Hauptthema, Charakterstimmen, Key Art" },
  { model: "Auftragsproduktion mit Buyout", scope: "Individuelle Komposition/Aufnahme, weltweit, unbefristet, alle Plattformen inkl. DLC & Marketing", fit: "Soundtrack, Voice Cast, Trailer" },
  { model: "Season-Rahmenvertrag", scope: "Kontingent pro Season, feste Tagessätze, Abruf pro Update", fit: "Live-Service-Games" },
];

const EXAMPLE_CREW = [
  { label: "Komposition (adaptiv, Wwise)", skill: "Adaptive Music (Wwise/FMOD)", category: "musikproduktion", count: 1, budget: 14000 },
  { label: "Sounddesign & Foley", skill: "Foley", category: "tonstudio", count: 1, budget: 4500 },
  { label: "Sprecher:innen (6 Rollen)", skill: "Voice Acting", category: "schauspiel", count: 6, budget: 10800 },
  { label: "Voice-Regie & Recording", skill: "Recording", category: "tonstudio", count: 1, budget: 3200 },
];

const CREW_BRIEF = [
  "45 Minuten adaptive Musik, Implementierung in Wwise",
  "ca. 1.800 Voice-Lines, Aufnahme in Hamburg",
  "Buyout weltweit, unbefristet, alle Plattformen",
  "Laufzeit 8 Wochen, Lieferung pro Milestone",
];

const pad = (n: number) => String(n).padStart(2, "0");

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  const detail = INDUSTRY_DETAILS[slug];
  if (!ind || !detail) notFound();

  const [mode, profiles, works, companies, opps] = await Promise.all([
    getMarketplaceMode(),
    db.profile.findMany({
      where: { user: { status: { not: "gesperrt" } } },
      orderBy: [{ verified: "desc" }, { ratingAvg: "desc" }],
      select: {
        slug: true, headline: true, city: true, categories: true, skills: true, dayRateMin: true, dayRateMax: true, availability: true, verified: true,
        ratingAvg: true, ratingCount: true, avatarSeed: true, coverSeed: true, isPro: true, user: { select: { id: true, name: true } },
      },
    }),
    db.licensableWork.findMany({ orderBy: [{ featured: "desc" }, { plays: "desc" }], select: PUBLIC_WORK_SELECT }),
    db.company.findMany({ where: { industry: slug }, orderBy: [{ verified: "desc" }, { name: "asc" }] }),
    db.opportunity.findMany({ where: { industry: slug, status: "offen" }, orderBy: { deadline: "asc" }, select: PUBLIC_OPPORTUNITY_SELECT }),
  ]);

  const talents = rankProfilesForIndustry(profiles, slug, 6);
  const matchingWorks = worksForIndustry(works, slug).slice(0, 6);
  const canRegister = mode !== "closed";
  const isGaming = slug === "gaming";

  // Beispiel-Crew (Gaming): Rollen mit echten Profilen besetzen, jede Person nur einmal
  const used = new Set<string>();
  const crew = isGaming
    ? EXAMPLE_CREW.map((role) => {
        const candidates = profiles.filter((p) => !used.has(p.user.id) && (parseJson<string[]>(p.skills, []).includes(role.skill) || parseJson<string[]>(p.categories, []).includes(role.category)));
        const bySkill = candidates.filter((p) => parseJson<string[]>(p.skills, []).includes(role.skill));
        const picked = [...bySkill, ...candidates.filter((c) => !bySkill.includes(c))].slice(0, role.count);
        picked.forEach((p) => used.add(p.user.id));
        return { ...role, people: picked };
      })
    : [];
  const crewTotal = EXAMPLE_CREW.reduce((s, r) => s + r.budget, 0);

  // Laufende Abschnittsnummern – Gaming hat drei zusätzliche Abschnitte
  let n = 0;
  const next = () => pad(++n);

  return (
    <>
      <PageHero eyebrow="Branche" title={ind.name} text={ind.tagline} imageSeed={detail.imageSeed}>
        {canRegister ? (
          <CtaLink href="/registrieren">Projekt starten <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        ) : (
          <CtaLink href="/fuer-unternehmen#kontakt">Demo anfragen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        )}
        <CtaLink href="/lizenzen" variant="ghost">Lizenz-Katalog</CtaLink>
      </PageHero>

      {/* ---------- Bedarfe ---------- */}
      <Section labelledBy="needs-title">
        <SectionHeading id="needs-title" index={next()} eyebrow="Typische Bedarfe" title={`Was ${isGaming ? "Studios" : "Unternehmen"} bei uns einkaufen.`} />
        <ol className="mt-14 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {ind.needs.map((need, i) => (
            <li key={need} className="flex min-h-40 flex-col justify-between gap-8 bg-background p-6 sm:min-h-52">
              <span className="meta text-primary">{pad(i + 1)}</span>
              <p className="text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">{need}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Gaming: Leistungen, Lizenzmodelle, Beispiel-Crew ---------- */}
      {isGaming && (
        <>
          <section aria-labelledby="game-services-title" className="gutter bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-32">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
              <div className="lg:col-span-8">
                <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />{next()} — Für Game-Studios</p>
                <h2 id="game-services-title" className="poster mt-6 text-[clamp(2.6rem,7.4vw,8rem)] text-balance">Von adaptiver Musik bis Season-Trailer.</h2>
              </div>
              <p className="text-white/70 sm:text-lg lg:col-span-4 lg:pb-2">
                Kreative, die Pipelines, Middleware und Release-Zyklen von Games kennen – vom Indie-Team bis zum Live-Service-Titel.
              </p>
            </div>
            <ul className="mt-16 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
              {GAMING_SERVICES.map((s, i) => (
                <li key={s.title} className="bg-[var(--ink)] p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="meta text-white/50">G{i + 1}</span>
                    <s.icon className="size-5 text-[var(--signal)]" aria-hidden />
                  </div>
                  <h3 className="poster mt-10 text-[clamp(1.9rem,3vw,2.8rem)]">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{s.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <Section labelledBy="game-lic-title">
            <SectionHeading
              id="game-lic-title"
              index={next()}
              eyebrow="Lizenzmodelle für Games"
              title="Weltweit, unbefristet, plattform­übergreifend."
              text="PC, Konsole, Mobile, Streaming von Gameplay, DLCs und Marketing – die Rechte passen zu eurem Release-Plan."
            />
            <div className="mt-14 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-t text-left">
                <caption className="sr-only">Lizenzmodelle für Games</caption>
                <thead className="border-b">
                  <tr>
                    <th scope="col" className="meta py-4 pr-6 font-normal text-muted-foreground">Modell</th>
                    <th scope="col" className="meta py-4 pr-6 font-normal text-muted-foreground">Umfang</th>
                    <th scope="col" className="meta py-4 font-normal text-muted-foreground">Typisch für</th>
                  </tr>
                </thead>
                <tbody>
                  {GAME_LICENSES.map((l, i) => (
                    <tr key={l.model} className="border-b align-top">
                      <th scope="row" className="py-6 pr-6 text-lg leading-tight font-semibold tracking-tight sm:text-2xl">
                        <span className="meta mb-2 block font-normal text-primary">L{i + 1}</span>
                        {l.model}
                      </th>
                      <td className="max-w-md py-6 pr-6 text-sm text-muted-foreground sm:text-base">{l.scope}</td>
                      <td className="meta py-6 text-foreground">{l.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="meta mt-6 flex items-start gap-2 text-muted-foreground">
              <Globe className="size-3.5 shrink-0" aria-hidden />
              Plattformen: PC, PlayStation, Xbox, Nintendo, Mobile, Cloud-Gaming. Streaming und Let’s Plays durch Spieler:innen sind immer freigegeben.
            </p>
          </Section>

          {/* Beispiel-Crew als Split: Bild links, Besetzung rechts */}
          <section aria-labelledby="crew-title" className="grid border-t lg:grid-cols-2">
            <div className="relative min-h-[45svh] bg-[var(--ink)] text-[var(--bone)] lg:min-h-full">
              <StockImage seed="cc-crew-indie-game" w={1400} h={1400} sizes="(max-width: 1024px) 100vw, 50vw" className="opacity-75 grayscale-[30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/20 to-transparent" />
              <div className="gutter absolute inset-x-0 bottom-0 pb-8 sm:pb-12">
                <p className="meta text-white/70">Narratives Indie-Game · 8 Wochen</p>
                <ul className="mt-4 border-t border-white/20">
                  {CREW_BRIEF.map((b) => <li key={b} className="border-b border-white/20 py-3 text-sm text-white/85">{b}</li>)}
                </ul>
              </div>
            </div>
            <div className="gutter py-20 sm:py-28">
              <Eyebrow>{next()} — Beispiel-Crew</Eyebrow>
              <h2 id="crew-title" className="poster mt-6 text-[clamp(2.6rem,5.6vw,6rem)] text-balance">Indie-Studio braucht Soundtrack + 6 Sprecher:innen.</h2>
              <p className="mt-6 max-w-lg text-muted-foreground sm:text-lg">
                So stellt Nesto eine Crew für ein narratives Indie-Game zusammen – besetzt mit Mitgliedern aus dem Netzwerk.
              </p>
              <ul className="mt-12 border-t">
                {crew.map((r, i) => (
                  <li key={r.label} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b py-5">
                    <span className="meta text-muted-foreground">{pad(i + 1)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{r.label}</p>
                      <p className="meta mt-1 text-muted-foreground">{r.people.length > 0 ? r.people.map((p) => p.user.name).join(", ") : "wird über Ausschreibung besetzt"}</p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatEur(r.budget)}</span>
                    {r.people.length > 0 && (
                      <div className="col-start-2 col-end-4 flex -space-x-2">
                        {r.people.slice(0, 6).map((p) => <UserAvatar key={p.user.id} name={p.user.name} seed={p.avatarSeed} className="size-8 ring-2 ring-background" />)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 bg-[var(--ink)] p-5 text-[var(--bone)] sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <span className="meta text-white/60">Budget gesamt (netto, inkl. Buyouts)</span>
                <span className="poster text-[clamp(2.4rem,4vw,3.6rem)] tabular-nums">{formatEur(crewTotal)}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ---------- Talente ---------- */}
      <Section labelledBy="talents-title" className="border-t">
        <SectionHeading id="talents-title" index={next()} eyebrow="Passende Talente" title={`Kreative mit Erfahrung in ${ind.name}.`} text="Kuratiert und verifiziert – Profile und Kontaktaufnahme nach Anmeldung." />
        {talents.length === 0 ? (
          <EmptyRow title="Noch keine passenden Profile" description="Wir bauen das Netzwerk für diese Branche gerade aus." />
        ) : (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {talents.map((p) => <ProfileCard key={p.slug} profile={p} />)}
          </div>
        )}
      </Section>

      {/* ---------- Werke ---------- */}
      <Section labelledBy="works-title" className="border-t">
        <SectionHeading id="works-title" index={next()} eyebrow="Aus dem Lizenz-Katalog" title="Sofort lizenzierbar." text="Werke, die besonders gut zu dieser Branche passen – mit Hörprobe und Preisen je Lizenzstufe." />
        {matchingWorks.length === 0 ? (
          <EmptyRow title="Noch keine Werke für diese Branche" description="Neue Werke kommen laufend dazu." />
        ) : (
          <ol className="mt-14 border-t">
            {matchingWorks.map((w, i) => <WorkRow key={w.id} work={w} index={i} />)}
          </ol>
        )}
        <div className="mt-8">
          <CtaLink href="/lizenzen" variant="outline">Zum Katalog <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </Section>

      {/* ---------- Unternehmen + Ausschreibungen ---------- */}
      <Section labelledBy="companies-title" className="border-t">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <Eyebrow>{next()} — Im Netzwerk</Eyebrow>
            <h2 id="companies-title" className="poster mt-6 text-[clamp(2.6rem,7.4vw,8rem)] text-balance">Unternehmen aus {ind.name}</h2>
          </div>
          <p className="meta text-muted-foreground lg:col-span-4 lg:pb-2 lg:text-right">{pad(companies.length)} Unternehmen</p>
        </div>
        {companies.length === 0 ? (
          <EmptyRow title="Noch keine Unternehmen" description="Seid die ersten aus eurer Branche." />
        ) : (
          <ul className="mt-14 border-t">
            {companies.map((c) => (
              <li key={c.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-12 lg:gap-x-6">
                <span aria-hidden className="poster grid aspect-square place-items-center bg-[var(--ink)] text-2xl text-[var(--bone)] lg:col-span-1">
                  {c.name.replace(/[^A-Za-zÄÖÜäöü0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 lg:col-span-6">
                  <p className="flex items-center gap-1.5 text-lg font-semibold tracking-tight sm:text-xl">
                    {c.name}
                    {c.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verifiziertes Unternehmen" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.tagline}</p>
                </div>
                <p className="meta col-span-full flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground lg:col-span-5 lg:justify-end">
                  <span>{c.city}</span>
                  <span>{c.size} Mitarbeitende</span>
                  {c.founded && <span>seit {c.founded}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-24 flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Offene Ausschreibungen</Eyebrow>
            <h2 className="poster mt-4 text-[clamp(2.2rem,4vw,4rem)]">Aktuelle Projekte</h2>
          </div>
          <p className="meta text-muted-foreground">{pad(opps.length)} offen</p>
        </div>
        {opps.length === 0 ? (
          <EmptyRow title="Gerade keine offenen Ausschreibungen" description="Veröffentlicht eure eigene – passende Kreative pitchen direkt." />
        ) : (
          <OpportunityList items={opps} />
        )}
      </Section>

      {/* ---------- Ablauf + Rechte: Split, Rechte auf dunkler Fläche ---------- */}
      <section aria-labelledby="process-title" className="grid border-t lg:grid-cols-12">
        <div className="gutter py-20 sm:py-32 lg:col-span-7">
          <Eyebrow>{next()} — Ablauf</Eyebrow>
          <h2 id="process-title" className="poster mt-6 text-[clamp(2.6rem,6.4vw,7rem)] text-balance">So arbeiten wir zusammen.</h2>
          <ol className="mt-14 border-t">
            {detail.process.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 border-b py-6 sm:gap-x-10">
                <span className="poster text-[clamp(2.6rem,5vw,4.5rem)] text-primary tabular-nums">{pad(i + 1)}</span>
                <div className="min-w-0 self-center">
                  <p className="meta text-muted-foreground">Schritt {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{p.title}</h3>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="gutter flex flex-col bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-32 lg:col-span-5">
          <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />§ Rechte</p>
          <h2 className="poster mt-6 text-[clamp(2.4rem,4.6vw,5rem)]">Rechte & Lizenzen</h2>
          <ul className="mt-10 border-t border-white/15">
            {detail.rights.map((r, i) => (
              <li key={r} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-white/15 py-4 text-sm text-white/80">
                <span className="meta text-[var(--signal)]">§{pad(i + 1)}</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="meta mt-8 text-white/50">Allgemeine Hinweise, keine Rechtsberatung. Verträge basieren auf geprüften Vorlagen.</p>
        </div>
      </section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section aria-labelledby="ind-cta" className="gutter border-t py-24 sm:py-36">
        <Eyebrow>Creative Connect · {ind.name}</Eyebrow>
        <h2 id="ind-cta" className="poster mt-8 text-[clamp(3rem,10vw,11rem)] text-balance">
          Projekt in <span className="text-primary">{ind.name}</span> geplant?
        </h2>
        <div className="mt-12 grid gap-8 border-t pt-8 lg:grid-cols-12">
          <p className="max-w-xl text-muted-foreground sm:text-lg lg:col-span-6">Beschreibt euer Vorhaben – wir schlagen Crew, Werke und Lizenzmodell vor.</p>
          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-6 lg:justify-end">
            {canRegister && <CtaLink href="/registrieren">Projekt starten <ArrowUpRight className="size-4" aria-hidden /></CtaLink>}
            <CtaLink href="/fuer-unternehmen#kontakt" variant={canRegister ? "outline" : "primary"}>Demo anfragen</CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}

// Leerzustand als Tafelzeile statt abgerundeter Box
function EmptyRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-14 grid gap-2 border-y border-dashed py-10 sm:grid-cols-12 sm:gap-6">
      <span className="meta text-muted-foreground sm:col-span-1">—</span>
      <p className="font-semibold sm:col-span-5">{title}</p>
      <p className="text-sm text-muted-foreground sm:col-span-6">{description}</p>
    </div>
  );
}
