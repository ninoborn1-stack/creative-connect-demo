import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, HandCoins, Megaphone, Network, ScanSearch, Send, Sparkles, UserCheck, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Eyebrow, FaqList, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";

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
        <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/bewerben">Als Kreative:r bewerben <ArrowRight className="size-4" aria-hidden /></Link></Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
          <Link href="/invite/CC-DEMO-2026">Einladung einlösen</Link>
        </Button>
      </PageHero>

      <Section labelledBy="why-title">
        <SectionHeading id="why-title" eyebrow="Warum dabei sein" title="Mehr Aufträge, mehr Einnahmen, weniger Papierkram." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <li key={r.title} className="rounded-3xl border bg-card p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><r.icon className="size-5" aria-hidden /></span>
              <h3 className="mt-5 text-lg font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="apply-title" className="border-t bg-muted/30">
        <SectionHeading id="apply-title" eyebrow="Bewerbung" title="Zwei Wege ins Netzwerk." text="Jede Aufnahme wird vom Team geprüft – so bleibt die Qualität hoch und das Vertrauen der Unternehmen groß." />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border bg-card p-6 sm:p-8">
            <Eyebrow className="text-muted-foreground">Weg 1</Eyebrow>
            <h3 className="mt-2 text-xl font-semibold">Selbstbewerbung mit Auto-Analyse</h3>
            <ol className="mt-6 space-y-4">
              {[
                { icon: Send, t: "Profil, Links und Portfolio einreichen" },
                { icon: ScanSearch, t: "Auto-Analyse erkennt Skills, Credits und Branchen" },
                { icon: UserCheck, t: "Prüfung durch das Team, Rückmeldung per Mail" },
              ].map((s, i) => (
                <li key={s.t} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="pt-1 text-sm">{s.t}</span>
                </li>
              ))}
            </ol>
          </article>
          <article className="rounded-3xl border border-primary/50 bg-primary/10 p-6 sm:p-8">
            <Eyebrow>Weg 2 · Fast-Track</Eyebrow>
            <h3 className="mt-2 text-xl font-semibold">Über Einladung oder Nestos Netzwerk</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Du hast einen Einladungscode von einem Mitglied oder wurdest von Nesto empfohlen? Dann wirst du bevorzugt geprüft und bist meist innerhalb weniger Tage dabei.
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Empfehlungen zählen – das Netzwerk wächst über Vertrauen.</p>
          </article>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/bewerben">Jetzt bewerben <ArrowRight className="size-4" aria-hidden /></Link></Button>
        </div>
      </Section>

      <Section id="community" labelledBy="community-title" className="border-t">
        <div className="max-w-3xl">
          <Eyebrow>Community-Programm</Eyebrow>
          <h2 id="community-title" className="mt-3 text-2xl font-bold sm:text-3xl">Intern: Sessions mit Nesto, Events und Punkte.</h2>
          <p className="mt-3 text-muted-foreground">
            Für Mitglieder öffnet Nesto seinen Produktionskalender – Beat- und Songwriting-Sessions, Mix-Feedback, Workshops und Open-Studio-Abende. Wer sich einbringt, sammelt Punkte und tauscht sie gegen Studiozeit oder Feedback. Alles Weitere siehst du nach der Aufnahme im Mitgliederbereich.
          </p>
        </div>
      </Section>

      <Section labelledBy="faq-title" className="border-t bg-muted/30">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Fragen zur Aufnahme." />
          <FaqList items={FAQ} />
        </div>
      </Section>
    </>
  );
}
