import { headers } from "next/headers";
import { Award, GitBranch, Handshake, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CommunityTabs } from "@/components/community/community-tabs";
import { InvitePanel } from "@/components/community/invite-panel";
import { ReferralTree, type TreeNode } from "@/components/community/referral-tree";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const QUOTA = 5;
const TREE_DEPTH = 3;

const TIERS = [
  { key: "starter", name: "Starter", min: 0, max: 2, perk: "Du bekommst Einladungscodes und siehst deinen Empfehlungsbaum." },
  { key: "connector", name: "Connector", min: 3, max: 9, perk: "Anteil an der Servicegebühr der ersten Buchung deiner Eingeladenen (Demo: 20 %) und ein Connector-Badge im Profil." },
  { key: "botschafter", name: "Botschafter:in", min: 10, max: Infinity, perk: "Erhöhter Anteil an der Servicegebühr (Demo: 30 %), +5 Einladungen Kontingent und Einladung zum jährlichen Netzwerk-Dinner." },
] as const;

const INVITE_STATUS: Record<string, { label: string; tone: string }> = {
  offen: { label: "Offen", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  eingeloest: { label: "Eingelöst", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  abgelaufen: { label: "Abgelaufen", tone: "bg-muted text-muted-foreground" },
  freigabe: { label: "Wartet auf Freigabe", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
};

const ACTIVE = ["aktiv", "verifiziert"];

export default async function EinladenPage() {
  const user = await requireUser();
  const now = new Date();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const invites = await db.invite.findMany({ where: { senderId: user.id }, orderBy: { createdAt: "desc" } });
  const effectiveStatus = (i: (typeof invites)[number]) => (i.status === "offen" && i.expiresAt < now ? "abgelaufen" : i.status);
  const openInvites = invites.filter((i) => effectiveStatus(i) === "offen");
  const shareInvite = openInvites.find((i) => !i.email) ?? openInvites[0] ?? null;

  // Empfehlungsbaum ebenenweise laden (max. 3 Ebenen)
  const root: TreeNode = { id: user.id, name: user.name, slug: user.profile?.slug, avatarSeed: user.profile?.avatarSeed, headline: user.profile?.headline, active: true, children: [] };
  let frontier: TreeNode[] = [root];
  let total = 0;
  for (let level = 0; level < TREE_DEPTH && frontier.length; level++) {
    const rows = await db.user.findMany({
      where: { invitedById: { in: frontier.map((n) => n.id) } },
      orderBy: { createdAt: "asc" },
      include: { profile: true },
    });
    const next: TreeNode[] = [];
    for (const r of rows) {
      const node: TreeNode = { id: r.id, name: r.name, slug: r.profile?.slug, avatarSeed: r.profile?.avatarSeed, headline: r.profile?.headline, active: ACTIVE.includes(r.status), children: [] };
      frontier.find((f) => f.id === r.invitedById)?.children.push(node);
      next.push(node);
    }
    total += rows.length;
    frontier = next;
  }

  const activeDirect = root.children.filter((c) => c.active).length;
  const tierIndex = TIERS.findIndex((t) => activeDirect >= t.min && activeDirect <= t.max);
  const tier = TIERS[tierIndex];
  const nextTier = TIERS[tierIndex + 1];
  const progress = nextTier ? Math.round(((activeDirect - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Einladen" description="Creative Connect wächst nur über Empfehlungen. Lade Menschen ein, mit denen du gern arbeitest." />
        <CommunityTabs active="/einladen" />
        <InvitePanel
          invite={shareInvite ? { code: shareInvite.code, expiresLabel: formatDate(shareInvite.expiresAt) } : null}
          origin={origin}
          openCount={openInvites.length}
          quota={QUOTA}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Hinweis Kontingent: Du kannst bis zu {QUOTA} offene Einladungen gleichzeitig haben. Eingelöste oder abgelaufene Codes geben einen Platz frei. Codes sind 30 Tage gültig.
        </p>
      </div>

      <section aria-labelledby="partner" className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="partner" className="flex items-center gap-2 text-xl font-semibold"><Handshake className="size-5 text-primary" aria-hidden />Partnerprogramm</h2>
            <p className="mt-1 text-sm text-muted-foreground">{activeDirect} von dir eingeladene aktive Mitglieder</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
            <Award className="size-4" aria-hidden />{tier.name}
          </span>
        </div>
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>{tier.name}</span>
          <span>{nextTier ? `Noch ${nextTier.min - activeDirect} bis ${nextTier.name}` : "Höchste Stufe erreicht"}</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={`Fortschritt zur nächsten Stufe: ${progress} %`} />
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {TIERS.map((t, i) => (
            <li key={t.key} className={cn("rounded-lg border p-3 text-sm", i === tierIndex && "border-primary bg-primary/5", i < tierIndex && "opacity-70")}>
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.max === Infinity ? `ab ${t.min}` : `${t.min}–${t.max}`} aktive Eingeladene</p>
              <p className="mt-2 text-xs">{t.perk}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">Demo-Text: Konditionen des Partnerprogramms sind fiktiv. Auszahlungen erfolgen später über den Zahlungsdienstleister.</p>
      </section>

      <section aria-labelledby="baum" className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 id="baum" className="mb-1 flex items-center gap-2 text-xl font-semibold"><GitBranch className="size-5 text-primary" aria-hidden />Empfehlungsbaum</h2>
        <p className="mb-4 text-sm text-muted-foreground">{total} Mitglieder über bis zu {TREE_DEPTH} Ebenen sind über dich ins Netzwerk gekommen.</p>
        {root.children.length === 0 ? (
          <EmptyState icon={UserPlus} title="Noch niemand eingeladen" description="Teile deinen Code – sobald jemand ihn einlöst, wächst hier dein Baum." />
        ) : (
          <ReferralTree root={root} />
        )}
      </section>

      <section aria-labelledby="meine-einladungen">
        <h2 id="meine-einladungen" className="mb-3 text-xl font-semibold">Meine Einladungen</h2>
        {invites.length === 0 ? (
          <EmptyState icon={UserPlus} title="Noch keine Einladungen" description="Erzeuge oben deinen ersten Einladungscode." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="p-3 font-medium">Code</th>
                  <th scope="col" className="p-3 font-medium">An</th>
                  <th scope="col" className="p-3 font-medium">Erstellt</th>
                  <th scope="col" className="p-3 font-medium">Gültig bis</th>
                  <th scope="col" className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => {
                  const s = INVITE_STATUS[effectiveStatus(i)] ?? { label: i.status, tone: "bg-muted" };
                  return (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{i.code}</td>
                      <td className="p-3">{i.email ?? <span className="text-muted-foreground">Link</span>}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(i.createdAt)}</td>
                      <td className="p-3 whitespace-nowrap">{i.redeemedAt ? `eingelöst ${formatDate(i.redeemedAt)}` : formatDate(i.expiresAt)}</td>
                      <td className="p-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", s.tone)}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
