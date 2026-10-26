import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck, Clock, Hourglass, Info, Mail, Sparkles, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { APPLICATION_STATUS, categoryName } from "@/lib/constants";
import { formatDate, formatDateTime, parseJson } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/apply/score-ring";

export const metadata: Metadata = { title: "Status deiner Bewerbung", robots: { index: false } };

type Step = { key: string; title: string; text: string; date?: Date | null; state: "done" | "current" | "todo" | "rejected" };

export default async function ApplicationStatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  const app = id ? await db.creativeApplication.findUnique({ where: { id } }) : null;

  if (!app) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center" data-testid="apply-status" data-status="unbekannt">
        <span className="grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive"><CircleAlert className="size-6" aria-hidden /></span>
        <h1 className="mt-6 text-3xl font-bold">Bewerbung nicht gefunden</h1>
        <p className="mt-3 text-muted-foreground">Den Link zu deinem Status findest du in deiner Bestätigungsmail. Noch nicht beworben?</p>
        <Button asChild size="lg" className="mt-8 h-11 px-5"><Link href="/bewerben">Jetzt bewerben</Link></Button>
      </div>
    );
  }

  const fast = app.track === "netzwerk";
  const referrer = app.referrerId ? await db.user.findUnique({ where: { id: app.referrerId }, select: { name: true } }) : null;
  const categories = parseJson<string[]>(app.categories, []);
  const decided = app.status === "angenommen" || app.status === "abgelehnt";

  const steps: Step[] = [
    { key: "eingereicht", title: "Eingereicht", text: "Deine Angaben und die Auto-Analyse sind bei uns.", date: app.createdAt, state: "done" },
    {
      key: "in_pruefung",
      title: "In Prüfung",
      text: fast ? "Priorisiert über das Netzwerk – Nestos Team schaut sich dein Profil an." : "Nestos Team sieht sich Links, Credits und Arbeiten persönlich an.",
      state: app.status === "eingereicht" ? "current" : "done",
    },
    {
      key: "entscheidung",
      title: app.status === "angenommen" ? "Aufgenommen" : app.status === "abgelehnt" ? "Abgelehnt" : "Entscheidung",
      text:
        app.status === "angenommen"
          ? "Willkommen im Netzwerk! Deine Zugangsdaten haben wir dir per Mail geschickt."
          : app.status === "abgelehnt"
            ? "Diesmal hat es leider nicht gepasst."
            : fast
              ? "Entscheidung meist innerhalb von 48 h."
              : "Entscheidung in der Regel innerhalb von 1–2 Wochen.",
      date: decided ? app.reviewedAt : null,
      state: app.status === "angenommen" ? "done" : app.status === "abgelehnt" ? "rejected" : app.status === "in_pruefung" ? "current" : "todo",
    },
  ];

  return (
    <div className="glow">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16" data-testid="apply-status" data-status={app.status}>
        <p className="text-xs font-medium tracking-widest text-primary uppercase">Status deiner Bewerbung</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Hallo {app.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground">
          {categories.map(categoryName).join(", ")} · {app.city} · eingereicht am {formatDate(app.createdAt)}
        </p>

        {fast && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p>
              <strong>Priorisiert über das Netzwerk – Entscheidung meist innerhalb von 48 h.</strong>
              {referrer ? ` Empfohlen von ${referrer.name}.` : app.referralCode && app.referralCode !== "EMPFEHLUNG" ? ` Einladungscode ${app.referralCode}.` : ""}
            </p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Aktueller Stand</h2>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                app.status === "angenommen" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : app.status === "abgelehnt" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
              )}
            >
              {APPLICATION_STATUS[app.status] ?? app.status}
            </span>
          </div>
          <ol className="mt-6 space-y-0">
            {steps.map((s, i) => {
              const Icon = s.state === "done" ? CircleCheck : s.state === "rejected" ? XCircle : s.state === "current" ? Hourglass : Clock;
              return (
                <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0" aria-current={s.state === "current" ? "step" : undefined}>
                  {i < steps.length - 1 && <span className={cn("absolute top-9 left-[17px] h-[calc(100%-2.25rem)] w-0.5", s.state === "done" ? "bg-primary" : "bg-border")} aria-hidden />}
                  <span
                    className={cn(
                      "relative grid size-9 shrink-0 place-items-center rounded-full border",
                      s.state === "done" && "border-primary bg-primary text-primary-foreground",
                      s.state === "current" && "border-primary bg-primary/10 text-primary",
                      s.state === "rejected" && "border-destructive bg-destructive/15 text-destructive",
                      s.state === "todo" && "text-muted-foreground",
                    )}
                  >
                    <Icon className={cn("size-4", s.state === "current" && "animate-pulse")} aria-hidden />
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <p className="font-medium">
                      {s.title}
                      <span className="sr-only"> – {s.state === "done" ? "abgeschlossen" : s.state === "current" ? "aktuell" : s.state === "rejected" ? "abgelehnt" : "ausstehend"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                    {s.date && <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(s.date)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {app.status === "abgelehnt" && app.reviewNote && (
            <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">Begründung des Teams</p>
              <p className="mt-1 text-muted-foreground">{app.reviewNote}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {app.status === "angenommen" ? (
              <>
                <Button asChild size="lg" className="h-11 px-5"><Link href="/login">Jetzt anmelden</Link></Button>
                <p className="flex basis-full items-center gap-1.5 text-sm text-muted-foreground"><Mail className="size-4" aria-hidden /> Demo: Anmeldung mit {app.email} und dem Passwort „demo“.</p>
              </>
            ) : app.status === "abgelehnt" ? (
              <Button asChild size="lg" variant="outline" className="h-11 px-5"><Link href="/bewerben">Mit neuen Referenzen erneut bewerben</Link></Button>
            ) : (
              <p className="text-sm text-muted-foreground">Wir melden uns per Mail an {app.email}. Diese Seite kannst du jederzeit neu laden.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border bg-card/60 p-5">
          <ScoreRing score={app.score} size={64} />
          <div className="text-sm">
            <p className="font-medium">Automatische Vorprüfung: {app.score}/100</p>
            <p className="mt-0.5 flex items-start gap-1.5 text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Die Vorprüfung sortiert nur – die Entscheidung trifft Nestos Team persönlich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
