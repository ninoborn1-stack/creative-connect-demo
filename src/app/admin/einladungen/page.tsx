import { Check, Clock, KeyRound, Plus, UserPlus, X } from "lucide-react";
import { db } from "@/lib/db";
import { categoryName } from "@/lib/constants";
import { formatDate, formatRelative, parseJson } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionButton } from "@/components/admin/action-button";
import { CreateInviteForm } from "@/components/admin/invite-tools";
import {
  DEFAULT_INVITE_QUOTA, INVITE_STATUS_LABEL, INVITE_STATUS_TONE, WAITLIST_STATUS_LABEL,
} from "@/components/admin/admin-constants";
import { inviteFromWaitlist, raiseInviteQuota, rejectWaitlist } from "@/app/actions/admin";

export const metadata = { title: "Admin – Einladungen" };

function Pill({ tone, children }: { tone?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", tone ?? "bg-muted text-muted-foreground")}>{children}</span>;
}

export default async function AdminInvitesPage() {
  const [invites, waitlist, inviters, quotaRow] = await Promise.all([
    db.invite.findMany({ include: { sender: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.waitlistEntry.findMany({ orderBy: [{ status: "desc" }, { createdAt: "asc" }] }),
    db.user.findMany({
      where: { OR: [{ invitesSent: { some: {} } }, { invitees: { some: {} } }] },
      include: { profile: true, _count: { select: { invitesSent: true, invitees: true } } },
    }),
    db.setting.findUnique({ where: { key: "inviteQuota" } }),
  ]);
  const quota = parseJson<Record<string, number>>(quotaRow?.value, {});
  const now = new Date();
  const topInviters = inviters
    .map((u) => ({ ...u, used: Math.max(u._count.invitesSent, u._count.invitees), quota: quota[u.id] ?? DEFAULT_INVITE_QUOTA }))
    .sort((a, b) => b._count.invitees - a._count.invitees || b.used - a.used)
    .slice(0, 10);
  const waiting = waitlist.filter((w) => w.status === "wartend");
  const done = waitlist.filter((w) => w.status !== "wartend");

  const status = (i: (typeof invites)[number]) => (i.status === "offen" && i.expiresAt < now ? "abgelaufen" : i.status);

  return (
    <div className="space-y-8">
      <PageHeader title="Einladungen" description="Das Netzwerk wächst über persönliche Einladungen. Codes erzeugen, Kontingente steuern und die Warteliste abarbeiten." />

      {/* Warteliste */}
      <section aria-labelledby="waitlist-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="waitlist-heading" className="text-lg font-semibold">Warteliste</h2>
          <span className="text-sm text-muted-foreground">{waiting.length} wartend</span>
        </div>
        {waiting.length === 0 ? (
          <EmptyState icon={Clock} title="Warteliste ist leer" description="Alle Anfragen sind bearbeitet." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {waiting.map((w) => (
              <li key={w.id}>
                <Card className="h-full gap-3 py-4">
                  <CardContent className="flex h-full flex-col gap-2 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{w.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{w.email}</p>
                      </div>
                      <Pill>{formatRelative(w.createdAt)}</Pill>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryName(w.category)} · {w.city}
                    </p>
                    {w.message && <p className="text-sm italic">„{w.message}“</p>}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <ActionButton size="sm" action={inviteFromWaitlist.bind(null, w.id)}>
                        <Check aria-hidden /> Einladen
                      </ActionButton>
                      <ActionButton size="sm" variant="outline" action={rejectWaitlist.bind(null, w.id)}>
                        <X aria-hidden /> Ablehnen
                      </ActionButton>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {done.length > 0 && (
          <details className="rounded-xl border px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">Bereits bearbeitet ({done.length})</summary>
            <ul className="mt-2 divide-y">
              {done.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate">
                    {w.name} <span className="text-muted-foreground">· {categoryName(w.category)}</span>
                  </span>
                  <Pill tone={w.status === "eingeladen" ? INVITE_STATUS_TONE.eingeloest : undefined}>{WAITLIST_STATUS_LABEL[w.status] ?? w.status}</Pill>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Neuer Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" aria-hidden /> Neuen Einladungscode erzeugen
          </CardTitle>
          <CardDescription>Mit E-Mail-Adresse wird der Code direkt verschickt (Demo: landet in der Outbox).</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateInviteForm />
        </CardContent>
      </Card>

      {/* Kontingente */}
      <section aria-labelledby="quota-heading" className="space-y-3">
        <div>
          <h2 id="quota-heading" className="text-lg font-semibold">Kontingente</h2>
          <p className="text-sm text-muted-foreground">Standard: {DEFAULT_INVITE_QUOTA} Einladungen pro Mitglied. Die aktivsten Einladenden:</p>
        </div>
        {topInviters.length === 0 ? (
          <EmptyState icon={UserPlus} title="Noch niemand hat eingeladen" />
        ) : (
          <ul className="divide-y rounded-xl border">
            {topInviters.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <UserAvatar name={u.name} seed={u.profile?.avatarSeed} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u._count.invitees} beigetreten · {u._count.invitesSent} Codes · Kontingent{" "}
                    <span className={cn("font-medium", u.used >= u.quota ? "text-destructive" : "text-foreground")}>
                      {u.used}/{u.quota}
                    </span>
                  </p>
                </div>
                <ActionButton size="sm" variant="outline" action={raiseInviteQuota.bind(null, u.id)} aria-label={`Kontingent von ${u.name} um 5 erhöhen`}>
                  +5
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Codes */}
      <section aria-labelledby="codes-heading" className="space-y-3">
        <h2 id="codes-heading" className="text-lg font-semibold">Einladungscodes</h2>
        {invites.length === 0 ? (
          <EmptyState icon={KeyRound} title="Noch keine Codes" />
        ) : (
          <>
            <ul className="grid gap-2 md:hidden">
              {invites.map((i) => (
                <li key={i.id} className="rounded-xl border px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm break-all">{i.code}</code>
                    <Pill tone={INVITE_STATUS_TONE[status(i)]}>{INVITE_STATUS_LABEL[status(i)] ?? status(i)}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    von {i.sender?.name ?? "System"}
                    {i.email && ` · für ${i.email}`} · {i.redeemedAt ? `eingelöst ${formatDate(i.redeemedAt)}` : `gültig bis ${formatDate(i.expiresAt)}`}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Absender:in</TableHead>
                    <TableHead>Für</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ablauf / Eingelöst</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <code className="font-mono text-sm">{i.code}</code>
                      </TableCell>
                      <TableCell className="text-sm">{i.sender?.name ?? "System"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.email ?? "–"}</TableCell>
                      <TableCell>
                        <Pill tone={INVITE_STATUS_TONE[status(i)]}>{INVITE_STATUS_LABEL[status(i)] ?? status(i)}</Pill>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {i.redeemedAt ? `eingelöst ${formatDate(i.redeemedAt)}` : formatDate(i.expiresAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
