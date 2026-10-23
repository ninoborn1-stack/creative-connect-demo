import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Lädt Verträge & Zahlungen">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-8 w-72" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
