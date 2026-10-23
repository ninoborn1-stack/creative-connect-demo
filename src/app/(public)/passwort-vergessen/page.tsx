import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/public/forgot-password-form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-20">
      <h1 className="text-3xl font-bold">Passwort vergessen?</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Doch wieder eingefallen? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Zum Login</Link>
      </p>
    </div>
  );
}
