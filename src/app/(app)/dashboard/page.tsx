import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreativeDashboard } from "@/components/dashboard/creative-dashboard";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { CompanyDashboard } from "@/components/dashboard/company-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AdminCard() {
  const [members, disputes, waitlist] = await Promise.all([
    db.user.count({ where: { status: { not: "gesperrt" } } }),
    db.dispute.count({ where: { status: { not: "geloest" } } }),
    db.waitlistEntry.count({ where: { status: "wartend" } }),
  ]);
  return (
    <section aria-labelledby="admin-card" className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="admin-card" className="flex items-center gap-2 font-semibold"><Shield className="size-4 text-primary" aria-hidden /> Admin</h2>
        <Button asChild size="sm">
          <Link href="/admin">Zum Admin-Bereich <ArrowRight aria-hidden /></Link>
        </Button>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-center sm:text-left">
        <div><dt className="text-xs text-muted-foreground">Aktive Mitglieder</dt><dd className="text-xl font-bold tabular-nums">{members}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Offene Streitfälle</dt><dd className="text-xl font-bold tabular-nums">{disputes}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Warteliste</dt><dd className="text-xl font-bold tabular-nums">{waitlist}</dd></div>
      </dl>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const firstName = user.name.split(" ")[0];
  const isCreative = user.isCreative && Boolean(user.profile);
  const hasCompany = Boolean(user.companyId);

  // Ansichten: Kreative:r, Unternehmen (bei Firmenzugehörigkeit), Auftraggeber:in
  const views: { key: string; label: string; node: React.ReactNode }[] = [];
  if (isCreative) views.push({ key: "kreativ", label: "Als Kreative:r", node: <CreativeDashboard user={user} /> });
  if (hasCompany) views.push({ key: "unternehmen", label: "Unternehmen", node: <CompanyDashboard user={user} /> });
  if (user.isClient || views.length === 0) views.push({ key: "auftraggeber", label: "Als Auftraggeber:in", node: <ClientDashboard user={user} /> });
  const requested = typeof sp.ansicht === "string" ? sp.ansicht : "";
  const defaultTab = views.some((v) => v.key === requested) ? requested : hasCompany && !isCreative ? "unternehmen" : views[0].key;
  const description = hasCompany
    ? "Ausschreibungen, Pitches, Lizenzen und Projekte deines Unternehmens auf einen Blick."
    : views.length > 1
      ? "Du bist Kreative:r und Auftraggeber:in – wechsle zwischen beiden Ansichten."
      : isCreative
        ? "Deine Anfragen, Termine und Auszahlungen auf einen Blick."
        : "Deine Projekte, Crews und Zahlungen auf einen Blick.";

  return (
    <>
      <PageHeader title={`Hallo ${firstName}`} description={description} />
      {user.isAdmin && <AdminCard />}

      {views.length > 1 ? (
        <Tabs defaultValue={defaultTab} className="gap-4">
          <TabsList className="w-full sm:w-fit">
            {views.map((v) => (
              <TabsTrigger key={v.key} value={v.key} className="flex-1 sm:flex-none">{v.label}</TabsTrigger>
            ))}
          </TabsList>
          {views.map((v) => (
            <TabsContent key={v.key} value={v.key}>{v.node}</TabsContent>
          ))}
        </Tabs>
      ) : (
        views[0].node
      )}
    </>
  );
}
