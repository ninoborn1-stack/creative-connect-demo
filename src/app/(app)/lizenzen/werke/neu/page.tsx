import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { WorkForm } from "@/components/licensing/work-form";

export const metadata = { title: "Werk hinzufügen" };

export default async function NewWorkPage() {
  const user = await requireUser();
  if (!user.isCreative && !user.isAdmin) redirect("/lizenzen/werke");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/lizenzen/werke" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Zurück zu meinen Werken
      </Link>
      <PageHeader title="Werk hinzufügen" description="Ein fertiges Werk zur Lizenzierung anbieten – Unternehmen lizenzieren es direkt nach Umfang, Medien, Gebiet und Laufzeit." />
      <WorkForm
        initial={{
          type: "", title: "", description: "", tags: [], industries: [], durationSec: null, bpm: null, musicalKey: null,
          priceStandard: "", priceExtended: "", priceExclusive: "", aiMarked: null,
        }}
      />
    </div>
  );
}
