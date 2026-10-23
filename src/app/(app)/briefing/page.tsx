import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { DEMO_BRIEFINGS, MOCK_TRANSCRIPT } from "@/lib/services/ai";
import { PageHeader } from "@/components/page-header";
import { BriefingAssistant } from "@/components/briefing/briefing-assistant";

export const metadata: Metadata = { title: "Briefing-Assistent" };

export default async function BriefingPage() {
  await requireUser();
  const fees = await getFees();
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Briefing-Assistent"
        description="Beschreib dein Projekt in eigenen Worten. Der Assistent macht daraus ein strukturiertes Briefing, schlägt Rollen, Budgetverteilung und passende Crew vor – du entscheidest."
      />
      <BriefingAssistant
        demos={DEMO_BRIEFINGS}
        transcript={MOCK_TRANSCRIPT}
        fees={{ serviceFeePct: fees.serviceFeePct, managedMarginPct: fees.managedMarginPct, kskRatePct: fees.kskRatePct, kskThresholdEur: fees.kskThresholdEur }}
      />
    </div>
  );
}
