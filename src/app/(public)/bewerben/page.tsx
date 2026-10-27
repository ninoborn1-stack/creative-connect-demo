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
    <>
      {/* ---------- Plakat-Kopf ---------- */}
      <section className="gutter bg-[var(--ink)] pt-14 pb-12 text-[var(--bone)] sm:pt-20 sm:pb-16">
        <p className="meta flex items-center gap-3 text-white/70"><span aria-hidden className="size-2 bg-[var(--signal)]" />Bewerbung für Kreative</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 className="poster text-[clamp(3rem,9vw,10rem)] text-balance lg:col-span-8">Werde Teil von Nestos Netzwerk.</h1>
          <p className="text-base text-pretty text-white/75 sm:text-lg lg:col-span-4 lg:pb-2">
            Musik, Film, Foto, Design, Schauspiel, Booking – Creative Connect ist die professionelle Schnittstelle zwischen Kreativen und Unternehmen. In drei Schritten zu deinem Profil.
          </p>
        </div>
        <ul className="mt-12 hidden gap-px border border-white/15 bg-white/15 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <li key={p.title} className="bg-[var(--ink)] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="meta text-white/50">{String(i + 1).padStart(2, "0")}</span>
                <p.icon className="size-4 text-[var(--signal)]" aria-hidden />
              </div>
              <p className="mt-8 font-semibold">{p.title}</p>
              <p className="mt-1.5 text-sm text-white/65">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Wizard mit Meta-Spalte ---------- */}
      <div className="gutter grid gap-8 py-12 sm:py-16 lg:grid-cols-12 lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:col-span-3 lg:self-start">
          <p className="meta text-muted-foreground">Drei Schritte · Auto-Analyse</p>
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
            Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link>
          </p>
        </aside>
        <div className="min-w-0 lg:col-span-9 xl:col-span-8">
          <ApplyWizard initialCode={code} />
        </div>
      </div>
    </>
  );
}
