import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, Gift, Inbox, ListOrdered, Medal, ReceiptText, Sparkles, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LEVELS, POINT_RULES, SESSION_TYPES } from "@/lib/constants";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LevelBadge, LevelProgress } from "@/components/points/points-card";
import { CompleteRedemptionButton, RedeemDialog } from "@/components/points/redeem-dialog";
import { getLeaderboard, getPointSummary, type LeaderRow } from "@/components/points/points-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Punkte & Belohnungen" };

const KIND_LABEL: Record<string, string> = {
  session: "Session", projekt: "Projekt", event: "Event", einladung: "Einladung", bewertung: "Bewertung", post: "Feed", studio: "Studio", einloesung: "Einlösung", bonus: "Bonus",
};

function Card({ id, title, icon: Icon, children, className, action }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0 rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-base font-semibold"><Icon className="size-4 text-primary" aria-hidden /> {title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Leaderboard({ rows, meId, label }: { rows: LeaderRow[]; meId: string; label: string }) {
  const top = rows.slice(0, 10);
  const me = rows.find((r) => r.userId === meId);
  const list = me && me.rank > 10 ? [...top, me] : top;
  if (!list.length) return <p className="text-sm text-muted-foreground">Noch keine Punkte in diesem Zeitraum.</p>;
  return (
    <ol className="divide-y" aria-label={label}>
      {list.map((r) => {
        const isMe = r.userId === meId;
        const inner = (
          <>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums", r.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted")}>{r.rank}</span>
            <UserAvatar name={r.name} seed={r.avatarSeed} className="size-8" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{r.name}{isMe && <span className="text-primary"> (du)</span>}</span>
              <span className="block text-xs text-muted-foreground">{r.levelLabel}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatNumber(r.points)}</span>
          </>
        );
        return (
          <li key={r.userId} aria-current={isMe ? "true" : undefined} className={cn(isMe && "rounded-lg bg-primary/10 ring-1 ring-primary/40", isMe && me && me.rank > 10 && "mt-2")}>
            {r.slug ? (
              <Link href={`/mitglieder/${r.slug}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">{inner}</Link>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function PointsPage() {
  const user = await requireUser();
  const [summary, events, rewards, myRedemptions, openRedemptions, board30, boardAll] = await Promise.all([
    getPointSummary(user.id),
    db.pointEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 }),
    db.reward.findMany({ where: { active: true }, orderBy: { cost: "asc" } }),
    db.rewardRedemption.findMany({ where: { userId: user.id }, include: { reward: true }, orderBy: { createdAt: "desc" } }),
    user.isAdmin
      ? db.rewardRedemption.findMany({ where: { status: "offen" }, include: { reward: true, user: { include: { profile: { select: { avatarSeed: true, slug: true } } } } }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    getLeaderboard(30),
    getLeaderboard(),
  ]);
  const { balance, level } = summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Punkte & Belohnungen"
        description="Nesto und seine Community profitieren voneinander: Wer mitmacht, sammelt Punkte – und tauscht sie gegen Studiozeit, Feedback und Sichtbarkeit."
        actions={<Button asChild><Link href="/sessions"><CalendarHeart aria-hidden /> Session buchen</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Kontostand & Level */}
        <section aria-labelledby="kontostand" className="glow relative overflow-hidden rounded-xl border bg-card p-5 sm:p-6">
          <h2 id="kontostand" className="text-sm font-medium text-muted-foreground">Dein Kontostand</h2>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
            <p className="font-heading text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">{formatNumber(balance)}</p>
            <p className="pb-2 text-muted-foreground">Punkte</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <LevelBadge label={level.label} className="text-sm" />
          </div>
          <div className="mt-4"><LevelProgress summary={summary} /></div>
          <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Level-Leiter">
            {LEVELS.map((l) => {
              const reached = balance >= l.min;
              const current = l.key === level.key;
              return (
                <li key={l.key} aria-current={current ? "step" : undefined} className={cn("rounded-lg border px-2.5 py-2 text-xs", current ? "border-primary bg-primary/10" : reached ? "bg-muted/40" : "opacity-70")}>
                  <span className="block font-semibold">{l.label}</span>
                  <span className="text-muted-foreground">ab {formatNumber(l.min)}</span>
                </li>
              );
            })}
          </ol>
          {user.isAdmin && <p className="mt-4 text-xs text-muted-foreground">Als Gastgeber sammelst du selbst keine Punkte – du vergibst sie beim Check-in deiner Sessions.</p>}
        </section>

        {/* So sammelst du Punkte */}
        <Card id="sammeln" title="So sammelst du Punkte" icon={Sparkles}>
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sessions mit Nesto</h3>
          <ul className="mt-1.5 divide-y text-sm">
            {Object.entries(SESSION_TYPES).map(([k, t]) => (
              <li key={k} className="flex items-center justify-between gap-3 py-1.5">
                <span className="min-w-0 truncate">{t.label}</span>
                <span className="shrink-0 font-semibold text-primary tabular-nums">+{t.points}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Im Netzwerk</h3>
          <ul className="mt-1.5 divide-y text-sm">
            {Object.entries(POINT_RULES).map(([k, r]) => (
              <li key={k} className="flex items-center justify-between gap-3 py-1.5">
                <span className="min-w-0">{r.label}</span>
                <span className="shrink-0 font-semibold text-primary tabular-nums">+{r.points}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Belohnungen */}
      <section aria-labelledby="belohnungen">
        <h2 id="belohnungen" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Gift className="size-5 text-primary" aria-hidden /> Belohnungen</h2>
        {rewards.length === 0 ? (
          <EmptyState icon={Gift} title="Gerade keine Belohnungen" description="Nesto stellt bald neue Belohnungen ein." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => {
              const soldOut = r.stock !== null && r.stock <= 0;
              return (
                <li key={r.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                  <div className="relative aspect-[16/9] bg-muted">
                    <StockImage seed={r.imageSeed} w={640} h={360} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <span className="absolute top-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">{formatNumber(r.cost)} Punkte</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="flex-1 text-sm text-muted-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">{r.stock === null ? "Unbegrenzt verfügbar" : soldOut ? "Vergriffen" : `Noch ${r.stock} verfügbar`}</p>
                    <RedeemDialog reward={{ id: r.id, title: r.title, cost: r.cost, soldOut }} balance={balance} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {user.isAdmin && (
        <Card id="offene-einloesungen" title={`Offene Einlösungen (${openRedemptions.length})`} icon={Inbox}>
          {openRedemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Einlösungen.</p>
          ) : (
            <ul className="divide-y">
              {openRedemptions.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={r.user.name} seed={r.user.profile?.avatarSeed} className="size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.user.name} · {r.reward.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(r.createdAt)} · {formatNumber(r.reward.cost)} Punkte</p>
                    </div>
                  </div>
                  <CompleteRedemptionButton id={r.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Journal */}
        <Card id="journal" title="Punkte-Journal" icon={ReceiptText}>
          {events.length === 0 ? (
            <EmptyState icon={ReceiptText} title="Noch keine Punkte" description="Buch deine erste Session mit Nesto – nach der Teilnahme landen die Punkte hier." />
          ) : (
            <ul className="max-h-[28rem] divide-y overflow-y-auto pr-1">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm">{e.reason}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)} · {KIND_LABEL[e.kind] ?? e.kind}</p>
                  </div>
                  <span className={cn("shrink-0 text-sm font-semibold tabular-nums", e.points >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                    {e.points >= 0 ? "+" : "−"}{formatNumber(Math.abs(e.points))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {/* Meine Einlösungen */}
          <Card id="meine-einloesungen" title="Meine Einlösungen" icon={Gift}>
            {myRedemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Du hast noch nichts eingelöst.</p>
            ) : (
              <ul className="divide-y">
                {myRedemptions.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.reward.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)} · {formatNumber(r.reward.cost)} Punkte</p>
                    </div>
                    <Badge variant={r.status === "eingeloest" ? "default" : "outline"}>{r.status === "eingeloest" ? "Eingelöst" : "In Abstimmung"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Rangliste */}
          <Card id="rangliste" title="Rangliste" icon={Trophy} action={<Medal className="size-4 text-muted-foreground" aria-hidden />}>
            <Tabs defaultValue="monat" className="gap-3">
              <TabsList className="w-full">
                <TabsTrigger value="monat" className="flex-1">Letzte 30 Tage</TabsTrigger>
                <TabsTrigger value="gesamt" className="flex-1">Gesamt</TabsTrigger>
              </TabsList>
              <TabsContent value="monat"><Leaderboard rows={board30} meId={user.id} label="Rangliste der letzten 30 Tage" /></TabsContent>
              <TabsContent value="gesamt"><Leaderboard rows={boardAll} meId={user.id} label="Rangliste gesamt" /></TabsContent>
            </Tabs>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ListOrdered className="size-3.5" aria-hidden /> Gezählt werden gesammelte Punkte (Einlösungen senken den Rang nicht).</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
