import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { checkInvite } from "@/app/actions/public";
import { getCurrentUser } from "@/lib/session";
import { UserAvatar } from "@/components/user-avatar";
import { StockImage } from "@/components/stock-image";
import { CtaLink } from "@/components/public/landing-bits";
import { PosterSplit } from "@/components/public/form-bits";
import { InviteForm } from "@/components/public/invite-form";

export const metadata: Metadata = { title: "Einladung einlösen" };

const REASONS = {
  unbekannt: { title: "Diesen Code kennen wir nicht", text: "Prüfe bitte die Schreibweise – oder trag dich auf die Warteliste ein." },
  eingeloest: { title: "Diese Einladung wurde schon eingelöst", text: "Jeder Code gilt nur für eine Person. Frag dein Kontakt-Mitglied nach einem neuen Code." },
  abgelaufen: { title: "Diese Einladung ist abgelaufen", text: "Einladungen sind nur begrenzt gültig. Frag nach einem neuen Code oder trag dich auf die Warteliste ein." },
  freigabe: { title: "Diese Einladung wartet noch auf Freigabe", text: "Das Team prüft die Einladung gerade. Du bekommst eine Mail, sobald sie aktiv ist." },
} as const;

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  const [check, user] = await Promise.all([checkInvite(code), getCurrentUser()]);

  if (!check.valid) {
    const r = REASONS[check.reason];
    return (
      <PosterSplit
        eyebrow="Einladung ungültig"
        title={r.title}
        intro={<p>{r.text}</p>}
        aside={<p className="meta break-all text-white/60">Code · <span className="text-[var(--signal)]">{code}</span></p>}
      >
        <p className="meta text-muted-foreground">01 — Wie geht es weiter?</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <CtaLink href="/warteliste">Auf die Warteliste <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          <CtaLink href="/" variant="outline">Zur Startseite</CtaLink>
        </div>
      </PosterSplit>
    );
  }

  const sender = check.invite.sender;
  return (
    <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      {/* Bild-Panel mit Zitat; auf Mobilgeräten unter dem Formular */}
      <div className="relative isolate order-2 flex min-h-[60svh] flex-col justify-end overflow-hidden bg-[var(--ink)] text-[var(--bone)] lg:order-1">
        <StockImage seed="cc-invite-hero" w={1000} h={1200} alt="" priority sizes="(max-width: 1024px) 100vw, 50vw" className="-z-10 opacity-70 grayscale-[35%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/50 to-transparent" />
        <figure className="gutter py-12 sm:py-16">
          <p className="meta flex items-center gap-3 text-white/70"><span aria-hidden className="size-2 bg-[var(--signal)]" />Gründer</p>
          <blockquote className="poster mt-6 text-[clamp(2.2rem,4.6vw,5rem)] text-balance">„Mein Netzwerk ist größer, als ich es allein ausschöpfen kann – jetzt bucht ihr euch gegenseitig.“</blockquote>
          <figcaption className="meta mt-6 border-t border-white/20 pt-4 text-white/70">Nesto, Gründer von Creative Connect</figcaption>
        </figure>
      </div>
      <div className="gutter order-1 flex min-w-0 flex-col justify-center py-12 sm:py-16 lg:order-2">
        <div className="w-full max-w-xl">
          <p className="meta inline-flex w-fit flex-wrap items-center gap-x-2 border border-primary px-2 py-1 text-primary">
            Einladung gültig · <span className="break-all">{check.invite.code}</span>
          </p>
          <h1 className="poster mt-6 text-[clamp(3.2rem,7vw,8rem)] text-balance">Du bist eingeladen.</h1>
          {sender && (
            <div className="mt-8 flex items-center gap-4 border-y py-4">
              <UserAvatar name={sender.name} seed={sender.avatarSeed} className="size-12" />
              <p className="text-sm">
                <strong>{sender.name}</strong> hat dich zu Creative Connect eingeladen – dem geschlossenen Netzwerk für Musik, Film, Foto, Design und Schauspiel.
              </p>
            </div>
          )}
          {user && (
            <p className="mt-4 border-l-2 border-primary bg-muted px-3 py-2 text-sm text-muted-foreground">
              Du bist gerade als {user.name} angemeldet. Mit dem Formular legst du ein neues, separates Konto an.
            </p>
          )}
          <div className="mt-8"><InviteForm code={check.invite.code} /></div>
          <p className="mt-6 text-sm text-muted-foreground">
            Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
