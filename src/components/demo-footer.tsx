import Link from "next/link";

export function DemoFooter() {
  return (
    <footer className="border-t px-4 py-6 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>Demo – alle Inhalte fiktiv, Bilder: Stock.</p>
          {process.env.NEXT_PUBLIC_PAGES_DEMO === "1" && (
            <p data-testid="browser-demo-note">Browser-Demo: Daten liegen nur in diesem Browser – Zurücksetzen im Admin.</p>
          )}
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Rechtliches">
          <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
          <Link href="/agb" className="hover:text-foreground">AGB</Link>
          <Link href="/ki-hinweis" className="hover:text-foreground">Hinweis zur KI-Nutzung</Link>
        </nav>
      </div>
    </footer>
  );
}
