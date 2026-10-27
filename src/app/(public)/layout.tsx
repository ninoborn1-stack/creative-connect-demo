import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicMobileMenu, PublicNavLinks } from "@/components/public/public-nav";
import { cn } from "@/lib/utils";

const headerBtn = "meta hidden h-9 items-center px-4 transition-colors sm:inline-flex";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="site flex min-h-dvh flex-col">
      <PublicHeader>
        <div className="gutter flex h-16 items-center gap-2">
          <Logo poster />
          <div className="ml-8">
            <PublicNavLinks />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className={cn(headerBtn, "bg-primary text-primary-foreground hover:bg-[var(--signal)]")}>Zum Dashboard</Link>
            ) : (
              <Link
                href="/login"
                className={cn(headerBtn, "border border-foreground/30 hover:bg-foreground hover:text-background in-data-[over-photo]:border-white/40 in-data-[over-photo]:hover:bg-white in-data-[over-photo]:hover:text-black")}
              >
                Anmelden
              </Link>
            )}
            <PublicMobileMenu loggedIn={!!user} />
          </div>
        </div>
      </PublicHeader>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
