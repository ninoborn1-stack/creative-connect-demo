"use client";

import { useId, useState } from "react";
import { BREVO, BREVO_FIELDS } from "@/lib/brand";
import type { Dict, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBrevoSubmit, useSearchParam } from "@/components/site/brevo";
import { Consent, Field, fieldClass, Honeypots, SubmitRow, Success } from "@/components/site/form-parts";

// Warteliste an Brevo (Liste „Warteliste“, Double-Opt-in). Rolle per URL vorbelegbar: ?rolle=artist
export function WaitlistForm({ lang, t, tone = "default" }: { lang: Locale; t: Dict["waitlistPage"]; tone?: "default" | "ink" }) {
  const id = useId();
  const { state, submit } = useBrevoSubmit(BREVO.waitlist[lang], lang);
  const f = BREVO_FIELDS;
  // Rolle aus ?rolle=… vorbelegen, bis man selbst etwas auswählt
  const preset = useSearchParam("rolle");
  const [chosen, setChosen] = useState<string | null>(null);
  const role = chosen ?? (preset && preset in t.roles ? preset : "");

  if (state === "success") return <Success title={t.successTitle} text={t.successText} />;

  const field = fieldClass(tone);
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget, { [f.language]: lang, [f.source]: "warteliste" }); }} className="space-y-4" data-testid="waitlist-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-email`} label={t.emailLabel} className="sm:col-span-2">
          <input id={`${id}-email`} name={f.email} type="email" required autoComplete="email" placeholder={t.emailPlaceholder} className={field} />
        </Field>
        <Field id={`${id}-role`} label={t.roleLabel}>
          <select id={`${id}-role`} name={f.role} required value={role} onChange={(e) => setChosen(e.target.value)} className={cn(field, "appearance-none bg-background")}>
            <option value="" disabled>{t.rolePlaceholder}</option>
            {Object.entries(t.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field id={`${id}-city`} label={t.cityLabel}>
          <input id={`${id}-city`} name={f.city} type="text" autoComplete="address-level2" placeholder={t.cityPlaceholder} className={field} />
        </Field>
      </div>
      <Honeypots id={id} label={t.honeypot} />
      <Consent id={id} lang={lang} text={t.consent} privacyLink={t.privacyLink} error={t.consentError} />
      <SubmitRow state={state} label={t.submit} sending={t.sending} error={t.error} notOpen={t.notOpen} hint={t.confirmHint} />
    </form>
  );
}
