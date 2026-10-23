import Link from "next/link";
import { COMMUNITY_NAV } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

// Unternavigation für den Community-Bereich – mobil wichtig, weil die Bottom-Navigation nur „Community“ enthält.
export function CommunityTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Community-Bereiche" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5">
        {COMMUNITY_NAV.map((i) => {
          const isActive = active === i.href;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
                  isActive ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <i.icon className="size-4" aria-hidden />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
