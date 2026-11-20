import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Archivo, Geist_Mono, Inter } from "next/font/google";
import { APP_NAME, COLORS } from "@/lib/brand";
import { getDict, hasLocale, staticLangParams } from "@/lib/i18n";
import { asset } from "@/lib/asset";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import "../globals.css";

// next/font hostet die Schriften selbst (kein Aufruf bei Google zur Laufzeit, DSGVO)
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
// Plakat-Schrift: Archivo, schmal/breit über die wdth-Achse
const poster = Archivo({ variable: "--font-poster", subsets: ["latin"], axes: ["wdth"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const dynamicParams = false;
export const generateStaticParams = staticLangParams;

export const viewport: Viewport = { themeColor: COLORS.egyptianBlue, colorScheme: "dark" };

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return {
    title: { default: t.meta.title, template: `%s · ${APP_NAME}` },
    description: t.meta.description,
    icons: { icon: asset("/favicon.ico") },
  };
}

// Intro des Heros nur auf der Startseite (ohne Anker, ab Tablet-Breite, ohne „Bewegung reduzieren“) – vor dem ersten Paint gesetzt
const INTRO_SCRIPT = `if(/\\/(de|en)\\/?$/.test(location.pathname)&&!location.hash&&innerWidth>760&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","");if("scrollRestoration" in history)history.scrollRestoration="manual";setTimeout(function(){document.documentElement.removeAttribute("data-intro")},8000)}`; // Sicherheitsnetz, falls das Skript nicht lädt

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang} suppressHydrationWarning className={`dark ${inter.variable} ${poster.variable} ${mono.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="site flex min-h-dvh flex-col">
        <Header lang={lang} t={t.nav} />
        <main id="inhalt" className="flex-1">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
