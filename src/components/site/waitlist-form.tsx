"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { WAITLIST } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Warteliste: eigenes Formular, das an das Brevo-Anmeldeformular (Double-Opt-in) sendet.
//
// So funktioniert es: Brevo-Formulare nehmen einen normalen POST mit FormData entgegen (dieselbe Adresse wie im
// <form action> des Brevo-HTML-Codes). Weil Brevo keine CORS-Header schickt, senden wir mit mode: "no-cors" -
// die Antwort ist dann „opaque“ und nicht lesbar. Kommt der Request an, zeigen wir „Bitte bestätige deine E-Mail“;
// nur bei Netzwerkfehlern zeigen wir einen Fehler. Ob Brevo die Adresse angenommen hat, sieht man in Brevo unter
// Kontakte (Status „Double-Opt-in ausstehend“) bzw. am Eingang der Bestätigungsmail.
// Testen: waitlistFormUrl in brand.ts setzen, `pnpm build && pnpm serve`, eigene Adresse eintragen, Mail bestätigen.
//
// Honeypot: Brevo nutzt das Feld „email_address_check“. Ist es gefüllt (Bot), tun wir so, als ob alles geklappt hat.
type State = "idle" | "sending" | "success" | "error" | "closed";

export function WaitlistForm({ lang, t, tone = "default" }: { lang: Locale; t: Dict["waitlistPage"]; tone?: "default" | "ink" }) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const f = WAITLIST.fields;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (String(data.get(f.honeypot) ?? "")) return setState("success");
    if (!WAITLIST.waitlistFormUrl) return setState("closed");
    data.set("locale", lang);
    data.set("html_type", "simple");
    setState("sending");
    try {
      await fetch(WAITLIST.waitlistFormUrl, { method: "POST", body: data, mode: "no-cors" });
      setState("success");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div role="status" className="space-y-2 border-l-4 border-primary pl-4" data-testid="waitlist-success">
        <p className="flex items-center gap-2 text-2xl font-semibold"><Check className="size-6 text-primary" aria-hidden />{t.successTitle}</p>
        <p className="text-muted-foreground">{t.successText}</p>
      </div>
    );
  }

  const field = cn("h-12 w-full border bg-transparent px-4 text-base placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none", tone === "ink" ? "border-white/30" : "border-foreground/30");
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false} data-testid="waitlist-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`${id}-email`} className="meta block">{t.emailLabel}</label>
          <input id={`${id}-email`} name={f.email} type="email" required autoComplete="email" placeholder={t.emailPlaceholder} className={field} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-role`} className="meta block">{t.roleLabel}</label>
          <select id={`${id}-role`} name={f.role} required defaultValue="" className={cn(field, "appearance-none bg-background")}>
            <option value="" disabled>{t.rolePlaceholder}</option>
            {Object.entries(t.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-city`} className="meta block">{t.cityLabel}</label>
          <input id={`${id}-city`} name={f.city} type="text" autoComplete="address-level2" placeholder={t.cityPlaceholder} className={field} />
        </div>
      </div>
      {/* Honeypot, für Menschen unsichtbar */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-hp`}>{t.honeypot}</label>
        <input id={`${id}-hp`} name={f.honeypot} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name={f.locale} value={lang} />
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="OPT_IN" value="1" required className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
        <span>
          {t.consent}{" "}
          <Link href={href(lang, "datenschutz")} className="underline underline-offset-4 hover:text-foreground">{t.privacyLink}</Link>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="meta inline-flex h-12 items-center gap-2 bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-70">
          {state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {state === "sending" ? t.sending : t.submit}
        </button>
        <p role="status" aria-live="polite" className={cn("text-sm", state === "error" ? "text-primary" : "text-[var(--stone)]")} data-testid="waitlist-status">
          {state === "error" ? t.error : state === "closed" ? t.notOpen : ""}
        </p>
      </div>
    </form>
  );
}
