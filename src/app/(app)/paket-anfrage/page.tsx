import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { PackageRequest } from "@/components/starter/package-request";

export const metadata: Metadata = { title: "Pakete" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PackageRequestPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  return (
    <>
      <PageHeader
        title="Pakete"
        description="Feste Produktionen zum Startpreis. Du wählst das Paket – Nesto und das Team stellen die Crew aus dem Netzwerk zusammen."
      />
      <PackageRequest initial={typeof sp.paket === "string" ? sp.paket : undefined} defaultCity={user.profile?.city} />
    </>
  );
}
