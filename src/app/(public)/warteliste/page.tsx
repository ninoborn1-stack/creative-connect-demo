import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass, ShieldCheck, Users } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { WaitlistForm } from "@/components/public/waitlist-form";

export const metadata: Metadata = { title: "Warteliste" };

const POINTS = [
  { icon: ShieldCheck, title: "Kuratiert", text: "Jedes Profil wird vom Team gesichtet, bevor es sichtbar wird." },
  { icon: Users, title: "Über Empfehlung", text: "Mitglieder laden ein – so bleibt das Netzwerk vertrauensvoll." },
  { icon: Hourglass, title: "Schrittweise", text: "Wir nehmen regelmäßig neue Kreative aus der Warteliste auf." },
];

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const bereich = typeof sp.bereich === "string" && CATEGORIES.some((c) => c.slug === sp.bereich) ? sp.bereich : undefined;
  return (
    <div className="glow">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_1.2fr] md:py-20">
        <div>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Warteliste</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Noch keine Einladung?</h1>
          <p className="mt-4 text-muted-foreground">
            Creative Connect ist in Phase 1 ein geschlossenes Netzwerk. Trag dich ein – wir melden uns, sobald ein Platz in deinem Bereich frei wird.
          </p>
          <ul className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><p.icon className="size-4" aria-hidden /></span>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            Du hast schon einen Code? <Link href="/invite/CC-DEMO-2026" className="text-primary underline-offset-4 hover:underline">Einladung einlösen</Link>
          </p>
        </div>
        <div className="rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <WaitlistForm defaultCategory={bereich} />
        </div>
      </div>
    </div>
  );
}
