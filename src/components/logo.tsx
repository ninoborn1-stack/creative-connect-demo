import Link from "next/link";
import { cn } from "@/lib/utils";

// poster: Variante für die öffentlichen Seiten (Plakat-Schrift, Versalien)
export function Logo({ href = "/", className, poster }: { href?: string; className?: string; poster?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        poster ? "poster-wide text-[0.8rem] min-[375px]:text-sm sm:text-lg" : "font-heading text-lg font-bold tracking-tight",
        className,
      )}
    >
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M15.5 7.5a5 5 0 1 0 0 9" />
          <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      Creative Connect
    </Link>
  );
}
