import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/members/profile-form";

export const metadata: Metadata = { title: "Profil bearbeiten" };

export default async function ProfilBearbeitenPage() {
  const user = await requireUser();
  const p = user.profile;

  if (!p) {
    return (
      <>
        <PageHeader title="Profil bearbeiten" />
        <EmptyState
          icon={UserRound}
          title="Noch kein Kreativ-Profil"
          description="Dein Konto ist als Auftraggeber:in angelegt. Ein öffentliches Profil im Verzeichnis haben nur Kreative."
          action={<Button asChild><Link href="/dashboard">Zum Dashboard</Link></Button>}
        />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Profil bearbeiten"
        description="So sehen dich andere Mitglieder im Verzeichnis und auf deiner Profilseite."
        actions={<Button asChild variant="outline"><Link href={`/mitglieder/${p.slug}`}>Profil ansehen</Link></Button>}
      />
      <ProfileForm
        values={{
          headline: p.headline, bio: p.bio, city: p.city, travelRadiusKm: p.travelRadiusKm, dayRateMin: p.dayRateMin,
          dayRateMax: p.dayRateMax, availability: p.availability, skills: parseJson<string[]>(p.skills, []),
          instagram: p.instagram, website: p.website,
        }}
      />
    </div>
  );
}
