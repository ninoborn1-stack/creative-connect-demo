import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, FileText, Gamepad2, Info, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { categoryName, industryName } from "@/lib/constants";
import { formatDateTime, formatEur, parseJson } from "@/lib/format";
import { LINK_FIELDS, checkLink, linkHref, type ApplicationCheck, type ApplicationLinks, type ExtractedProfile, type LinkKey } from "@/lib/application-meta";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/apply/score-ring";
import { ChecksList } from "@/components/apply/checks-list";
import { ApplicationReview } from "@/components/admin/application-review";
import { ApplicationStatusBadge, TrackBadge } from "@/components/admin/application-badges";

export const metadata = { title: "Admin – Bewerbung" };

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await db.creativeApplication.findUnique({ where: { id } });
  if (!app) notFound();

  const [referrer, account] = await Promise.all([
    app.referrerId ? db.user.findUnique({ where: { id: app.referrerId }, include: { profile: true } }) : null,
    app.status === "angenommen" ? db.user.findUnique({ where: { email: app.email.toLowerCase() }, include: { profile: true } }) : null,
  ]);
  const ex = parseJson<Partial<ExtractedProfile>>(app.extracted, {});
  const checks = parseJson<ApplicationCheck[]>(app.checks, []);
  const links = parseJson<ApplicationLinks>(app.links, {});
  const cats = parseJson<string[]>(app.categories, []);
  const linkEntries = LINK_FIELDS.filter((f) => links[f.key as LinkKey]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/bewerbungen"><ArrowLeft aria-hidden /> Alle Bewerbungen</Link>
      </Button>
      <PageHeader
        title={app.name}
        description={`${cats.map(categoryName).join(", ")} · ${app.city} · eingereicht ${formatDateTime(app.createdAt)}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/bewerben/status?id=${app.id}`}>Status-Seite <ArrowUpRight aria-hidden /></Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ScoreRing score={app.score} size={88} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-1.5"><TrackBadge track={app.track} /><ApplicationStatusBadge status={app.status} /></div>
                <p className="text-sm">
                  <a href={`mailto:${app.email}`} className="text-primary underline-offset-4 hover:underline">{app.email}</a>
                </p>
                {referrer && (
                  <p className="flex items-center gap-1.5 text-sm">
                    <UserRound className="size-4 text-primary" aria-hidden /> Empfohlen von{" "}
                    {referrer.profile ? <Link href={`/mitglieder/${referrer.profile.slug}`} className="font-medium underline-offset-4 hover:underline">{referrer.name}</Link> : <strong>{referrer.name}</strong>}
                  </p>
                )}
                {app.referralCode && app.referralCode !== "EMPFEHLUNG" && <p className="text-xs text-muted-foreground">Code: <span className="font-mono">{app.referralCode}</span></p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Angaben</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-line">{app.pitch}</p>
              {linkEntries.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {linkEntries.map((f) => {
                    const v = links[f.key as LinkKey]!;
                    const ok = checkLink(f.key as LinkKey, v);
                    return (
                      <li key={f.key} className="min-w-0 rounded-lg border p-2.5 text-sm">
                        <p className="text-xs text-muted-foreground">{f.label} {ok ? "" : "· Format prüfen"}</p>
                        <a href={linkHref(f.key as LinkKey, v)} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline">
                          {v} <ExternalLink className="size-3 shrink-0" aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Links angegeben.</p>
              )}
              {app.cvText && (
                <details className="rounded-lg border p-3 text-sm">
                  <summary className="flex cursor-pointer items-center gap-2 font-medium"><FileText className="size-4" aria-hidden /> Lebenslauf / Portfolio-Text</summary>
                  <p className="mt-2 max-h-72 overflow-auto text-xs whitespace-pre-line text-muted-foreground">{app.cvText}</p>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Analyse</CardTitle>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Automatische Vorprüfung ({ex.source === "claude" ? "KI: Claude" : "regelbasiert"}), von der Person vor dem Absenden geprüft. Entscheidung: Team.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold">Skills</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(ex.skills ?? []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  {!ex.skills?.length && <p className="text-sm text-muted-foreground">–</p>}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Branchen</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(ex.industries ?? []).map((i) => (
                    <Badge key={i} variant={i === "gaming" ? "default" : "outline"}>{i === "gaming" && <Gamepad2 aria-hidden />} {industryName(i)}</Badge>
                  ))}
                  {!ex.industries?.length && <p className="text-sm text-muted-foreground">–</p>}
                </div>
              </section>
              <section className="sm:col-span-2">
                <h3 className="text-sm font-semibold">Credits & Referenzen</h3>
                {ex.credits?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{ex.credits.map((c, i) => <li key={i}>{c}</li>)}</ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Keine Credits erkannt.</p>
                )}
              </section>
              <section>
                <h3 className="text-sm font-semibold">Tagessatz-Rahmen</h3>
                <p className="mt-1 text-lg font-semibold tabular-nums">{ex.dayRate ? `${formatEur(ex.dayRate[0])} – ${formatEur(ex.dayRate[1])}` : "–"}</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Erfahrung</h3>
                <p className="mt-1 text-lg font-semibold tabular-nums">{ex.experienceYears != null ? `ca. ${ex.experienceYears} Jahre` : "–"}</p>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Vorprüfung</CardTitle></CardHeader>
            <CardContent>{checks.length ? <ChecksList checks={checks} /> : <p className="text-sm text-muted-foreground">Keine Checks gespeichert.</p>}</CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader><CardTitle className="text-base">Entscheidung</CardTitle></CardHeader>
            <CardContent>
              {app.reviewedAt && <p className="mb-3 text-xs text-muted-foreground">Entschieden am {formatDateTime(app.reviewedAt)}</p>}
              <ApplicationReview id={app.id} status={app.status} note={app.reviewNote ?? ""} />
              {account?.profile && (
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={`/mitglieder/${account.profile.slug}`}>Profil ansehen <ArrowUpRight aria-hidden /></Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
