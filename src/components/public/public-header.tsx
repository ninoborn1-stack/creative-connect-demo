"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Auf der Startseite liegt die Navbar transparent über dem Hero-Foto und wird erst nach der
// Hero-Scroll-Strecke zur normalen Leiste. Auf allen anderen Seiten ist sie direkt sticky.
export function PublicHeader({ children }: { children: React.ReactNode }) {
  const onHero = usePathname() === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!onHero) return;
    const update = () => {
      const hero = document.querySelector<HTMLElement>(".hero");
      const limit = hero ? hero.offsetHeight - window.innerHeight * 0.6 : window.innerHeight;
      setPastHero(window.scrollY > limit);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onHero]);

  const overPhoto = onHero && !pastHero;
  return (
    <header
      data-hero-nav={onHero ? "" : undefined}
      data-over-photo={overPhoto ? "" : undefined}
      className={cn(
        "top-0 z-30 transition-[background-color,border-color,color] duration-500",
        onHero ? "fixed inset-x-0" : "sticky",
        overPhoto ? "border-b border-transparent bg-transparent text-white" : "border-b bg-background/85 backdrop-blur",
      )}
    >
      {children}
    </header>
  );
}
