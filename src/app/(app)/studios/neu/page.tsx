import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { CITIES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { VenueForm } from "@/components/venues/venue-form";

export default async function NewVenuePage() {
  const user = await requireUser();
  const city = CITIES.some((c) => c.name === user.profile?.city) ? user.profile!.city : "";
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/studios" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Zurück zu Studios & Locations
      </Link>
      <PageHeader title="Eigene Venue anlegen" description="Biete dein Studio, deinen Proberaum oder deine Location dem Netzwerk an. Du setzt die Preise selbst – 0 % Provision." />
      <VenueForm
        initial={{ name: "", type: "", city, address: "", description: "", features: [], pricePerHour: "", pricePerDay: "", capacity: "", instantBook: true }}
      />
    </div>
  );
}
