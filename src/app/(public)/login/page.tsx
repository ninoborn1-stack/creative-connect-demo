import type { Metadata } from "next";
import Link from "next/link";
import { PosterSplit } from "@/components/public/form-bits";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

const DEMO = [
  { email: "admin@demo.cc", role: "Admin (Nesto)" },
  { email: "kreativ@demo.cc", role: "Kreative:r (Jule)" },
  { email: "kunde@demo.cc", role: "Auftraggeber:in (Nordlicht Records)" },
];

export default function LoginPage() {
  return (
    <PosterSplit
      eyebrow="Mitgliederbereich"
      title="Willkommen zurück"
      intro={
        <p>
          Creative Connect ist ein geschlossenes Netzwerk. Noch kein Konto?{" "}
          <Link href="/warteliste" className="text-white underline underline-offset-4">Auf die Warteliste</Link> oder{" "}
          <Link href="/invite/CC-DEMO-2026" className="text-white underline underline-offset-4">Einladung einlösen</Link>.
        </p>
      }
      aside={
        <section aria-labelledby="demo-logins">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="demo-logins" className="meta text-white">Demo-Logins</h2>
            <p className="meta text-white/60">Passwort jeweils <code className="bg-white/10 px-1.5 py-0.5 normal-case text-white">demo</code></p>
          </div>
          <ul className="mt-4 border-t border-white/15 text-sm">
            {DEMO.map((d, i) => (
              <li key={d.email} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-white/15 py-3 sm:grid-cols-[2.5rem_1fr_auto]">
                <span className="meta pt-0.5 text-white/50">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">{d.role}</span>
                <code className="col-start-2 break-all text-white/65 sm:col-start-3">{d.email}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/60">Nach dem Login kannst du oben jederzeit über den Rollenwechsler zwischen den Ansichten springen.</p>
        </section>
      }
    >
      <p className="meta text-muted-foreground">01 — Anmelden</p>
      <p className="poster mt-4 text-[clamp(2.2rem,4vw,3.6rem)]" aria-hidden>Login.</p>
      <LoginForm />
    </PosterSplit>
  );
}
