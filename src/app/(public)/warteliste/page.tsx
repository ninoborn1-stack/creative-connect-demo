import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { PanelList, PosterSplit } from "@/components/public/form-bits";
import { WaitlistForm } from "@/components/public/waitlist-form";

export const metadata: Metadata = { title: "Warteliste" };

const POINTS = [
  { title: "Kuratiert", text: "Jedes Profil wird vom Team gesichtet, bevor es sichtbar wird." },
  { title: "Über Empfehlung", text: "Mitglieder laden ein – so bleibt das Netzwerk vertrauensvoll." },
  { title: "Schrittweise", text: "Wir nehmen regelmäßig neue Kreative aus der Warteliste auf." },
];

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const bereich = typeof sp.bereich === "string" && CATEGORIES.some((c) => c.slug === sp.bereich) ? sp.bereich : undefined;
  return (
    <PosterSplit
      tone="primary"
      eyebrow="Warteliste"
      title="Noch keine Einladung?"
      intro={
        <p>
          Creative Connect ist in Phase 1 ein geschlossenes Netzwerk. Trag dich ein – wir melden uns, sobald ein Platz in deinem Bereich frei wird.
        </p>
      }
      aside={
        <>
          <PanelList items={POINTS} />
          <p className="meta mt-8 text-primary-foreground/75">
            Du hast schon einen Code? <Link href="/invite/CC-DEMO-2026" className="text-primary-foreground underline underline-offset-4">Einladung einlösen</Link>
          </p>
        </>
      }
    >
      <p className="meta mb-8 text-muted-foreground">01 — Eintragen</p>
      <WaitlistForm defaultCategory={bereich} />
    </PosterSplit>
  );
}
