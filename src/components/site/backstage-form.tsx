"use client";

import { useId, useState } from "react";
import { BREVO, BREVO_FIELDS } from "@/lib/brand";
import type { Dict, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBrevoSubmit } from "@/components/site/brevo";
import { Consent, Field, fieldClass, Honeypots, SubmitRow, Success } from "@/components/site/form-parts";

const MESSAGE_MAX = 500;

// Backstage-Bewerbung an Brevo (Liste „Backstage-Bewerbungen“, Double-Opt-in)
export function BackstageForm({ lang, t, privacyLink, consent }: { lang: Locale; t: Dict["backstagePage"]["form"]; privacyLink: string; consent: Pick<Dict["backstagePage"], "consent" | "consentError" | "confirmHint"> }) {
  const id = useId();
  const { state, submit } = useBrevoSubmit(BREVO.backstage[lang], lang);
  const [message, setMessage] = useState("");
  const f = BREVO_FIELDS;

  if (state === "success") return <Success title={t.successTitle} text={t.successText} />;

  const field = fieldClass("ink");
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget, { [f.language]: lang, [f.source]: "backstage" }); }} className="space-y-4" data-testid="backstage-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-name`} label={t.name}>
          <input id={`${id}-name`} name={f.name} type="text" required autoComplete="name" className={field} />
        </Field>
        <Field id={`${id}-artist`} label={t.artistName}>
          <input id={`${id}-artist`} name={f.artistName} type="text" required autoComplete="organization" className={field} />
        </Field>
        <Field id={`${id}-email`} label={t.email} className="sm:col-span-2">
          <input id={`${id}-email`} name={f.email} type="email" required autoComplete="email" className={field} />
        </Field>
        <Field id={`${id}-role`} label={t.role}>
          <select id={`${id}-role`} name={f.role} required defaultValue="" className={cn(field, "appearance-none bg-[var(--ink)]")}>
            <option value="" disabled>{t.rolePlaceholder}</option>
            {Object.entries(t.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field id={`${id}-city`} label={t.city}>
          <input id={`${id}-city`} name={f.city} type="text" required autoComplete="address-level2" className={field} />
        </Field>
        <Field id={`${id}-country`} label={t.country} className="sm:col-span-2">
          <input id={`${id}-country`} name={f.country} type="text" required autoComplete="country-name" className={field} />
        </Field>
        <Field id={`${id}-links`} label={t.links} className="sm:col-span-2">
          <textarea id={`${id}-links`} name={f.links} required rows={3} placeholder={t.linksPlaceholder} className={cn(field, "h-auto py-3")} />
        </Field>
        <Field id={`${id}-ref`} label={t.referredBy} className="sm:col-span-2">
          <input id={`${id}-ref`} name={f.referredBy} type="text" className={field} />
        </Field>
        <Field id={`${id}-msg`} label={t.message} className="sm:col-span-2">
          <textarea id={`${id}-msg`} name={f.message} rows={4} maxLength={MESSAGE_MAX} value={message} onChange={(e) => setMessage(e.target.value)} className={cn(field, "h-auto py-3")} />
          <p className="meta text-right text-white/60" aria-live="polite">{message.length} / {MESSAGE_MAX}</p>
        </Field>
      </div>
      <Honeypots id={id} label={t.honeypot} />
      <Consent id={id} lang={lang} text={consent.consent} privacyLink={privacyLink} error={consent.consentError} />
      <SubmitRow state={state} label={t.submit} sending={t.sending} error={t.error} notOpen={t.notOpen} hint={consent.confirmHint} />
    </form>
  );
}
