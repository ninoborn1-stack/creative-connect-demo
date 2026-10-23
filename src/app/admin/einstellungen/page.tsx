import Link from "next/link";
import { ExternalLink, Tags } from "lucide-react";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryRow, FeesForm, MarketplaceModeForm } from "@/components/admin/settings-forms";

export const metadata = { title: "Admin – Einstellungen" };

export default async function AdminSettingsPage() {
  const [mode, fees, categories] = await Promise.all([getMarketplaceMode(), getFees(), db.category.findMany({ orderBy: { sort: "asc" } })]);

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" description="Plattform-Phase, Gebührensätze und Kategorien. Jede Änderung wird im Audit-Log festgehalten." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marktplatz-Modus</CardTitle>
          <CardDescription>
            Steuert, wer beitreten und wer das Verzeichnis sehen kann – die drei Phasen aus dem Businessplan 2026. Die Änderung wirkt sofort auf
            Landingpage, Registrierung und Verzeichnis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MarketplaceModeForm key={mode} current={mode} />
          <Button variant="link" asChild className="px-0">
            <Link href="/" target="_blank" rel="noopener">
              Landingpage ansehen <ExternalLink aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gebührensätze</CardTitle>
          <CardDescription>Erlöslogik nach Businessplan 2026. Gilt für neue Zahlungen und Angebote, bestehende bleiben unverändert.</CardDescription>
        </CardHeader>
        <CardContent>
          <FeesForm fees={fees} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategorien</CardTitle>
          <CardDescription>Die sieben Bereiche des Netzwerks. Der Slug bleibt fest, Name und Beschreibung sind änderbar.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <EmptyState icon={Tags} title="Keine Kategorien" />
          ) : (
            <div className="divide-y">
              {categories.map((c) => (
                <CategoryRow key={`${c.id}-${c.name}-${c.description}`} category={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
