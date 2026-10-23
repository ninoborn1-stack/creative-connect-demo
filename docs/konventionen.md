# Code-Konventionen

- **Next.js 16 App Router.** `params`/`searchParams` sind Promises (`const { id } = await params`). Keine `middleware`, Auth-Prüfung in Layouts. Typen für Seiten: `{ params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }`.
- **Daten:** Server Components lesen direkt mit `db` (`@/lib/db`). Mutationen als Server Actions in `src/app/actions/<feature>.ts` (`"use server"`), danach `revalidatePath(...)`. Kein API-Layer nötig, außer für Downloads (Route Handler, z. B. CSV/PDF).
- **Session:** `requireUser()` / `requireAdmin()` / `getCurrentUser()` aus `@/lib/session`. Rollen-Flags: `isAdmin`, `isCreative`, `isClient` (ein Account kann mehrere haben).
- **SQLite-Listen** sind JSON-Strings → `parseJson<string[]>(value, [])` aus `@/lib/format`. Filter auf Kategorien: `categories: { contains: '"videografie"' }`.
- **Formatierung:** `formatEur`, `formatDate` (TT.MM.JJJJ), `formatDateTime`, `formatRelative` aus `@/lib/format`. Alles auf Deutsch, gendergerecht mit Doppelpunkt (Kreative:r, Auftraggeber:in).
- **Bilder:** immer `StockImage` (`@/components/stock-image`, `fill`-Layout → Container braucht `relative` + Höhe/Aspect) bzw. `stockImage(seed, w, h)`. Avatare: `UserAvatar`.
- **UI:** shadcn/ui unter `@/components/ui/*` (Radix, `asChild` an Button für Links). Gemeinsame Bausteine: `PageHeader`, `EmptyState`, `ProfileCard`, `StatusBadge`, `CategoryBadge`, `AvailabilityDot`, `Rating`, `VerifiedBadge`, `AiNotice`. Icons: `lucide-react`. Toasts: `toast` aus `sonner`.
- **Design:** Dunkel ist Standard, Akzent Violett (`primary`). Farben nur über Tokens (`bg-card`, `text-muted-foreground`, `border`, `bg-primary` …), keine Hex-Werte. Überschriften nutzen automatisch die Display-Schrift. Mobil zuerst: alles muss bei 375 px ohne horizontales Scrollen funktionieren (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`, Tabellen in `overflow-x-auto`).
- **Zustände:** jede Liste hat einen leeren Zustand (`EmptyState`); langsame Seiten bekommen eine `loading.tsx` mit `Skeleton`.
- **Barrierefreiheit:** Labels an allen Feldern, `aria-label` an Icon-Buttons, sinnvolle Überschriftenhierarchie.
- **Mocks:** Zahlungen nur über `payments` (`@/lib/services/payments`), Mails über `sendMail`/`notify` (`@/lib/services/mail`), KI über `@/lib/services/ai`, Uploads über `storeFile`.
- **Geschäftsregeln:** 0 % Provision Kreative, 10 % Servicegebühr Auftraggeber, Pro-Abo 12 €/Monat, Managed-Crew-Marge 18 %, KSK 4,9 % / Bagatellgrenze 1.000 € (aktuelle Werte via `getFees()` aus `@/lib/settings`).
