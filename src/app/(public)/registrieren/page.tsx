import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { getMarketplaceMode, getFees } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/public/register-form";

export const metadata: Metadata = { title: "Projekt starten" };

export default async function RegisterPage() {
  const [mode, fees] = await Promise.all([getMarketplaceMode(), getFees()]);

  if (mode === "closed") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary"><Lock className="size-6" aria-hidden /></span>
        <h1 className="mt-6 text-3xl font-bold">Geschlossenes Netzwerk</h1>
        <p className="mt-3 text-muted-foreground">
          Creative Connect ist gerade in Phase 1: Nur eingeladene Mitglieder buchen sich gegenseitig. Die Registrierung für externe Auftraggeber:innen öffnet in Phase 2.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" className="h-11 px-5"><Link href="/invite/CC-DEMO-2026">Einladung einlösen</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5"><Link href="/warteliste">Auf die Warteliste</Link></Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
      </div>
    );
  }

  const perks = [
    "Briefing in zwei Minuten – der Assistent schlägt Rollen und Budget vor",
    "Kuratierte, verifizierte Kreative aus ganz Deutschland",
    "Verträge, Zahlung und Abnahme an einem Ort",
    `Nur ${fees.serviceFeePct} % Servicegebühr auf gebuchte Honorare – keine Grundgebühr`,
  ];

  return (
    <div className="glow">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_1.2fr] md:py-20">
        <div>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Für Auftraggeber:innen</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Projekt starten</h1>
          <p className="mt-4 text-muted-foreground">Label, Marke, Agentur oder Independent-Artist: Stell dir in wenigen Minuten deine Crew zusammen.</p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{p}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">Schon ein Konto? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
        </div>
        <div className="rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Konto als Auftraggeber:in</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
