import type { Metadata } from "next";
import { Archivo, Bricolage_Grotesque, Fraunces, Geist_Mono, Inter, Pinyon_Script } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
// Hero-Schriften – next/font hostet sie selbst (kein Aufruf bei Google zur Laufzeit, DSGVO)
const serif = Fraunces({ variable: "--font-serif", subsets: ["latin"], axes: ["opsz", "SOFT"] });
const script = Pinyon_Script({ variable: "--font-script", subsets: ["latin"], weight: "400" });
// Öffentliche Seiten: Plakat-Schrift (Archivo, schmal geschnitten über die wdth-Achse) + Mono für Metadaten
const poster = Archivo({ variable: "--font-poster", subsets: ["latin"], axes: ["wdth"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Creative Connect – Deine Crew. Dein Netzwerk.", template: "%s · Creative Connect" },
  description: "Die Crew-Plattform für Musik, Film, Foto, Design und Schauspiel. Klick-Demo – alle Inhalte fiktiv.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`dark ${inter.variable} ${display.variable} ${serif.variable} ${script.variable} ${poster.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
