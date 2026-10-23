import { requireUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="glow flex min-h-dvh flex-col">
      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Logo />
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">Abmelden</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">Demo – alle Inhalte fiktiv, Bilder: Stock.</footer>
    </div>
  );
}
