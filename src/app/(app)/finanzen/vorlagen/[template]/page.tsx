import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Scale } from "lucide-react";
import { CONTRACT_TEMPLATES } from "@/lib/constants";
import { getFees } from "@/lib/settings";
import { formatDate, formatEur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ContractDocument } from "@/components/finance/contract-document";
import { PLACEHOLDER_LABEL, type ContractValues } from "@/components/finance/contract-templates";

const SAMPLES: Record<string, { service: string; usageRights: string; compensation: number; partyB: string }> = {
  werkvertrag: {
    service: "Produktion, Mix und Mastering der Single „Neonregen“ (3:30 min) inklusive Instrumental-Version.",
    usageRights: "Ausschließliches Nutzungsrecht, weltweit, zeitlich unbegrenzt, alle Verwertungsarten",
    compensation: 2400,
    partyB: "Mika Hoffmann (Musikproduktion)",
  },
  nutzungsrechte: {
    service: "Pressefotos und ein 30-Sekunden-Teaser für die Tour-Ankündigung, Shooting in Leipzig.",
    usageRights: "Einfaches Nutzungsrecht, Online & Social Media, Deutschland, 24 Monate",
    compensation: 1800,
    partyB: "Jule Brandt (Fotografie/Videografie)",
  },
  studiomiete: {
    service: "Studio A, zwei Drehtage inkl. Hohlkehle, Licht-Grundpaket und Maske.",
    usageRights: "Alle Rechte an den Aufnahmen verbleiben bei der Auftraggeber:in",
    compensation: 950,
    partyB: "Studio Kesselhaus (Tonstudio)",
  },
  booking: {
    service: "DJ-Set (90 Minuten) beim Release-Abend im Club Distillery.",
    usageRights: "Mitschnitt und Fotos für Social Media des Labels, 12 Monate",
    compensation: 600,
    partyB: "Selin Aydın (Booking)",
  },
};

export default async function TemplatePreviewPage({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  const meta = CONTRACT_TEMPLATES[template];
  const sample = SAMPLES[template];
  if (!meta || !sample) notFound();

  const fees = await getFees();
  const values: ContractValues = {
    title: `${meta.title} – Beispiel`,
    partyA: "Nordlicht Records (Beispiel)",
    partyB: sample.partyB,
    service: sample.service,
    usageRights: sample.usageRights,
    compensation: formatEur(sample.compensation),
    serviceFee: formatEur(Math.round((sample.compensation * fees.serviceFeePct) / 100)),
    serviceFeePct: String(fees.serviceFeePct),
    kskRate: fees.kskRatePct.toLocaleString("de-DE"),
    date: formatDate(new Date()),
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/finanzen#vorlagen">
          <ArrowLeft aria-hidden /> Alle Vorlagen
        </Link>
      </Button>

      <div>
        <p className="text-sm text-muted-foreground">Vorlagen-Vorschau</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{meta.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.summary}</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm" role="note">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p>
            <mark className="rounded bg-primary/15 px-1 font-medium text-primary ring-1 ring-primary/30">Hervorgehobene Stellen</mark>{" "}
            sind Platzhalter mit Beispielwerten. Im Projekt werden sie automatisch aus Briefing, Crew und Budget befüllt.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(PLACEHOLDER_LABEL) as (keyof ContractValues)[]).map((key) => (
              <li key={key} className="rounded-full border bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground" title={PLACEHOLDER_LABEL[key]}>
                {`{{${key}}}`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ContractDocument template={template} values={values} highlight>
        <section className="grid gap-4 border-t pt-6 md:grid-cols-2" aria-label="Unterschriftsfelder (Vorschau)">
          {["Partei A – Auftraggeber:in", "Partei B – Auftragnehmer:in"].map((label) => (
            <div key={label} className="rounded-lg border border-dashed p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <div className="mt-6 h-6 border-b border-dashed" aria-hidden />
              <p className="mt-2 text-xs text-muted-foreground">Unterschrift per Checkbox „Ich stimme zu“ + Name</p>
            </div>
          ))}
        </section>
      </ContractDocument>

      <p className="mx-auto flex max-w-3xl items-start gap-2 text-xs text-muted-foreground">
        <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Demo-Vorlage, kein Rechtsrat. Für echte Verträge bitte anwaltlich prüfen lassen.
      </p>
    </div>
  );
}
