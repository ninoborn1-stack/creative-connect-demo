import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Info } from "lucide-react";
import { getFees } from "@/lib/settings";
import { formatEur } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin – Exporte" };

export default async function AdminExportsPage() {
  const fees = await getFees();
  const year = new Date().getFullYear();
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin">
          <ArrowLeft aria-hidden /> KPI-Dashboard
        </Link>
      </Button>
      <PageHeader title="Exporte" description="CSV-Dateien für Steuerberatung und Meldepflichten – Semikolon-getrennt, UTF-8, direkt in Excel oder Numbers zu öffnen." />

      <div role="note" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        <p>
          <strong>Demo mit fiktiven Daten.</strong> Es erfolgt keine Meldung an das BZSt und keine Anmeldung bei der Künstlersozialkasse. Kein Rechts- oder Steuerrat.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" aria-hidden /> DAC7-Vorbereitung {year}
            </CardTitle>
            <CardDescription>
              Plattformbetreiber melden jährlich Anbieter:innen und deren Umsätze an das Bundeszentralamt für Steuern (PStTG). Der Export listet alle
              Kreativen mit Auszahlungen im laufenden Jahr.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>Name, E-Mail, Stadt</li>
              <li>Steuer-ID hinterlegt (ja/nein – die ID selbst wird nicht gespeichert)</li>
              <li>Anzahl Transaktionen, Umsatz je Quartal und Summe</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/admin/exporte/dac7" download>
                <Download aria-hidden /> CSV herunterladen
              </a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" aria-hidden /> KSK-Übersicht Managed Crews
            </CardTitle>
            <CardDescription>
              Bei Managed Crews beauftragt Creative Connect die Kreativen selbst und kann damit künstlersozialabgabepflichtig sein
              ({fees.kskRatePct.toLocaleString("de-DE")} %, Bagatellgrenze {formatEur(fees.kskThresholdEur)} pro Jahr).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>Managed-Projekte mit Auftraggeber:in und Startdatum</li>
              <li>Besetzte Rollen, Kreative:r, KSK-Mitgliedschaft</li>
              <li>Honorar und mögliche Abgabe, Summe und Bagatellgrenze</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/admin/exporte/ksk" download>
                <Download aria-hidden /> CSV herunterladen
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
