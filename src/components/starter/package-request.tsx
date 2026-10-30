"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Send } from "lucide-react";
import { requestPackage } from "@/app/actions/starter";
import { PACKAGES } from "@/lib/packages";
import { formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StockImage } from "@/components/stock-image";
import { Button } from "@/components/ui/button";
import { RequestFields } from "./request-fields";

// Paket wählen und anfragen – die Anfrage geht als Managed Crew an Nesto und das Team
export function PackageRequest({ initial, defaultCity }: { initial?: string; defaultCity?: string }) {
  const [slug, setSlug] = useState(PACKAGES.some((p) => p.slug === initial) ? initial! : PACKAGES[0].slug);
  const [pending, start] = useTransition();
  const router = useRouter();
  const selected = PACKAGES.find((p) => p.slug === slug)!;

  function submit(formData: FormData) {
    start(async () => {
      const res = await requestPackage({
        slug,
        title: String(formData.get("title") ?? ""),
        city: String(formData.get("city") ?? ""),
        date: String(formData.get("date") ?? ""),
        note: String(formData.get("note") ?? ""),
      });
      if (!res) return;
      if (res.ok) {
        toast.success(res.message);
        router.push(`/projekte/${res.projectId}`);
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="sr-only">Paket wählen</legend>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p) => {
            const active = p.slug === slug;
            return (
              <label
                key={p.slug}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition-shadow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  active ? "border-primary ring-1 ring-primary" : "hover:shadow-md",
                )}
              >
                <input type="radio" name="package" value={p.slug} checked={active} onChange={() => setSlug(p.slug)} className="sr-only" />
                <div className="relative aspect-[16/10]">
                  <StockImage seed={p.imageSeed} w={640} h={400} sizes="(max-width: 640px) 100vw, 25vw" />
                  {p.featured && <span className="absolute top-2 left-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Beliebt</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-sm whitespace-nowrap text-muted-foreground">ab {formatEur(p.price)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {p.includes.map((item) => (
                      <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{item}</li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-3 text-xs text-muted-foreground">Lieferung {p.delivery}</p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <form action={submit} className="rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="pkg-form-title">
        <h2 id="pkg-form-title" className="text-lg font-semibold">„{selected.name}“ anfragen</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Nesto und das Team stellen die passenden Artists zusammen und schicken dir ein festes Angebot ab {formatEur(selected.price)}. Noch kostenlos und unverbindlich.
        </p>
        <RequestFields titleLabel="Worum geht es?" titlePlaceholder="z. B. Single „Nachtfahrt“ mit Video" defaultCity={defaultCity} />
        <Button type="submit" className="mt-5" disabled={pending}>
          <Send aria-hidden /> {pending ? "Wird gesendet …" : "Paket anfragen"}
        </Button>
      </form>
    </div>
  );
}
