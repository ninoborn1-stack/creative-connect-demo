import type { Metadata } from "next";
import { ArrowUpRight, Building2, FileCheck2, HandCoins, Megaphone, Network, ScanSearch, Send, Sparkles, UserCheck, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { CtaLink, Eyebrow, FaqList, Marquee, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";

export const metadata: Metadata = {
  title: "Für Kreative",
  description: "Aufträge von Unternehmen, Lizenz-Einnahmen und Ausschreibungen – mit 0 % Provision. Jetzt bei Creative Connect bewerben.",
};

const FAQ = [
  { q: "Wer kann sich bewerben?", a: "Professionelle Kreative aus Musik, Game-Audio, Film, Foto, Design, Schauspiel/Voice und Booking – mit Portfolio und Referenzen. Auch Studios und kleine Teams sind willkommen." },
  { q: "Was prüft die Auto-Analyse?", a: "Sie liest Portfolio, Lebenslauf und Links aus, erkennt Skills, Credits und passende Branchen und schlägt einen Tagessatz-Rahmen vor. Entscheiden tut immer ein Mensch aus dem Team." },
  { q: "Wie funktioniert der Fast-Track?", a: "Wer von einem Mitglied eingeladen oder aus Nestos Netzwerk empfohlen wird, landet direkt in der bevorzugten Prüfung – meist innerhalb weniger Tage." },
  { q: "Wem gehören meine Werke im Lizenz-Katalog?", a: "Weiterhin dir. Du vergibst nur Nutzungsrechte in der jeweiligen Stufe – die Lizenzgebühr geht vollständig an dich." },
];

export default async function ForCreativesPage() {
  const [fees, companyCount, openOpps] = await Promise.all([
    getFees(),
    db.company.count(),
    db.opportunity.count({ where: { status: "offen" } }),
  ]);

  const reasons = [
    { icon: HandCoins, title: `${fees.creativeCommissionPct} % Provision`, text: "Dein Honorar gehört dir. Die Servicegebühr zahlen die Auftraggeber, transparent ausgewiesen." },
    { icon: Building2, title: "Aufträge von Unternehmen", text: `${companyCount} Marken, Studios, Labels und Konzerne suchen hier Kreative – mit Verträgen und gesicherter Zahlung.` },
    { icon: FileCheck2, title: "Werke lizenzieren", text: "Tracks, Sounds, Voice-Packs, Artworks oder Footage in den Katalog stellen und an jeder Lizenz verdienen." },
    { icon: Megaphone, title: "Ausschreibungen", text: `Aktuell ${openOpps} offene Ausschreibungen. Pitche direkt mit Portfolio und Angebot.` },
    { icon: Network, title: "Nestos Netzwerk", text: "Gründer Nesto von Drabich bringt ein großes, gewachsenes Netzwerk aus Musik, Film und Games mit – du wirst Teil davon." },
    { icon: Users, title: "Community intern", text: "Für Mitglieder gibt es intern Sessions mit Nesto, Events und ein Punkteprogramm – kein Muss, aber ein Plus." },
  ];

  return (
    <>
      <PageHero
        eyebrow="Für Kreative"
        title="Arbeite für Marken, Studios und Labels – zu deinen Konditionen."
        text="Creative Connect bringt geprüfte Kreative mit Unternehmen zusammen. Produktion, Licensing und Ausschreibungen in einem professionellen Netzwerk."
        imageSeed="cc-fuer-kreative-studio"
      >
        <CtaLink href="/bewerben" variant="light">Als Kreative:r bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        <CtaLink href="/invite/CC-DEMO-2026" variant="ghost">Einladung einlösen</CtaLink>
      </PageHero>

      {/* ---------- Laufband: Gewerke ---------- */}
      <div className="bg-primary py-4 text-primary-foreground sm:py-6">
        <Marquee
          items={[`${fees.creativeCommissionPct} % Provision`, "Musik", "Game-Audio", "Film", "Foto", "Design", "Voice", "Booking"]}
          itemClassName="poster text-[clamp(2.4rem,6vw,5.5rem)]"
          speed="45s"
        />
      </div>

      {/* ---------- Gründe ---------- */}
      <Section labelledBy="why-title">
        <SectionHeading id="why-title" index="01" eyebrow="Warum dabei sein" title="Mehr Aufträge, mehr Einnahmen, weniger Papierkram." />
        <ul className="mt-16 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <li key={r.title} className="flex flex-col bg-background p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="meta text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <r.icon className="size-5 text-primary" aria-hidden />
              </div>
              <h3 className="poster mt-12 text-[clamp(2rem,3vw,3rem)]">{r.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Zwei Wege: Split über die volle Breite ---------- */}
      <section aria-labelledby="apply-title" className="border-t">
        <div className="gutter py-20 sm:py-32">
          <SectionHeading id="apply-title" index="02" eyebrow="Bewerbung" title="Zwei Wege ins Netzwerk." text="Jede Aufnahme wird vom Team geprüft – so bleibt die Qualität hoch und das Vertrauen der Unternehmen groß." />
        </div>
        <div className="grid lg:grid-cols-2">
          <article className="gutter border-t py-12 sm:py-16 lg:border-r">
            <p className="meta text-muted-foreground">Weg 01</p>
            <h3 className="poster mt-6 text-[clamp(2.4rem,4.4vw,4.8rem)]">Selbstbewerbung mit Auto-Analyse</h3>
            <ol className="mt-10 border-t">
              {[
                { icon: Send, t: "Profil, Links und Portfolio einreichen" },
                { icon: ScanSearch, t: "Auto-Analyse erkennt Skills, Credits und Branchen" },
                { icon: UserCheck, t: "Prüfung durch das Team, Rückmeldung per Mail" },
              ].map((s, i) => (
                <li key={s.t} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b py-4">
                  <span className="meta text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm sm:text-base">{s.t}</span>
                  <s.icon className="size-4 text-muted-foreground" aria-hidden />
                </li>
              ))}
            </ol>
          </article>
          <article className="gutter flex flex-col bg-primary py-12 text-primary-foreground sm:py-16">
            <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />Weg 02 · Fast-Track</p>
            <h3 className="poster mt-6 text-[clamp(2.4rem,4.4vw,4.8rem)]">Über Einladung oder Nestos Netzwerk</h3>
            <p className="mt-8 max-w-lg text-primary-foreground/85 sm:text-lg">
              Du hast einen Einladungscode von einem Mitglied oder wurdest von Nesto empfohlen? Dann wirst du bevorzugt geprüft und bist meist innerhalb weniger Tage dabei.
            </p>
            <p className="mt-6 flex items-start gap-2 border-t border-primary-foreground/25 pt-6 text-sm"><Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />Empfehlungen zählen – das Netzwerk wächst über Vertrauen.</p>
          </article>
        </div>
        <div className="gutter flex flex-col gap-2 border-t py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="meta text-muted-foreground">Selbstbewerbung oder Fast-Track</p>
          <CtaLink href="/bewerben">Jetzt bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </section>

      {/* ---------- Community ---------- */}
      <section id="community" aria-labelledby="community-title" className="gutter scroll-mt-16 bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />03 — Community-Programm</p>
            <h2 id="community-title" className="poster mt-6 text-[clamp(2.6rem,6.4vw,7rem)] text-balance">Intern: Sessions mit Nesto, Events und Punkte.</h2>
          </div>
          <p className="text-white/70 sm:text-lg lg:col-span-4 lg:pb-2">
            Für Mitglieder öffnet Nesto seinen Produktionskalender – Beat- und Songwriting-Sessions, Mix-Feedback, Workshops und Open-Studio-Abende. Wer sich einbringt, sammelt Punkte und tauscht sie gegen Studiozeit oder Feedback. Alles Weitere siehst du nach der Aufnahme im Mitgliederbereich.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Section labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>04 — FAQ</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">Fragen zur Aufnahme.</h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ} />
          </div>
        </div>
      </Section>
    </>
  );
}
