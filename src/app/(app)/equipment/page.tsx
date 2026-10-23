import Link from "next/link";
import { MapPin, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CITIES } from "@/lib/constants";
import { formatEur, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { CommunityTabs } from "@/components/community/community-tabs";
import { EquipmentCreateDialog, EquipmentDeleteButton, EquipmentRequestDialog } from "@/components/community/equipment-dialogs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SP = Record<string, string | string[] | undefined>;
const MODES = [
  { value: "", label: "Alle" },
  { value: "verleih", label: "Verleih" },
  { value: "verkauf", label: "Verkauf" },
];

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = Array.isArray(sp.modus) ? sp.modus[0] : sp.modus;
  const modus = raw === "verleih" || raw === "verkauf" ? raw : "";
  const listings = await db.equipmentListing.findMany({
    where: modus ? { mode: modus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { owner: { include: { profile: true } } },
  });
  const myCity = CITIES.some((c) => c.name === user.profile?.city) ? user.profile!.city : CITIES[0].name;

  return (
    <div>
      <PageHeader
        title="Equipment-Börse"
        description="Kamera, Licht, Mikro, Synth: Ausrüstung im Netzwerk leihen oder kaufen – direkt von Mitgliedern."
        actions={<EquipmentCreateDialog defaultCity={myCity} defaultMode={modus === "verkauf" ? "verkauf" : "verleih"} />}
      />
      <CommunityTabs active="/equipment" />
      <nav aria-label="Angebotsart" className="mb-6 inline-flex rounded-lg bg-muted p-1">
        {MODES.map((m) => {
          const active = modus === m.value;
          return (
            <Link
              key={m.value || "alle"}
              href={m.value ? `/equipment?modus=${m.value}` : "/equipment"}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>

      {listings.length === 0 ? (
        <EmptyState icon={Wrench} title="Keine Angebote" description="Hier ist gerade nichts im Angebot. Stell doch dein eigenes Equipment ein." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const mine = l.ownerId === user.id;
            return (
              <article key={l.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  <StockImage seed={l.imageSeed} alt={`Foto: ${l.title} (Stock)`} w={800} h={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <Badge className={cn("absolute top-3 left-3", l.mode === "verkauf" && "bg-secondary text-secondary-foreground")}>{l.mode === "verleih" ? "Verleih" : "Verkauf"}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="text-lg leading-tight font-semibold">{l.title}</h2>
                  <p className="text-sm text-muted-foreground">{l.description}</p>
                  <p className="text-lg font-semibold">
                    {formatEur(l.price)}
                    <span className="text-sm font-normal text-muted-foreground">{l.mode === "verleih" ? " pro Tag" : " Festpreis"}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Zustand: {l.condition}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{l.city}</span>
                    <span>{formatRelative(l.createdAt)}</span>
                  </div>
                  <div className="mt-auto flex items-center gap-2 border-t pt-3">
                    <UserAvatar name={l.owner.name} seed={l.owner.profile?.avatarSeed} className="size-8" />
                    {l.owner.profile ? (
                      <Link href={`/mitglieder/${l.owner.profile.slug}`} className="truncate text-sm hover:underline">{l.owner.name}</Link>
                    ) : (
                      <span className="truncate text-sm">{l.owner.name}</span>
                    )}
                    {mine && <Badge variant="outline" className="ml-auto">Dein Angebot</Badge>}
                  </div>
                  {mine ? (
                    <EquipmentDeleteButton id={l.id} />
                  ) : (
                    <EquipmentRequestDialog listing={{ id: l.id, title: l.title, ownerName: l.owner.name, mode: l.mode }} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
