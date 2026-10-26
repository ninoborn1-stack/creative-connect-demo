import type { Metadata } from "next";
import Link from "next/link";
import { Gamepad2, ScanSearch, ShieldCheck, Users } from "lucide-react";
import { ApplyWizard } from "@/components/apply/apply-wizard";

export const metadata: Metadata = {
  title: "Bewerben",
  description: "Bewirb dich als Kreative:r bei Creative Connect – mit Auto-Analyse deines Profils und Fast-Track über Nestos Netzwerk.",
};

const POINTS = [
  { icon: Users, title: "Fast-Track über das Netzwerk", text: "Eingeladen oder empfohlen? Deine Bewerbung wird priorisiert – Entscheidung meist innerhalb von 48 h." },
  { icon: ScanSearch, title: "Auto-Analyse statt Formular-Marathon", text: "Wir lesen Skills, Credits und Branchen direkt aus deinen Links und Texten. Du prüfst und ergänzt nur." },
  { icon: Gamepad2, title: "Für Labels, Marken und Studios", text: "Gaming, Werbung, Film & TV: Unternehmen suchen hier gezielt Kreative – und lizenzieren eure Werke." },
  { icon: ShieldCheck, title: "Menschen entscheiden", text: "Die Vorprüfung sortiert nur. Jede Bewerbung sieht Nestos Team persönlich an." },
];

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code.trim().toUpperCase().slice(0, 40) : undefined;
  return (
    <div className="glow">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:py-16 lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Bewerbung für Kreative</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Werde Teil von Nestos Netzwerk.</h1>
          <p className="mt-4 text-muted-foreground">
            Musik, Film, Foto, Design, Schauspiel, Booking – Creative Connect ist die professionelle Schnittstelle zwischen Kreativen und Unternehmen. In drei Schritten zu deinem Profil.
          </p>
          <ul className="mt-8 hidden space-y-5 sm:block">
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
            Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link>
          </p>
        </div>
        <ApplyWizard initialCode={code} />
      </div>
    </div>
  );
}
