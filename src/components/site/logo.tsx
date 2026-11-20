import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Bildmarke + App-Name in breiter Plakat-Schrift
export function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        "poster-wide text-[0.8rem] min-[375px]:text-sm sm:text-lg",
        className,
      )}
    >
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        {/* Platzhalter-Bildmarke: Kaugummiblase mit Glanzpunkt */}
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4">
          <circle cx="12" cy="12" r="7" />
          <circle cx="9.5" cy="9.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {APP_NAME}
    </Link>
  );
}
