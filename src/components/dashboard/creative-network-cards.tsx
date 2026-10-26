import Link from "next/link";
import { Briefcase, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { formatRelative } from "@/lib/format";
import { ConnectButton } from "@/components/network/connect-button";
import { PersonRow } from "@/components/network/person-row";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { matchOpportunity } from "@/components/opportunities/matching";
import { DashboardCard } from "./dashboard-card";

// Für Kreative: passende Ausschreibungen und offene Kontaktanfragen
export async function CreativeNetworkCards({ user }: { user: CurrentUser }) {
  const [opps, incoming] = await Promise.all([
    db.opportunity.findMany({
      where: { status: "offen", deadline: { gt: new Date() }, pitches: { none: { creativeId: user.id } } },
      include: { company: { select: { name: true, slug: true, logoSeed: true, verified: true } }, _count: { select: { pitches: true } } },
    }),
    db.connection.findMany({
      where: { toId: user.id, status: "angefragt" },
      include: { from: { include: { profile: { select: { slug: true, avatarSeed: true, headline: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const matches = opps
    .filter((o) => o.companyId !== user.companyId)
    .map((o) => ({ o, m: matchOpportunity(user.profile, o) }))
    .filter((x) => x.m.score > 0)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DashboardCard id="passende-ausschreibungen" title="Passende Ausschreibungen" icon={Briefcase} href="/ausschreibungen">
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Gerade nichts Passendes offen. Ergänze Skills im Profil, damit wir besser matchen.</p>
        ) : (
          <ul className="space-y-3">
            {matches.map(({ o, m }) => (
              <li key={o.id}>
                <OpportunityCard o={{ ...o, pitchCount: o._count.pitches, match: m.reason ?? undefined }} compact headingLevel={3} />
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
      <DashboardCard id="kontaktanfragen" title="Kontaktanfragen" icon={UserPlus} href="/netzwerk" hrefLabel="Netzwerk">
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine offenen Kontaktanfragen.</p>
        ) : (
          <ul className="divide-y">
            {incoming.map((c) => (
              <li key={c.id}>
                <PersonRow
                  name={c.from.name}
                  slug={c.from.profile?.slug}
                  avatarSeed={c.from.profile?.avatarSeed}
                  subtitle={c.from.jobTitle && c.from.company ? `${c.from.jobTitle} · ${c.from.company}` : (c.from.profile?.headline ?? c.from.company)}
                  meta={formatRelative(c.createdAt)}
                  action={<ConnectButton targetId={c.fromId} targetName={c.from.name} state="pending_in" connectionId={c.id} showDecline />}
                />
              </li>
            ))}
          </ul>
        )}
        {incoming.length > 0 && (
          <Link href="/netzwerk" className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground">Alle Anfragen im Netzwerk</Link>
        )}
      </DashboardCard>
    </div>
  );
}
