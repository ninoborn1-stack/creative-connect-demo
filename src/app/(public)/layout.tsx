import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoFooter } from "@/components/demo-footer";
import { Button } from "@/components/ui/button";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm"><Link href="/dashboard">Zum Dashboard</Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline"><Link href="/login">Anmelden</Link></Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <DemoFooter />
    </div>
  );
}
