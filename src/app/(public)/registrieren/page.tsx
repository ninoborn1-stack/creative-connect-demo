import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getMarketplaceMode, getFees } from "@/lib/settings";
import { CtaLink } from "@/components/public/landing-bits";
import { PanelList, PosterSplit } from "@/components/public/form-bits";
import { RegisterForm } from "@/components/public/register-form";

export const metadata: Metadata = { title: "Firmenkonto anlegen" };

export default async function RegisterPage() {
  const [mode, fees] = await Promise.all([getMarketplaceMode(), getFees()]);

  if (mode === "closed") {
    return (
      <PosterSplit
        tone="primary"
        eyebrow="Phase 1 · Geschlossen"
        title="Geschlossenes Netzwerk"
        intro={
          <p>
            Creative Connect ist gerade ein geschlossenes Netzwerk: Nur eingeladene Mitglieder arbeiten miteinander. Unternehmen nehmen wir aktuell persönlich auf – fragt eine Demo an, Nesto und das Team melden sich.
          </p>
        }
      >
        <p className="meta text-muted-foreground">01 — Wie geht es weiter?</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <CtaLink href="/fuer-unternehmen#kontakt">Demo anfragen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          <CtaLink href="/invite/CC-DEMO-2026" variant="outline">Einladung einlösen</CtaLink>
        </div>
        <p className="mt-8 border-t pt-6 text-sm text-muted-foreground">Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
      </PosterSplit>
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
    <PosterSplit
      eyebrow="Für Unternehmen"
      title="Firmenkonto anlegen"
      intro={
        <p>
          Marke, Agentur, Game-Studio, Label oder Produktionsfirma: In zwei Minuten startklar – Kolleg:innen ladet ihr später als Teamkonten ein.
        </p>
      }
      aside={
        <>
          <PanelList items={perks.map((p) => ({ title: p }))} />
          <p className="mt-8 border-t border-white/15 pt-6 text-sm text-white/70">
            Rahmenvertrag, Einkauf über Bestellnummern oder Managed Crew gewünscht?{" "}
            <Link href="/fuer-unternehmen#kontakt" className="text-white underline underline-offset-4">Demo anfragen</Link>
          </p>
          <p className="meta mt-4 text-white/60">Schon ein Konto? <Link href="/login" className="text-white underline underline-offset-4">Anmelden</Link></p>
        </>
      }
    >
      <h2 className="poster mb-10 text-[clamp(2.2rem,4vw,3.8rem)]">Unternehmen registrieren</h2>
      <RegisterForm serviceFeePct={fees.serviceFeePct} />
    </PosterSplit>
  );
}
