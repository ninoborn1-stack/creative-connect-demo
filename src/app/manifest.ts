import type { MetadataRoute } from "next";
import { APP_NAME, COLORS } from "@/lib/brand";
import { asset } from "@/lib/asset";

// Web-Manifest der Marketing-Seite (Name, Farben, Icons), keine installierbare App, nur saubere Darstellung
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Die Szene, zusammengehalten. / The glue of the scene.",
    start_url: asset("/"),
    display: "browser",
    background_color: COLORS.egyptianBlue,
    theme_color: COLORS.egyptianBlue,
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: asset("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
