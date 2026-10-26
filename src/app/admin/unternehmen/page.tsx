import Link from "next/link";
import { BadgeCheck, Building, ExternalLink, Gamepad2 } from "lucide-react";
import { db } from "@/lib/db";
import { industryName } from "@/lib/constants";
import { formatEur, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyVerifyButton } from "@/components/admin/company-actions";

export const metadata = { title: "Admin – Unternehmen" };

export default async function AdminCompaniesPage() {
  const [companies, licenseSums] = await Promise.all([
    db.company.findMany({
      orderBy: [{ verified: "desc" }, { name: "asc" }],
      include: { _count: { select: { members: true, opportunities: true, licenses: true } } },
    }),
    db.license.groupBy({ by: ["companyId"], _sum: { price: true, serviceFee: true } }),
  ]);
  const volume = new Map(licenseSums.map((l) => [l.companyId, (l._sum.price ?? 0) + (l._sum.serviceFee ?? 0)]));
  const verifiedCount = companies.filter((c) => c.verified).length;
  const total = [...volume.entries()].filter(([k]) => k).reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <PageHeader title="Unternehmen" description="Marken, Agenturen, Studios und Labels auf Creative Connect. Verifizierung schafft Vertrauen bei Kreativen – jede Änderung landet im Audit-Log." />
      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <Card className="py-4"><CardContent className="px-4"><p className="text-sm text-muted-foreground">Unternehmen</p><p className="text-2xl font-semibold tabular-nums">{formatNumber(companies.length)}</p></CardContent></Card>
        <Card className="py-4"><CardContent className="px-4"><p className="text-sm text-muted-foreground">Verifiziert</p><p className="text-2xl font-semibold tabular-nums">{formatNumber(verifiedCount)}</p></CardContent></Card>
        <Card className="py-4"><CardContent className="px-4"><p className="text-sm text-muted-foreground">Lizenzvolumen gesamt</p><p className="text-2xl font-semibold tabular-nums">{formatEur(total)}</p></CardContent></Card>
      </div>

      {companies.length === 0 ? (
        <EmptyState icon={Building} title="Noch keine Unternehmen" description="Sobald sich Firmen registrieren, erscheinen sie hier." />
      ) : (
        <Card className="py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead className="text-right">Mitglieder</TableHead>
                  <TableHead className="text-right">Ausschreibungen</TableHead>
                  <TableHead className="text-right">Lizenzen</TableHead>
                  <TableHead className="text-right">Volumen</TableHead>
                  <TableHead><span className="sr-only">Aktionen</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/unternehmen/${c.slug}`} className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                        {c.name} <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {c.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="verifiziert" />} {c.city}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        {c.industry === "gaming" && <Gamepad2 className="size-3.5 text-primary" aria-hidden />} {industryName(c.industry)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{c.size}</TableCell>
                    <TableCell className="text-right tabular-nums">{c._count.members}</TableCell>
                    <TableCell className="text-right tabular-nums">{c._count.opportunities}</TableCell>
                    <TableCell className="text-right tabular-nums">{c._count.licenses}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">{formatEur(volume.get(c.id) ?? 0)}</TableCell>
                    <TableCell className="text-right"><CompanyVerifyButton id={c.id} verified={c.verified} name={c.name} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
