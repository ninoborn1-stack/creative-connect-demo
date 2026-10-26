import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, AudioLines, BadgeCheck, Building2, Clapperboard, Globe, Languages, MapPin, Megaphone, Mic2, Palette, Scale, Waves,
} from "lucide-react";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_TIERS } from "@/lib/constants";
import { formatEur, parseJson } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProfileCard } from "@/components/profile-card";
import { UserAvatar } from "@/components/user-avatar";
import { StockImage } from "@/components/stock-image";
import { Eyebrow, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS, rankProfilesForIndustry, worksForIndustry } from "@/components/public/industry-data";
import { PUBLIC_WORK_SELECT, WorkCard } from "@/components/public/work-card";
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

  return (
    <>
      <PageHero eyebrow="Branche" title={ind.name} text={ind.tagline} imageSeed={detail.imageSeed}>
        {canRegister ? (
          <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/registrieren">Projekt starten <ArrowRight className="size-4" aria-hidden /></Link></Button>
        ) : (
          <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/fuer-unternehmen#kontakt">Demo anfragen <ArrowRight className="size-4" aria-hidden /></Link></Button>
        )}
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
          <Link href="/lizenzen">Lizenz-Katalog</Link>
        </Button>
      </PageHero>

      {/* ---------- Bedarfe ---------- */}
      <Section labelledBy="needs-title">
        <SectionHeading id="needs-title" eyebrow="Typische Bedarfe" title={`Was ${isGaming ? "Studios" : "Unternehmen"} bei uns einkaufen.`} />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ind.needs.map((n, i) => (
            <li key={n} className="rounded-2xl border bg-card p-5">
              <span className="font-heading text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-semibold">{n}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Gaming: Leistungen, Lizenzmodelle, Beispiel-Crew ---------- */}
      {isGaming && (
        <>
          <Section labelledBy="game-services-title" className="border-t bg-muted/30">
            <SectionHeading
              id="game-services-title"
              eyebrow="Für Game-Studios"
              title="Von adaptiver Musik bis Season-Trailer."
              text="Kreative, die Pipelines, Middleware und Release-Zyklen von Games kennen – vom Indie-Team bis zum Live-Service-Titel."
            />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GAMING_SERVICES.map((s) => (
                <li key={s.title} className="rounded-3xl border bg-card p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><s.icon className="size-5" aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section labelledBy="game-lic-title" className="border-t">
            <SectionHeading id="game-lic-title" eyebrow="Lizenzmodelle für Games" title="Weltweit, unbefristet, plattformübergreifend." text="PC, Konsole, Mobile, Streaming von Gameplay, DLCs und Marketing – die Rechte passen zu eurem Release-Plan." />
            <div className="mt-10 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <caption className="sr-only">Lizenzmodelle für Games</caption>
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                  <tr><th scope="col" className="px-4 py-3 font-medium">Modell</th><th scope="col" className="px-4 py-3 font-medium">Umfang</th><th scope="col" className="px-4 py-3 font-medium">Typisch für</th></tr>
                </thead>
                <tbody className="divide-y">
                  {GAME_LICENSES.map((l) => (
                    <tr key={l.model}>
                      <th scope="row" className="px-4 py-3 font-semibold">{l.model}</th>
                      <td className="px-4 py-3 text-muted-foreground">{l.scope}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Globe className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Plattformen: PC, PlayStation, Xbox, Nintendo, Mobile, Cloud-Gaming. Streaming und Let’s Plays durch Spieler:innen sind immer freigegeben.
            </p>
          </Section>

          <Section labelledBy="crew-title" className="border-t bg-muted/30">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <SectionHeading id="crew-title" eyebrow="Beispiel-Crew" title="Indie-Studio braucht Soundtrack + 6 Sprecher:innen." text="So stellt Nesto eine Crew für ein narratives Indie-Game zusammen – besetzt mit Mitgliedern aus dem Netzwerk." />
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li>· 45 Minuten adaptive Musik, Implementierung in Wwise</li>
                  <li>· ca. 1.800 Voice-Lines, Aufnahme in Hamburg</li>
                  <li>· Buyout weltweit, unbefristet, alle Plattformen</li>
                  <li>· Laufzeit 8 Wochen, Lieferung pro Milestone</li>
                </ul>
              </div>
              <article className="overflow-hidden rounded-3xl border bg-card">
                <div className="relative aspect-[21/9]">
                  <StockImage seed="cc-crew-indie-game" w={900} h={386} sizes="(max-width: 1024px) 100vw, 55vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Narratives Indie-Game · 8 Wochen</p>
                </div>
                <ul className="divide-y px-4">
                  {crew.map((r) => (
                    <li key={r.label} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.people.length > 0 ? r.people.map((p) => p.user.name).join(", ") : "wird über Ausschreibung besetzt"}</p>
                      </div>
                      <div className="flex -space-x-2">
                        {r.people.slice(0, 6).map((p) => <UserAvatar key={p.user.id} name={p.user.name} seed={p.avatarSeed} className="size-8 ring-2 ring-card" />)}
                      </div>
                      <span className="w-20 text-right text-sm font-semibold tabular-nums">{formatEur(r.budget)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Budget gesamt (netto, inkl. Buyouts)</span>
                  <span className="font-semibold">{formatEur(crewTotal)}</span>
                </div>
              </article>
            </div>
          </Section>
        </>
      )}

      {/* ---------- Talente ---------- */}
      <Section labelledBy="talents-title" className="border-t">
        <SectionHeading id="talents-title" eyebrow="Passende Talente" title={`Kreative mit Erfahrung in ${ind.name}.`} text="Kuratiert und verifiziert – Profile und Kontaktaufnahme nach Anmeldung." />
        {talents.length === 0 ? (
          <div className="mt-10"><EmptyState title="Noch keine passenden Profile" description="Wir bauen das Netzwerk für diese Branche gerade aus." /></div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {talents.map((p) => <ProfileCard key={p.slug} profile={p} />)}
          </div>
        )}
      </Section>

      {/* ---------- Werke ---------- */}
      <Section labelledBy="works-title" className="border-t bg-muted/30">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="works-title" eyebrow="Aus dem Lizenz-Katalog" title="Sofort lizenzierbar." text="Werke, die besonders gut zu dieser Branche passen – mit Hörprobe und Preisen je Lizenzstufe." />
          <Button asChild variant="outline" className="h-11 w-fit rounded-full px-5"><Link href="/lizenzen">Zum Katalog <ArrowRight className="size-4" aria-hidden /></Link></Button>
        </div>
        {matchingWorks.length === 0 ? (
          <div className="mt-10"><EmptyState title="Noch keine Werke für diese Branche" description="Neue Werke kommen laufend dazu." /></div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingWorks.map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        )}
      </Section>

      {/* ---------- Unternehmen + Ausschreibungen ---------- */}
      <Section labelledBy="companies-title" className="border-t">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Im Netzwerk</Eyebrow>
            <h2 id="companies-title" className="mt-3 text-3xl font-bold sm:text-4xl">Unternehmen aus {ind.name}</h2>
            {companies.length === 0 ? (
              <div className="mt-8"><EmptyState icon={Building2} title="Noch keine Unternehmen" description="Seid die ersten aus eurer Branche." /></div>
            ) : (
              <ul className="mt-8 space-y-3">
                {companies.map((c) => (
                  <li key={c.id} className="flex items-start gap-4 rounded-2xl border bg-card p-4">
                    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-heading text-lg font-bold text-primary">
                      {c.name.replace(/[^A-Za-zÄÖÜäöü0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-semibold">
                        {c.name}
                        {c.verified && <BadgeCheck className="size-4 text-primary" aria-label="Verifiziertes Unternehmen" />}
                      </p>
                      <p className="text-sm text-muted-foreground">{c.tagline}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden />{c.city}</span>
                        <span>{c.size} Mitarbeitende</span>
                        {c.founded && <span>seit {c.founded}</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <Eyebrow>Offene Ausschreibungen</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Aktuelle Projekte</h2>
            <div className="mt-8">
              {opps.length === 0 ? (
                <EmptyState icon={Megaphone} title="Gerade keine offenen Ausschreibungen" description="Veröffentlicht eure eigene – passende Kreative pitchen direkt." />
              ) : (
                <OpportunityList items={opps} />
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Ablauf + Rechte ---------- */}
      <Section labelledBy="process-title" className="border-t bg-muted/30">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading id="process-title" eyebrow="Ablauf" title="So arbeiten wir zusammen." />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2">
              {detail.process.map((p, i) => (
                <li key={p.title} className="rounded-2xl border bg-card p-5">
                  <span className="font-heading text-sm font-bold text-primary">Schritt {i + 1}</span>
                  <h3 className="mt-2 font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Scale className="size-5" aria-hidden /></span>
            <h2 className="mt-5 text-2xl font-bold">Rechte & Lizenzen</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {detail.rights.map((r) => <li key={r} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{r}</li>)}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">Allgemeine Hinweise, keine Rechtsberatung. Verträge basieren auf geprüften Vorlagen.</p>
          </div>
        </div>
      </Section>

      <section aria-labelledby="ind-cta" className="px-4 py-20">
        <div className="glow mx-auto max-w-4xl rounded-[2rem] border bg-card px-6 py-12 text-center sm:px-12">
          <h2 id="ind-cta" className="text-3xl font-bold text-balance sm:text-4xl">Projekt in {ind.name} geplant?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Beschreibt euer Vorhaben – wir schlagen Crew, Werke und Lizenzmodell vor.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {canRegister && <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/registrieren">Projekt starten</Link></Button>}
            <Button asChild size="lg" variant={canRegister ? "outline" : "default"} className="h-12 rounded-full px-6"><Link href="/fuer-unternehmen#kontakt">Demo anfragen</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
