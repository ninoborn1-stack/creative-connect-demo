import { expect, test } from "@playwright/test";
import { PAGES_BY_LANG } from "./pages";

// Typografie-Regeln: keine Gedankenstriche, Überschriften mit wenigen Zeilen, nichts läuft über.
// Läuft nur im Projekt „desktop“ und setzt die Breiten selbst (375, 768, 1280, 1440 px).

const LANGS = ["de", "en"] as const;
const DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"); // Halbgeviert- und Geviertstrich

// Höchstzahl Zeilen je Stufe: [375, 768, 1280+]
const LIMITS: Record<string, [number, number, number]> = { H1: [3, 2, 2], H2: [3, 2, 2], H3: [2, 2, 2] };

test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "setzt Breiten selbst"));

for (const lang of LANGS) {
  for (const page of PAGES_BY_LANG[lang]) {
    test(`/${lang}/${page}: keine Gedankenstriche`, async ({ page: p }) => {
      await p.goto(`${lang}/${page}`);
      // Vorschau nachladen, damit auch ihre Texte geprüft werden
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(400);
      const found = await p.evaluate((src) => {
        const re = new RegExp(src);
        const hits: string[] = [];
        if (re.test(document.title)) hits.push(`title: ${document.title}`);
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const parent = n.parentElement;
          if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) && re.test(n.textContent ?? "")) hits.push(`text: ${n.textContent!.trim().slice(0, 80)}`);
        }
        document.querySelectorAll("meta[content]").forEach((m) => re.test(m.getAttribute("content")!) && hits.push(`meta: ${m.getAttribute("content")}`));
        document.querySelectorAll("[alt],[aria-label],[title],[placeholder]").forEach((el) => {
          for (const a of ["alt", "aria-label", "title", "placeholder"]) {
            const v = el.getAttribute(a);
            if (v && re.test(v)) hits.push(`${a}: ${v}`);
          }
        });
        document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => re.test(s.textContent ?? "") && hits.push("json-ld"));
        return hits;
      }, DASH.source);
      expect(found).toEqual([]);
    });

    for (const width of [375, 768, 1280, 1440]) {
      test(`/${lang}/${page} @${width}: Überschriften-Zeilen und kein Überlauf`, async ({ page: p }) => {
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ reducedMotion: "reduce" });
        await p.goto(`${lang}/${page}`);
        await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await p.waitForTimeout(300);
        const tier = width < 768 ? 0 : width < 1280 ? 1 : 2;
        const problems = await p.evaluate(({ limits, tier }) => {
          const out: string[] = [];
          // Zeilen zählen: Text-Rechtecke nach ihrer senkrechten Mitte gruppieren. Robust gegen line-height < 1 und
          // gegen gemischte Schriften in einer Zeile (kursives Serif-Akzentwort sitzt etwas anders als die Plakat-Schrift).
          const lines = (el: Element) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            const rects = [...r.getClientRects()].filter((x) => x.width > 1).map((x) => ({ c: (x.top + x.bottom) / 2, h: x.height })).sort((a, b) => a.c - b.c);
            let n = 0, last = -Infinity;
            for (const x of rects) if (x.c - last > x.h * 0.45) { n++; last = x.c; }
            return n;
          };
          for (const h of document.querySelectorAll("h1, h2, h3")) {
            if ((h as HTMLElement).offsetParent === null || h.closest('[aria-hidden="true"], .sr-only')) continue;
            const max = limits[h.tagName][tier];
            const n = lines(h);
            if (n > max) out.push(`${h.tagName} ${n}/${max} Zeilen: ${h.textContent!.trim().slice(0, 60)}`);
          }
          for (const el of document.querySelectorAll("h1, h2, h3, p, a, button, li, dd, dt, label, span")) {
            const s = getComputedStyle(el);
            if (s.overflowX !== "visible" || (el as HTMLElement).offsetParent === null) continue;
            if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && s.display !== "inline") out.push(`Überlauf ${el.tagName}: ${el.textContent!.trim().slice(0, 50)}`);
          }
          if (document.documentElement.scrollWidth > innerWidth + 1) out.push("Seite scrollt horizontal");
          return out;
        }, { limits: LIMITS, tier });
        expect(problems).toEqual([]);
      });
    }
  }
}
