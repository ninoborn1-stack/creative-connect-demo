import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { APP_NAME, LEGAL } from "@/lib/brand";
import { href } from "@/lib/i18n";
import "./globals.css";

// 404 für alle unbekannten Adressen (zweisprachig, im Plakat-Look). Wird beim statischen Export zu out/404.html.
// Bewusst ohne next/link: Die Seite liegt außerhalb von [lang] und muss mit jedem basePath funktionieren.
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const poster = Archivo({ variable: "--font-poster", subsets: ["latin"], axes: ["wdth"] });
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = { title: `404 | ${APP_NAME}`, robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="de" className={`dark ${inter.variable} ${poster.variable} antialiased`}>
      <body className="site flex min-h-dvh flex-col bg-[var(--ink)] px-4 text-[var(--bone)]">
        <main className="mx-auto grid w-full max-w-5xl flex-1 content-center py-16">
          <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{APP_NAME}</p>
          <h1 className="poster mt-6 text-[clamp(6rem,30vw,22rem)] leading-[0.8]">4<span className="text-primary">0</span>4</h1>
          <p className="mt-6 text-2xl font-semibold">Seite nicht gefunden. <span lang="en" className="text-white/70">Page not found.</span></p>
          <div className="mt-10 flex flex-col gap-2 sm:flex-row">
            <a href={`${base}/de/`} className="meta inline-flex h-12 items-center justify-center bg-primary px-5 text-primary-foreground">Zur Startseite</a>
            <a href={`${base}/en/`} lang="en" className="meta inline-flex h-12 items-center justify-center border border-white/40 px-5">Back to home</a>
          </div>
        </main>
        <footer className="mx-auto w-full max-w-5xl border-t border-white/15 py-5 text-sm text-white/80" data-testid="footer-legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><a href={base + href("de", "impressum")} className="underline-offset-4 hover:underline">Impressum</a></li>
            <li><a href={base + href("de", "datenschutz")} className="underline-offset-4 hover:underline">Datenschutz</a></li>
            <li lang="en"><a href={base + href("en", "impressum")} className="underline-offset-4 hover:underline">Imprint</a></li>
            <li lang="en"><a href={base + href("en", "datenschutz")} className="underline-offset-4 hover:underline">Privacy</a></li>
            <li><a href={`mailto:${LEGAL.email}`} className="underline-offset-4 hover:underline">Kontakt</a></li>
            <li className="meta sm:ml-auto">© {new Date().getFullYear()} {LEGAL.company}</li>
          </ul>
        </footer>
      </body>
    </html>
  );
}
