import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ScrollText, Search, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { categoryName } from "@/lib/constants";
import { formatDate, formatDateTime, parseJson } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberActions } from "@/components/admin/member-actions";
import { FilterSelect } from "@/components/admin/filter-select";
import { MEMBER_STATUS, MEMBER_STATUS_TONE } from "@/components/admin/admin-constants";

export const metadata = { title: "Admin – Mitglieder" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const ROLES = [
  { value: "alle", label: "Alle Rollen" },
  { value: "kreativ", label: "Kreative" },
  { value: "auftraggeber", label: "Auftraggeber:innen" },
  { value: "admin", label: "Admins" },
];

function MemberStatus({ status }: { status: string }) {
  const label = MEMBER_STATUS.find((s) => s.key === status)?.label ?? status;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", MEMBER_STATUS_TONE[status] ?? "bg-muted")}>{label}</span>;
}

function roleLabels(u: { isAdmin: boolean; isCreative: boolean; isClient: boolean }) {
  return [u.isAdmin && "Admin", u.isCreative && "Kreativ", u.isClient && "Auftraggeber:in"].filter(Boolean).join(" · ");
}

export default async function AdminMembersPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim();
  const status = one(sp.status) || "alle";
  const role = one(sp.rolle) || "alle";

  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }, { profile: { city: { contains: q } } }];
  if (status !== "alle") where.status = status;
  if (role === "kreativ") where.isCreative = true;
  if (role === "auftraggeber") where.isClient = true;
  if (role === "admin") where.isAdmin = true;

  const [users, total, logs] = await Promise.all([
    db.user.findMany({ where, include: { profile: true }, orderBy: [{ createdAt: "desc" }], take: 300 }),
    db.user.count(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const filtered = q !== "" || status !== "alle" || role !== "alle";

  return (
    <div>
      <PageHeader title="Mitglieder" description="Freigeben, verifizieren und – nur mit Begründung nach AGB – sperren. Jede Aktion landet im Audit-Log." />

      <Tabs defaultValue="mitglieder">
        <TabsList>
          <TabsTrigger value="mitglieder">
            <Users aria-hidden /> Mitglieder
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText aria-hidden /> Audit-Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mitglieder" className="mt-4">
          <form method="get" className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center" role="search">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={q} placeholder="Name, E-Mail, Stadt …" aria-label="Mitglieder durchsuchen" className="pl-8" />
            </div>
            <FilterSelect
              name="status"
              label="Status"
              defaultValue={status}
              options={[{ value: "alle", label: "Alle Status" }, ...MEMBER_STATUS.map((s) => ({ value: s.key, label: s.label }))]}
            />
            <FilterSelect name="rolle" label="Rolle" defaultValue={role} options={ROLES} />
            <div className="flex gap-2">
              <Button type="submit">Filtern</Button>
              {filtered && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/mitglieder">Zurücksetzen</Link>
                </Button>
              )}
            </div>
          </form>

          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {users.length} von {total} Mitgliedern
          </p>

          {users.length === 0 ? (
            <EmptyState icon={Users} title="Keine Mitglieder gefunden" description="Passe Suche oder Filter an." />
          ) : (
            <>
              {/* Mobil: Karten */}
              <ul className="grid gap-3 md:hidden">
                {users.map((u) => (
                  <li key={u.id}>
                    <Card className="py-4">
                      <CardContent className="space-y-3 px-4">
                        <div className="flex items-start gap-3">
                          <UserAvatar name={u.name} seed={u.profile?.avatarSeed} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{roleLabels(u)}</p>
                          </div>
                          <MemberStatus status={u.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[u.profile?.city, u.profile ? categoryName(parseJson<string[]>(u.profile.categories, [])[0] ?? "") : u.company].filter(Boolean).join(" · ")}
                          {" · seit "}
                          {formatDate(u.createdAt)}
                        </p>
                        {u.blockReason && <p className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">{u.blockReason}</p>}
                        <MemberActions member={{ id: u.id, name: u.name, status: u.status, isAdmin: u.isAdmin, isSelf: u.id === admin.id }} />
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>

              {/* Desktop: Tabelle */}
              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitglied</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Stadt / Firma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seit</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.name} seed={u.profile?.avatarSeed} className="size-8" />
                            <div className="min-w-0">
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{roleLabels(u)}</TableCell>
                        <TableCell className="text-sm">{u.profile?.city ?? u.company ?? "–"}</TableCell>
                        <TableCell>
                          <MemberStatus status={u.status} />
                          {u.blockReason && <p className="mt-1 max-w-56 text-xs whitespace-normal text-destructive">{u.blockReason}</p>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <MemberActions member={{ id: u.id, name: u.name, status: u.status, isAdmin: u.isAdmin, isSelf: u.id === admin.id }} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          {logs.length === 0 ? (
            <EmptyState icon={ScrollText} title="Noch keine Einträge" description="Admin-Aktionen werden hier protokolliert." />
          ) : (
            <ol className="divide-y rounded-xl border">
              {logs.map((l) => (
                <li key={l.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <time className="shrink-0 text-xs text-muted-foreground tabular-nums sm:w-40" dateTime={l.createdAt.toISOString()}>
                    {formatDateTime(l.createdAt)}
                  </time>
                  <p className="min-w-0 text-sm">
                    <span className="font-medium">{l.actor}</span> · {l.action} · <span className="text-muted-foreground">{l.target}</span>
                    {l.detail && <span className="block text-xs break-words text-muted-foreground">{l.detail}</span>}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
