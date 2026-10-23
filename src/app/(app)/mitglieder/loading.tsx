import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Mitglieder werden geladen">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-[32rem] rounded-xl lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card">
                <Skeleton className="aspect-[16/9] rounded-none" />
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
