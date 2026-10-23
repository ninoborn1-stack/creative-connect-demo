import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  title, icon: Icon, href, hrefLabel = "Alle ansehen", children, className, id,
}: {
  title: string; icon?: React.ElementType; href?: string; hrefLabel?: string; children: React.ReactNode; className?: string; id: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="size-4 text-primary" aria-hidden />} {title}
        </h2>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {hrefLabel} <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
