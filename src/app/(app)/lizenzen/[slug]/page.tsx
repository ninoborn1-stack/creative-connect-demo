import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Lock, Pencil, ShieldCheck, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { industryName } from "@/lib/constants";
import { formatDate, formatNumber, parseJson } from "@/lib/format";
import { formatDuration, isAudioType, isExclusivelyTaken, workTypeLabel, type LicenseConfig, type LicenseTier } from "@/lib/licensing";
import { AiNotice } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { WORK_CARD_INCLUDE, WorkCard, TypeBadge } from "@/components/licensing/work-card";
import { WorkAudio, WorkImage } from "@/components/licensing/work-visual";
import { LicenseConfigurator } from "@/components/licensing/license-configurator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function WorkDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const work = await db.licensableWork.findUnique({
    where: { slug },
    include: {
      owner: { include: { profile: true } },
      licenses: { select: { tier: true, status: true, companyId: true, company: { select: { name: true, slug: true } } } },
    },
  });
  if (!work) notFound();

  const [fees, me, others] = await Promise.all([
    getFees(),
    db.user.findUnique({ where: { id: user.id }, select: { companyRef: { select: { name: true } } } }),
    db.licensableWork.findMany({ where: { id: { not: work.id } }, include: WORK_CARD_INCLUDE }),
  ]);

  const tags = parseJson<string[]>(work.tags, []);
  const industries = parseJson<string[]>(work.industries, []);
  const audio = isAudioType(work.type);
  const taken = isExclusivelyTaken(work.licenses);
  const isOwner = work.ownerId === user.id;
  const profile = work.owner.profile;

  // Bereits lizenziert von … (Firmen namentlich, Einzelpersonen anonym gezählt)
  const companies = [...new Map(work.licenses.filter((l) => l.company).map((l) => [l.company!.slug, l.company!.name])).values()];
  const personal = work.licenses.filter((l) => !l.companyId).length;

  // Verlängerung: Konfigurator aus bestehender Lizenz vorbelegen
  let initial: (LicenseConfig & { projectName: string }) | undefined;
  let renewalOf: string | undefined;
  const renew = one(sp.verlaengern);
  if (renew) {
    const prev = await db.license.findUnique({ where: { number: renew } });
    if (prev && prev.workId === work.id && (prev.buyerId === user.id || (user.companyId && prev.companyId === user.companyId) || user.isAdmin)) {
      initial = { tier: prev.tier as LicenseTier, media: parseJson<string[]>(prev.media, []), territory: prev.territory, durationMonths: prev.durationMonths, projectName: prev.projectName };
      renewalOf = prev.number;
    }
  }

  const similar = others
    .map((w) => {
      const ind = parseJson<string[]>(w.industries, []);
      const tg = parseJson<string[]>(w.tags, []);
      const score = (w.type === work.type ? 3 : 0) + ind.filter((i) => industries.includes(i)).length + tg.filter((t) => tags.includes(t)).length * 2;
      return { w, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.w.plays - a.w.plays)
    .slice(0, 3)
    .map((x) => x.w);

  const meta: [string, string][] = [
    ["Typ", workTypeLabel(work.type)],
    ...(work.durationSec ? [["Dauer", formatDuration(work.durationSec)!] as [string, string]] : []),
    ...(work.bpm ? [["Tempo", `${work.bpm} BPM`] as [string, string]] : []),
    ...(work.musicalKey ? [["Tonart", work.musicalKey] as [string, string]] : []),
    [audio ? "Plays" : "Aufrufe", formatNumber(work.plays)],
    ["Im Katalog seit", formatDate(work.createdAt)],
  ];

  return (
    <div className="space-y-10">
      <div>
        <Link href="/lizenzen" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />Zum Katalog
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border bg-muted">
              <WorkImage work={work} priority sizes="(max-width: 1024px) 100vw, 60vw" className={audio ? "opacity-60" : undefined} />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <TypeBadge type={work.type} />
                {work.featured && <Badge className="bg-primary text-primary-foreground">Empfohlen</Badge>}
                {taken && <Badge variant="secondary" className="gap-1"><Lock className="size-3" aria-hidden />Exklusiv vergeben</Badge>}
              </div>
              {audio && (
                <div className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6">
                  <WorkAudio work={work} subtitle={`${work.owner.name} · Hörprobe`} className="bg-background/90 backdrop-blur" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{work.title}</h1>
              <p className="mt-2 max-w-prose whitespace-pre-line text-muted-foreground">{work.description}</p>
            </div>

            {work.aiMarked ? (
              <AiNotice>
                <strong>KI-gekennzeichnet:</strong> Bei der Erstellung dieses Werks wurden KI-Werkzeuge eingesetzt. Die Kennzeichnung erfolgt gemäß Art. 50 EU AI Act und ist im Lizenzzertifikat vermerkt.
              </AiNotice>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-500" aria-hidden />Ohne generative KI erstellt (Angabe der:des Urheber:in).
              </p>
            )}

            <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
              {meta.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {(tags.length > 0 || industries.length > 0) && (
              <div className="space-y-3">
                {tags.length > 0 && (
                  <div>
                    <h2 className="mb-1.5 text-sm font-medium">Tags</h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <li key={t}><Link href={`/lizenzen?q=${encodeURIComponent(t)}`}><Badge variant="outline" className="font-normal">{t}</Badge></Link></li>
                      ))}
                    </ul>
                  </div>
                )}
                {industries.length > 0 && (
                  <div>
                    <h2 className="mb-1.5 text-sm font-medium">Passt besonders für</h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {industries.map((i) => (
                        <li key={i}><Link href={`/lizenzen?branche=${i}`}><Badge variant="secondary">{industryName(i)}</Badge></Link></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <section aria-labelledby="lizenziert-von" className="rounded-xl border bg-card p-4">
              <h2 id="lizenziert-von" className="mb-2 flex items-center gap-2 text-sm font-medium"><Building2 className="size-4 text-primary" aria-hidden />Bereits lizenziert von</h2>
              {work.licenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Lizenzen – sei die:der Erste.</p>
              ) : (
                <p className="text-sm">
                  {companies.length > 0 && <span>{companies.slice(0, 5).join(", ")}</span>}
                  {companies.length > 5 && <span> und {companies.length - 5} weiteren Unternehmen</span>}
                  {personal > 0 && <span className="text-muted-foreground">{companies.length ? " sowie " : ""}{personal} {personal === 1 ? "Einzelperson" : "Einzelpersonen"}</span>}
                  <span className="text-muted-foreground"> · insgesamt {work.licenses.length} {work.licenses.length === 1 ? "Lizenz" : "Lizenzen"}</span>
                </p>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Urheber:in und Lizenz">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <UserAvatar name={work.owner.name} seed={profile?.avatarSeed} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Urheber:in</p>
                {profile ? (
                  <Link href={`/mitglieder/${profile.slug}`} className="block truncate font-medium hover:underline">{work.owner.name}</Link>
                ) : (
                  <p className="truncate font-medium">{work.owner.name}</p>
                )}
                {profile?.headline && <p className="truncate text-xs text-muted-foreground">{profile.headline}</p>}
              </div>
            </div>

            {isOwner ? (
              <div className="space-y-3 rounded-xl border bg-card p-4 text-sm">
                <p>Das ist dein Werk. Lizenzen, Umsatz und Plays siehst du unter „Meine Werke“.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link href={`/lizenzen/werke/${work.slug}/bearbeiten`}><Pencil aria-hidden />Bearbeiten</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href="/lizenzen/werke">Meine Werke</Link></Button>
                </div>
              </div>
            ) : taken ? (
              <div className="space-y-2 rounded-xl border bg-card p-4 text-sm" role="status">
                <p className="flex items-center gap-2 font-medium"><Lock className="size-4" aria-hidden />Exklusiv vergeben</p>
                <p className="text-muted-foreground">Dieses Werk wurde exklusiv lizenziert und kann nicht mehr lizenziert werden. Bestehende Lizenzen bleiben gültig.</p>
                {profile && <Button asChild size="sm" variant="outline"><Link href={`/mitglieder/${profile.slug}`}>Ähnliches bei {work.owner.name.split(" ")[0]} anfragen</Link></Button>}
              </div>
            ) : (
              <LicenseConfigurator
                key={renewalOf ?? "neu"}
                work={{ id: work.id, title: work.title, ownerName: work.owner.name, priceStandard: work.priceStandard, priceExtended: work.priceExtended, priceExclusive: work.priceExclusive }}
                serviceFeePct={fees.serviceFeePct}
                companyName={me?.companyRef?.name ?? null}
                initial={initial}
                renewalOf={renewalOf}
              />
            )}
            {!isOwner && !taken && work.licenses.length > 0 && work.priceExclusive != null && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />Bei Exklusiv/Buyout bleiben bereits erteilte Lizenzen im vereinbarten Umfang gültig.
              </p>
            )}
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="aehnliche-werke" className="space-y-3">
          <h2 id="aehnliche-werke" className="text-xl font-semibold">Ähnliche Werke</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((w) => <WorkCard key={w.id} work={w} exclusiveTaken={isExclusivelyTaken(w.licenses)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
