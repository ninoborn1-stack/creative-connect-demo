import { Skeleton } from "@/components/ui/skeleton";

// Lade-Skelett für Kartenlisten (Studios, Events, Equipment …)
export function ListSkeleton({ cards = 6, withFilters = true }: { cards?: number; withFilters?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-80 max-w-full" />
      {withFilters && <Skeleton className="mb-6 h-24 w-full rounded-xl" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
