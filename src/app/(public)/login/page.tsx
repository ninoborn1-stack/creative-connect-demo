import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

const DEMO = [
  { email: "admin@demo.cc", role: "Admin (Nesto)" },
  { email: "kreativ@demo.cc", role: "Kreative:r (Jule)" },
  { email: "kunde@demo.cc", role: "Auftraggeber:in (Nordlicht Records)" },
];

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-3xl font-bold">Willkommen zurück</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Creative Connect ist ein geschlossenes Netzwerk. Noch kein Konto?{" "}
          <Link href="/warteliste" className="text-primary underline-offset-4 hover:underline">Auf die Warteliste</Link> oder{" "}
          <Link href="/invite/CC-DEMO-2026" className="text-primary underline-offset-4 hover:underline">Einladung einlösen</Link>.
        </p>
        <LoginForm />
      </div>
      <aside className="rounded-xl border bg-card p-5" aria-labelledby="demo-logins">
        <h2 id="demo-logins" className="font-semibold">Demo-Logins</h2>
        <p className="mt-1 text-sm text-muted-foreground">Passwort jeweils <code className="rounded bg-muted px-1.5 py-0.5">demo</code></p>
        <ul className="mt-4 space-y-3 text-sm">
          {DEMO.map((d) => (
            <li key={d.email} className="flex flex-col rounded-lg bg-muted/60 px-3 py-2">
              <span className="font-medium">{d.role}</span>
              <code className="text-muted-foreground">{d.email}</code>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">Nach dem Login kannst du oben jederzeit über den Rollenwechsler zwischen den Ansichten springen.</p>
      </aside>
    </div>
  );
}
