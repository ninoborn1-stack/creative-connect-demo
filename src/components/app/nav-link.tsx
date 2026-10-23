"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Icons kommen als fertiges Element vom Server (Komponenten-Funktionen sind nicht serialisierbar)
export function NavLink({ href, label, icon, exact }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function BottomNavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground", active && "text-primary")}
    >
      {icon}
      {label}
    </Link>
  );
}
