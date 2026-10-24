import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Sparkles } from "lucide-react";
import { checkInvite } from "@/app/actions/public";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { StockImage } from "@/components/stock-image";
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
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive"><CircleAlert className="size-6" aria-hidden /></span>
        <p className="mt-6 font-mono text-sm text-muted-foreground">{code}</p>
        <h1 className="mt-2 text-3xl font-bold">{r.title}</h1>
        <p className="mt-3 text-muted-foreground">{r.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" className="h-11 px-5"><Link href="/warteliste">Auf die Warteliste</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5"><Link href="/">Zur Startseite</Link></Button>
        </div>
      </div>
    );
  }

  const sender = check.invite.sender;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
      <div className="relative order-2 min-h-72 overflow-hidden rounded-3xl border md:order-1 md:min-h-[560px]">
        <StockImage seed="cc-invite-hero" w={1000} h={1200} alt="" priority sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="font-heading text-2xl leading-tight font-bold sm:text-3xl">„Mein Netzwerk ist größer, als ich es allein ausschöpfen kann – jetzt bucht ihr euch gegenseitig.“</p>
          <p className="mt-3 text-sm text-white/75">Nesto, Gründer von Creative Connect</p>
        </div>
      </div>
      <div className="order-1 flex flex-col justify-center md:order-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden /> Einladung gültig · <span className="font-mono">{check.invite.code}</span>
        </span>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Du bist eingeladen.</h1>
        {sender && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-card p-4">
            <UserAvatar name={sender.name} seed={sender.avatarSeed} className="size-12" />
            <p className="text-sm">
              <strong>{sender.name}</strong> hat dich zu Creative Connect eingeladen – dem geschlossenen Netzwerk für Musik, Film, Foto, Design und Schauspiel.
            </p>
          </div>
        )}
        {user && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Du bist gerade als {user.name} angemeldet. Mit dem Formular legst du ein neues, separates Konto an.
          </p>
        )}
        <div className="mt-8"><InviteForm code={check.invite.code} /></div>
        <p className="mt-6 text-sm text-muted-foreground">
          Schon Mitglied? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
