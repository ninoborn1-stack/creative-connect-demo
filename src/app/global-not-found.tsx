import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { APP_NAME } from "@/lib/brand";
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
      <body className="site grid min-h-dvh place-items-center bg-[var(--ink)] px-4 text-[var(--bone)]">
        <main className="w-full max-w-5xl py-16">
          <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{APP_NAME}</p>
          <h1 className="poster mt-6 text-[clamp(6rem,30vw,22rem)] leading-[0.8]">4<span className="text-primary">0</span>4</h1>
          <p className="mt-6 text-2xl font-semibold">Seite nicht gefunden. <span lang="en" className="text-white/70">Page not found.</span></p>
          <div className="mt-10 flex flex-col gap-2 sm:flex-row">
            <a href={`${base}/de/`} className="meta inline-flex h-12 items-center justify-center bg-primary px-5 text-primary-foreground">Zur Startseite</a>
            <a href={`${base}/en/`} lang="en" className="meta inline-flex h-12 items-center justify-center border border-white/40 px-5">Back to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
