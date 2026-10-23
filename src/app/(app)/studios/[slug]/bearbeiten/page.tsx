import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { VenueForm } from "@/components/venues/venue-form";

export default async function EditVenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const venue = await db.venue.findUnique({ where: { slug } });
  if (!venue) notFound();
  if (venue.ownerId !== user.id && !user.isAdmin) redirect(`/studios/${slug}`);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/studios/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Zurück zur Venue
      </Link>
      <PageHeader title="Venue bearbeiten" description={venue.name} />
      <VenueForm
        initial={{
          id: venue.id, slug: venue.slug, name: venue.name, type: venue.type, city: venue.city, address: venue.address,
          description: venue.description, features: parseJson<string[]>(venue.features, []), pricePerHour: venue.pricePerHour,
          pricePerDay: venue.pricePerDay, capacity: venue.capacity, instantBook: venue.instantBook,
        }}
      />
    </div>
  );
}
