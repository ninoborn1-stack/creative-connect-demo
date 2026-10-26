import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { getMarketplaceMode, getFees } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/public/register-form";

export const metadata: Metadata = { title: "Firmenkonto anlegen" };

export default async function RegisterPage() {
  const [mode, fees] = await Promise.all([getMarketplaceMode(), getFees()]);

  if (mode === "closed") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary"><Lock className="size-6" aria-hidden /></span>
        <h1 className="mt-6 text-3xl font-bold">Geschlossenes Netzwerk</h1>
        <p className="mt-3 text-muted-foreground">
          Creative Connect ist gerade ein geschlossenes Netzwerk: Nur eingeladene Mitglieder arbeiten miteinander. Unternehmen nehmen wir aktuell persönlich auf – fragt eine Demo an, Nesto und das Team melden sich.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" className="h-11 px-5"><Link href="/fuer-unternehmen#kontakt">Demo anfragen</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5"><Link href="/invite/CC-DEMO-2026">Einladung einlösen</Link></Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
      </div>
    );
  }

  const perks = [
    "Geprüfte Kreative für Musik, Game-Audio, Film, Foto, Design und Voice",
    "Crew beauftragen, Werke lizenzieren oder Ausschreibungen veröffentlichen",
    "Verträge, Nutzungsrechte und Lizenzzertifikate an einem Ort",
    "Zahlung über Zahlungsdienstleister, Rechnungen automatisch – auf Wunsch als Sammelrechnung",
    `${fees.serviceFeePct} % Servicegebühr auf Honorare und Lizenzen – keine Grundgebühr`,
  ];

  return (
    <div className="glow">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_1.3fr] md:py-20">
        <div>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Für Unternehmen</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Firmenkonto anlegen</h1>
          <p className="mt-4 text-muted-foreground">
            Marke, Agentur, Game-Studio, Label oder Produktionsfirma: In zwei Minuten startklar – Kolleg:innen ladet ihr später als Teamkonten ein.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{p}
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground">
            Rahmenvertrag, Einkauf über Bestellnummern oder Managed Crew gewünscht?{" "}
            <Link href="/fuer-unternehmen#kontakt" className="text-primary underline-offset-4 hover:underline">Demo anfragen</Link>
          </p>
          <p className="mt-6 text-sm text-muted-foreground">Schon ein Konto? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
        </div>
        <div className="rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Unternehmen registrieren</h2>
          <RegisterForm serviceFeePct={fees.serviceFeePct} />
        </div>
      </div>
    </div>
  );
}
