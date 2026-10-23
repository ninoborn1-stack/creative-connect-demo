import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoFooter } from "@/components/demo-footer";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm"><Link href="/dashboard">Zum Dashboard</Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="in-data-[over-photo]:border-white/40 in-data-[over-photo]:bg-white/10 in-data-[over-photo]:text-white in-data-[over-photo]:hover:bg-white/20"><Link href="/login">Anmelden</Link></Button>
            )}
          </div>
        </div>
      </PublicHeader>
      <main className="flex-1">{children}</main>
      <DemoFooter />
    </div>
  );
}
