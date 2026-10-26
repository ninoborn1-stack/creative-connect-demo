import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoFooter } from "@/components/demo-footer";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";
import { PublicMobileMenu, PublicNavLinks } from "@/components/public/public-nav";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <div className="ml-4">
            <PublicNavLinks />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/dashboard">Zum Dashboard</Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex in-data-[over-photo]:border-white/40 in-data-[over-photo]:bg-white/10 in-data-[over-photo]:text-white in-data-[over-photo]:hover:bg-white/20"><Link href="/login">Anmelden</Link></Button>
            )}
            <PublicMobileMenu loggedIn={!!user} />
          </div>
        </div>
      </PublicHeader>
      <main className="flex-1">{children}</main>
      <DemoFooter />
    </div>
  );
}
