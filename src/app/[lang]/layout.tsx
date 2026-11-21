import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Archivo, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import { APP_NAME, COLORS, LEGAL, SITE_URL } from "@/lib/brand";
import { getDict, hasLocale, staticLangParams } from "@/lib/i18n";
import { asset } from "@/lib/asset";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { RevealObserver } from "@/components/showcase/reveal-observer";
import "../globals.css";
import "../showcase.css";

// next/font hostet die Schriften selbst (kein Aufruf bei Google zur Laufzeit, DSGVO)
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
// Plakat-Schrift: Archivo, schmal/breit über die wdth-Achse
const poster = Archivo({ variable: "--font-poster", subsets: ["latin"], axes: ["wdth"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Kursives Serif nur für einzelne Akzentwörter (Instrument Serif, OFL), ebenfalls lokal ausgeliefert
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

// Läuft vor dem ersten Bild: html.js (für Animationen, die ohne JavaScript nicht gebraucht werden) und
// data-motion="reduce", wenn das Gerät oder der Schalter im Footer Bewegung reduziert. Liest nur, speichert nichts.
const MOTION_INIT = `(function(){var h=document.documentElement;h.classList.add("js");var r=false;try{r=localStorage.getItem("bg-motion")==="reduce"}catch(e){}if(r||matchMedia("(prefers-reduced-motion: reduce)").matches)h.setAttribute("data-motion","reduce");})();`;

export const dynamicParams = false;
export const generateStaticParams = staticLangParams;

export const viewport: Viewport = { themeColor: COLORS.egyptianBlue, colorScheme: "dark" };

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return {
    title: { default: t.meta.title, template: `%s | ${APP_NAME}` },
    description: t.meta.description,
    icons: {
      icon: [{ url: asset("/icons/icon.svg"), type: "image/svg+xml" }, { url: asset("/icons/favicon-32.png"), sizes: "32x32", type: "image/png" }],
      apple: asset("/icons/apple-touch-icon.png"),
    },
  };
}

// Strukturierte Daten: Organisation + App (Status „bald verfügbar“ über PreOrder)
function jsonLd(lang: "de" | "en", description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: LEGAL.company, url: SITE_URL, logo: `${SITE_URL}/icons/icon-512.png`, email: LEGAL.email },
      {
        "@type": "MobileApplication", name: APP_NAME, url: `${SITE_URL}/${lang}/`, description, inLanguage: lang,
        applicationCategory: "SocialNetworkingApplication", operatingSystem: "iOS, Android, Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/PreOrder" },
        publisher: { "@type": "Organization", name: LEGAL.company },
      },
    ],
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang} suppressHydrationWarning className={`dark ${inter.variable} ${poster.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body className="site flex min-h-dvh flex-col">
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT }} />
        <Header lang={lang} t={t.nav} />
        <main id="inhalt" className="flex-1">{children}</main>
        <Footer lang={lang} t={t} />
        <RevealObserver />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(lang, t.meta.description)) }} />
      </body>
    </html>
  );
}
