import { NEWSLETTER } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import Link from "next/link";

// Warteliste/Newsletter: schickt direkt an das Brevo-Formular (Double-Opt-in übernimmt Brevo).
// Ohne eingetragene Formular-Adresse (brand.ts) ist das Formular gesperrt und zeigt einen Hinweis.
export function NewsletterForm({ lang, t }: { lang: Locale; t: Dict["waitlistPage"] }) {
  const connected = Boolean(NEWSLETTER.brevoFormAction);
  return (
    <form action={connected ? NEWSLETTER.brevoFormAction : undefined} method="post" className="space-y-5">
      <fieldset disabled={!connected} className="space-y-5 disabled:opacity-70">
        <div className="space-y-2">
          <label htmlFor="nl-email" className="meta block">{t.emailLabel}</label>
          <input
            id="nl-email"
            name={NEWSLETTER.emailField}
            type="email"
            required
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            className="h-14 w-full border border-foreground/30 bg-transparent px-4 text-lg placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
          />
        </div>
        <input type="hidden" name={NEWSLETTER.localeField} value={lang} />
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input type="checkbox" name="OPT_IN" value="1" required className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
          <span>
            {t.consent}{" "}
            <Link href={href(lang, "datenschutz")} className="underline underline-offset-4 hover:text-foreground">{t.privacyLink}</Link>.
          </span>
        </label>
        <button type="submit" className="meta inline-flex h-12 items-center bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/85">
          {t.submit}
        </button>
      </fieldset>
      {!connected && <p role="status" className="meta text-[var(--stone)]">{t.notConnected}</p>}
    </form>
  );
}
