import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, CircleCheck, Clock, Hourglass, Info, Mail, Sparkles, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { APPLICATION_STATUS, categoryName } from "@/lib/constants";
import { formatDate, formatDateTime, parseJson } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CtaLink } from "@/components/public/landing-bits";
import { ScoreRing } from "@/components/apply/score-ring";

export const metadata: Metadata = { title: "Status deiner Bewerbung", robots: { index: false } };

type Step = { key: string; title: string; text: string; date?: Date | null; state: "done" | "current" | "todo" | "rejected" };

export default async function ApplicationStatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  const app = id ? await db.creativeApplication.findUnique({ where: { id } }) : null;

  if (!app) {
    return (
      <section className="gutter flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-16 bg-[var(--ink)] py-16 text-[var(--bone)] sm:py-24" data-testid="apply-status" data-status="unbekannt">
        <p className="meta flex items-center gap-3 text-white/70"><CircleAlert className="size-4 text-[var(--signal)]" aria-hidden />Status deiner Bewerbung</p>
        <div>
          <h1 className="poster max-w-[14ch] text-[clamp(3rem,9vw,10rem)] text-balance">Bewerbung nicht gefunden</h1>
          <div className="mt-10 grid gap-8 border-t border-white/20 pt-6 lg:grid-cols-12">
            <p className="text-base text-pretty text-white/75 sm:text-lg lg:col-span-6">Den Link zu deinem Status findest du in deiner Bestätigungsmail. Noch nicht beworben?</p>
            <div className="lg:col-span-6 lg:justify-self-end lg:self-end">
              <CtaLink href="/bewerben" variant="light">Jetzt bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
            </div>
          </div>
        </div>
      </section>
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
    <div data-testid="apply-status" data-status={app.status}>
      {/* ---------- Plakat-Kopf ---------- */}
      <section className="gutter bg-[var(--ink)] pt-14 pb-12 text-[var(--bone)] sm:pt-20 sm:pb-16">
        <p className="meta flex items-center gap-3 text-white/70"><span aria-hidden className="size-2 bg-[var(--signal)]" />Status deiner Bewerbung</p>
        <h1 className="poster mt-8 text-[clamp(3.2rem,10vw,11rem)] break-words">Hallo {app.name.split(" ")[0]}!</h1>
        <div className="mt-8 flex flex-col gap-4 border-t border-white/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="meta text-white/70">
            {categories.map(categoryName).join(", ")} · {app.city} · eingereicht am {formatDate(app.createdAt)}
          </p>
          <span
            className={cn(
              "meta w-fit px-3 py-1.5",
              app.status === "angenommen" ? "bg-emerald-500 text-white" : app.status === "abgelehnt" ? "bg-destructive text-white" : "bg-[var(--signal)] text-white",
            )}
          >
            {APPLICATION_STATUS[app.status] ?? app.status}
          </span>
        </div>
      </section>

      {fast && (
        <div className="gutter flex items-start gap-3 bg-primary py-5 text-sm text-primary-foreground sm:text-base">
          <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <strong>Priorisiert über das Netzwerk – Entscheidung meist innerhalb von 48 h.</strong>
            {referrer ? ` Empfohlen von ${referrer.name}.` : app.referralCode && app.referralCode !== "EMPFEHLUNG" ? ` Einladungscode ${app.referralCode}.` : ""}
          </p>
        </div>
      )}

      <div className="gutter grid gap-10 py-14 sm:py-20 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <h2 className="poster text-[clamp(2.4rem,5vw,5rem)]">Aktueller Stand</h2>
          <ol className="mt-8 border-t">
            {steps.map((s, i) => {
              const Icon = s.state === "done" ? CircleCheck : s.state === "rejected" ? XCircle : s.state === "current" ? Hourglass : Clock;
              return (
                <li
                  key={s.key}
                  className={cn("grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 border-b py-5 sm:grid-cols-[4rem_1fr_auto]", s.state === "todo" && "opacity-55")}
                  aria-current={s.state === "current" ? "step" : undefined}
                >
                  <span className={cn("meta pt-1", s.state === "rejected" ? "text-destructive" : s.state === "todo" ? "text-muted-foreground" : "text-primary")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight sm:text-xl">
                      {s.title}
                      <span className="sr-only"> – {s.state === "done" ? "abgeschlossen" : s.state === "current" ? "aktuell" : s.state === "rejected" ? "abgelehnt" : "ausstehend"}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                    {s.date && <p className="meta mt-2 text-muted-foreground">{formatDateTime(s.date)}</p>}
                  </div>
                  <Icon
                    className={cn(
                      "mt-1 size-5",
                      s.state === "done" && "text-primary",
                      s.state === "current" && "animate-pulse text-primary",
                      s.state === "rejected" && "text-destructive",
                      s.state === "todo" && "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ol>

          {app.status === "abgelehnt" && app.reviewNote && (
            <div className="mt-8 border-l-2 border-destructive bg-muted p-4 text-sm">
              <p className="meta">Begründung des Teams</p>
              <p className="mt-1 text-muted-foreground">{app.reviewNote}</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-2">
            {app.status === "angenommen" ? (
              <>
                <CtaLink href="/login">Jetzt anmelden <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
                <p className="flex basis-full items-center gap-1.5 text-sm text-muted-foreground"><Mail className="size-4" aria-hidden /> Demo: Anmeldung mit {app.email} und dem Passwort „demo“.</p>
              </>
            ) : app.status === "abgelehnt" ? (
              <CtaLink href="/bewerben" variant="outline">Mit neuen Referenzen erneut bewerben</CtaLink>
            ) : (
              <p className="text-sm text-muted-foreground">Wir melden uns per Mail an {app.email}. Diese Seite kannst du jederzeit neu laden.</p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <div className="border-t-4 border-foreground pt-5">
            <p className="meta text-muted-foreground">Automatische Vorprüfung</p>
            <div className="mt-5 flex items-center gap-5">
              <ScoreRing score={app.score} size={64} />
              <p className="poster text-6xl tabular-nums" aria-hidden>{app.score}<span className="text-muted-foreground">/100</span></p>
            </div>
            <p className="sr-only">Automatische Vorprüfung: {app.score}/100</p>
            <p className="mt-5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Die Vorprüfung sortiert nur – die Entscheidung trifft Nestos Team persönlich.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
