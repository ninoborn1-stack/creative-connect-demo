import type { Metadata } from "next";
import Link from "next/link";
import { PosterSplit } from "@/components/public/form-bits";
import { ForgotPasswordForm } from "@/components/public/forgot-password-form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <PosterSplit
      eyebrow="Zugang"
      title="Passwort vergessen?"
      intro={<p>Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.</p>}
      aside={
        <p className="meta text-white/60">
          Doch wieder eingefallen? <Link href="/login" className="text-white underline underline-offset-4">Zum Login</Link>
        </p>
      }
    >
      <p className="meta mb-8 text-muted-foreground">01 — Link anfordern</p>
      <ForgotPasswordForm />
    </PosterSplit>
  );
}
