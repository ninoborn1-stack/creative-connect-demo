"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const PUBLIC_LINKS = [
  { href: "/fuer-unternehmen", label: "Für Unternehmen" },
  { href: "/branchen", label: "Branchen" },
  { href: "/fuer-kreative", label: "Für Kreative" },
  { href: "/lizenzen", label: "Lizenz-Katalog" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Desktop: Linkleiste in der Navbar (auch transparent über dem Hero lesbar)
export function PublicNavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {PUBLIC_LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  "in-data-[over-photo]:bg-transparent in-data-[over-photo]:text-white/85 in-data-[over-photo]:hover:bg-white/10 in-data-[over-photo]:hover:text-white",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Mobil/Tablet: Menü als Sheet
export function PublicMobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden in-data-[over-photo]:text-white in-data-[over-photo]:hover:bg-white/15"
          aria-label="Menü öffnen"
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-sm">
        <SheetHeader>
          <SheetTitle>Creative Connect</SheetTitle>
          <SheetDescription>Kreativ-Netzwerk für Unternehmen</SheetDescription>
        </SheetHeader>
        <nav aria-label="Hauptnavigation mobil" className="px-4">
          <ul className="space-y-1">
            {PUBLIC_LINKS.map((l) => (
              <li key={l.href}>
                <SheetClose asChild>
                  <Link
                    href={l.href}
                    aria-current={isActive(pathname, l.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-muted",
                      isActive(pathname, l.href) && "bg-primary/10 text-primary",
                    )}
                  >
                    {l.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2 border-t pt-6">
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href={loggedIn ? "/dashboard" : "/login"}>{loggedIn ? "Zum Dashboard" : "Anmelden"}</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild size="lg" variant="outline">
                <Link href="/fuer-unternehmen#kontakt">Demo anfragen</Link>
              </Button>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
