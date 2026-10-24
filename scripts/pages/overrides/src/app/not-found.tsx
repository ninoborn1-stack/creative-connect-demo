// Pages-Build: Diese Seite wird zu 404.html. GitHub Pages liefert sie für jeden Pfad ohne statische Datei
// (z. B. ein gerade im Browser angelegtes Projekt) – sie erkennt die Route und rendert die passende Seite.
import { DemoFallbackPage } from "@/lib/demo/generated/fallback";

export const metadata = { title: "Creative Connect" };

export default function NotFound() {
  return <DemoFallbackPage />;
}
