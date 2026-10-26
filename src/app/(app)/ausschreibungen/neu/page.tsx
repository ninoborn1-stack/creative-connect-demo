import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";

export const metadata: Metadata = { title: "Ausschreibung erstellen" };

export default async function NewOpportunityPage() {
  const user = await requireUser();
  if (!user.companyId && !user.isAdmin) redirect("/ausschreibungen");
  const [company, companies] = await Promise.all([
    user.companyId ? db.company.findUnique({ where: { id: user.companyId } }) : Promise.resolve(null),
    user.isAdmin ? db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve(undefined),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/ausschreibungen" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Alle Ausschreibungen
      </Link>
      <PageHeader
        title="Ausschreibung erstellen"
        description={company ? `Für ${company.name}. Kreative aus dem Netzwerk pitchen mit Preis und Referenzen – ihr wählt aus, die Zusage erzeugt Projekt, Vertrag und Zahlung.` : "Als Admin für ein beliebiges Unternehmen."}
      />
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">Lieber eine ganze Crew zusammenstellen? Der Briefing-Assistent schlägt Rollen, Budget und passende Kreative vor.</p>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/briefing"><Sparkles aria-hidden /> Mit Briefing-Assistent</Link>
        </Button>
      </div>
      <OpportunityForm
        companies={companies}
        defaultCompanyId={user.companyId ?? undefined}
        defaultIndustry={company?.industry}
        defaultCity={company?.city}
        minDate={format(new Date(), "yyyy-MM-dd")}
      />
    </div>
  );
}
