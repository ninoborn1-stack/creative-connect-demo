import { expect, test } from "@playwright/test";

// Typografie-Regeln: keine Gedankenstriche, Überschriften mit wenigen Zeilen, nichts läuft über.
// Läuft nur im Projekt „desktop“ und setzt die Breiten selbst (375, 768, 1280, 1440 px).

const PAGES = ["", "artists/", "veranstalter/", "unternehmen/", "download/", "warteliste/", "presse/", "impressum/", "datenschutz/"];
const LANGS = ["de", "en"];
const DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"); // Halbgeviert- und Geviertstrich

// Höchstzahl Zeilen je Stufe: [375, 768, 1280+]
const LIMITS: Record<string, [number, number, number]> = { H1: [3, 2, 2], H2: [3, 2, 2], H3: [2, 2, 2] };

test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "setzt Breiten selbst"));

for (const lang of LANGS) {
  for (const page of PAGES) {
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
          // Zeilen zählen: Zeilenanfänge der Text-Rechtecke (robust gegen line-height < 1)
          const lines = (el: Element) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            const tops = new Set<number>();
            for (const rect of r.getClientRects()) if (rect.width > 1) tops.add(Math.round(rect.bottom / 4));
            return tops.size;
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
