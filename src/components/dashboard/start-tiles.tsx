import Link from "next/link";
import { ArrowUpRight, Mic2, Package, Search } from "lucide-react";
import { PACKAGES } from "@/lib/packages";
import { formatEur } from "@/lib/format";

// Die drei Start-Funktionen als große Kacheln oben im Dashboard
export function StartTiles({ profileSlug }: { profileSlug?: string }) {
  const cheapest = Math.min(...PACKAGES.map((p) => p.price));
  const tiles = [
    { href: "/paket-anfrage", icon: Package, title: "Paket buchen", text: `Song + Video, Release, Brand Sound … ab ${formatEur(cheapest)}` },
    { href: "/mitglieder", icon: Search, title: "Artist anfragen", text: "Finden, anhören, direkt anfragen" },
    profileSlug
      ? { href: `/mitglieder/${profileSlug}`, icon: Mic2, title: "Dein Artist-Profil", text: "So sehen dich Brands und Kund:innen" }
      : { href: "/bewerben", icon: Mic2, title: "Als Artist anbieten", text: "Profil anlegen und Anfragen bekommen" },
  ];
  return (
    <nav aria-label="Schnellstart" className="mb-6 grid gap-3 sm:grid-cols-3">
      {tiles.map((t, i) => (
        <Link
          key={t.title}
          href={t.href}
          className={
            i === 0
              ? "group flex flex-col gap-6 rounded-xl bg-primary p-4 text-primary-foreground transition-colors hover:bg-[var(--signal)] sm:p-5"
              : "group flex flex-col gap-6 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5"
          }
        >
          <span className="flex items-center justify-between">
            <t.icon className="size-5" aria-hidden />
            <ArrowUpRight className="size-5 transition-transform group-hover:rotate-45" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-semibold">{t.title}</span>
            <span className={i === 0 ? "text-sm text-primary-foreground/80" : "text-sm text-muted-foreground"}>{t.text}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
