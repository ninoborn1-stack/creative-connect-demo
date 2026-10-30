import Link from "next/link";
import { Bell, LogOut, Menu } from "lucide-react";
import { ROADMAP } from "@/lib/features";
import type { CurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoFooter } from "@/components/demo-footer";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RoleSwitcher } from "./role-switcher";
import { BottomNavLink, NavLink } from "./nav-link";
import { ADMIN_NAV, COMMUNITY_NAV, MAIN_NAV, MOBILE_NAV, SYSTEM_NAV } from "./nav-items";

const MODE_LABEL = { closed: "Phase 1 · geschlossen", clients: "Phase 2 · Auftraggeber", open: "Phase 3 · offen" };

function NavSections({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Hauptnavigation">
      <div className="flex flex-col gap-0.5">
        {MAIN_NAV.map((i) => (
          <NavLink key={i.href} href={i.href} label={i.label} icon={<i.icon className="size-4 shrink-0" aria-hidden />} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Community</p>
        {COMMUNITY_NAV.map((i) => (
          <NavLink key={i.href} href={i.href} label={i.label} icon={<i.icon className="size-4 shrink-0" aria-hidden />} />
        ))}
      </div>
      {isAdmin && (
        <div className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin</p>
          {ADMIN_NAV.map((i) => (
            <NavLink key={i.href} href={i.href} label={i.label} icon={<i.icon className="size-4 shrink-0" aria-hidden />} />
          ))}
        </div>
      )}
      <div className="px-3">
        <p className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Bald verfügbar</p>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground/80">
          {ROADMAP.map((r) => (
            <li key={r.label} className="flex items-center gap-2"><span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary/60" />{r.label}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-0.5">
        {SYSTEM_NAV.map((i) => (
          <NavLink key={i.href} href={i.href} label={i.label} icon={<i.icon className="size-4 shrink-0" aria-hidden />} />
        ))}
      </div>
    </nav>
  );
}

export async function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [unread, mode] = await Promise.all([
    db.notification.count({ where: { userId: user.id, read: false } }),
    getMarketplaceMode(),
  ]);
  const avatarSeed = user.profile?.avatarSeed;

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-sidebar px-3 py-5 lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <NavSections isAdmin={user.isAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menü öffnen">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-4">
              <SheetHeader className="p-0 pb-4">
                <SheetTitle asChild>
                  <div><Logo href="/dashboard" /></div>
                </SheetTitle>
              </SheetHeader>
              <NavSections isAdmin={user.isAdmin} />
            </SheetContent>
          </Sheet>
          <Badge variant="outline" className="hidden md:inline-flex">{MODE_LABEL[mode]}</Badge>
          <div className="ml-auto flex items-center gap-1">
            <RoleSwitcher currentEmail={user.email} />
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/benachrichtigungen" aria-label={`Benachrichtigungen, ${unread} ungelesen`}>
                <Bell />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            </Button>
            <ThemeToggle />
            <Link href={user.profile ? `/mitglieder/${user.profile.slug}` : "/dashboard"} className="ml-1 hidden sm:block" aria-label="Mein Profil">
              <UserAvatar name={user.name} seed={avatarSeed} className="size-8" />
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Abmelden">
                <LogOut />
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <div className="pb-16 lg:pb-0">
          <DemoFooter />
        </div>
      </div>

      <nav aria-label="Mobile Navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((i) => (
          <BottomNavLink key={i.href} href={i.href} label={i.short ?? i.label} icon={<i.icon className="size-5" aria-hidden />} />
        ))}
      </nav>
    </div>
  );
}
