import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Creative Connect – Deine Crew. Dein Netzwerk.", template: "%s · Creative Connect" },
  description: "Die Crew-Plattform für Musik, Film, Foto, Design und Schauspiel. Klick-Demo – alle Inhalte fiktiv.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`dark ${inter.variable} ${display.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
