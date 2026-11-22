"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { BREVO_FIELDS } from "@/lib/brand";
import { href, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONSENT_FIELD, OWN_HONEYPOT, type SendState } from "@/components/site/brevo";

// Bausteine der Brevo-Formulare: Feldstil, Honeypots, Einwilligung, Absenden mit Status, Erfolgsanzeige

export const fieldClass = (tone: "default" | "ink" = "default") =>
  cn("h-12 w-full border bg-transparent px-4 text-base placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none", tone === "ink" ? "border-white/30" : "border-foreground/30");

export function Field({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="meta block">{label}</label>
      {children}
    </div>
  );
}

// Zwei unsichtbare Felder: Brevos email_address_check und ein eigenes. Menschen füllen sie nie aus.
export function Honeypots({ id, label }: { id: string; label: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={`${id}-hp1`}>{label}</label>
      <input id={`${id}-hp1`} name={BREVO_FIELDS.brevoHoneypot} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      <label htmlFor={`${id}-hp2`}>{label}</label>
      <input id={`${id}-hp2`} name={OWN_HONEYPOT} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

// Pflicht-Häkchen, nicht vorausgewählt. Ohne Haken blockiert der Browser das Absenden; wir zeigen dann
// eine eigene, verständliche Meldung (per aria-describedby mit der Checkbox verbunden).
export function Consent({ id, lang, text, privacyLink, error }: { id: string; lang: Locale; text: string; privacyLink: string; error: string }) {
  const [invalid, setInvalid] = useState(false);
  const [before, after = ""] = text.split("{privacy}");
  const errorId = `${id}-consent-error`;
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 text-base text-muted-foreground sm:text-sm">
        <input
          type="checkbox" name={CONSENT_FIELD} value="1" required
          aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined}
          onInvalid={(e) => { e.currentTarget.setCustomValidity(error); setInvalid(true); }}
          onChange={(e) => { e.currentTarget.setCustomValidity(""); setInvalid(!e.currentTarget.checked && invalid); }}
          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
          data-testid="consent"
        />
        <span>
          {before}
          <Link href={href(lang, "datenschutz")} className="underline underline-offset-4 hover:text-foreground">{privacyLink}</Link>
          {after}
        </span>
      </label>
      {invalid && <p id={errorId} className="pl-8 text-base text-primary sm:text-sm" data-testid="consent-error">{error}</p>}
    </div>
  );
}

export function SubmitRow({ state, label, sending, error, notOpen, hint }: { state: SendState; label: string; sending: string; error: string; notOpen: string; hint: string }) {
  return (
    <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" disabled={state === "sending"} className="meta inline-flex h-12 items-center gap-2 bg-primary px-6 whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-70">
        {state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {state === "sending" ? sending : label}
      </button>
      <p role="status" aria-live="polite" className={cn("text-base sm:text-sm", state === "error" ? "text-primary" : "text-[var(--stone)]")} data-testid="form-status">
        {state === "error" ? error : state === "closed" ? notOpen : ""}
      </p>
    </div>
    <p className="text-base text-muted-foreground sm:text-sm" data-testid="confirm-hint">{hint}</p>
    </div>
  );
}

export function Success({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="space-y-2 border-l-4 border-primary pl-4" data-testid="form-success">
      <p className="flex items-center gap-2 text-2xl font-semibold"><Check className="size-6 text-primary" aria-hidden />{title}</p>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
