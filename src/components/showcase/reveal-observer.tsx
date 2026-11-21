"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Blendet Elemente mit [data-reveal] einmalig mit kurzem Hochgleiten ein, sobald sie ins Bild kommen
// (CSS in showcase.css, gestaffelt über --i). Ohne JavaScript oder bei reduzierter Bewegung sofort sichtbar.
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-shown", ""); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}
