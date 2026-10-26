import Link from "next/link";
import { CalendarClock, ChevronRight, Globe, MapPin, ShieldCheck } from "lucide-react";
import { formatDate, formatEur } from "@/lib/format";

export type PublicOpportunity = {
  id: string; slug: string; title: string; summary: string; budgetMin: number; budgetMax: number; deadline: Date;
  location: string; remote: boolean; licensing: boolean; company: { name: string };
};

export const PUBLIC_OPPORTUNITY_SELECT = {
  id: true, slug: true, title: true, summary: true, budgetMin: true, budgetMax: true, deadline: true, location: true, remote: true, licensing: true,
  company: { select: { name: true } },
} as const;

export function OpportunityList({ items }: { items: PublicOpportunity[] }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {items.map((o) => (
        <li key={o.id}>
          <Link href={`/ausschreibungen/${o.slug}`} className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted/40 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary">{o.company.name}</p>
              <h3 className="mt-0.5 font-semibold leading-snug group-hover:underline">{o.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.summary}</p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{formatEur(o.budgetMin)} – {formatEur(o.budgetMax)}</span>
                <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden />Pitch bis {formatDate(o.deadline)}</span>
                <span className="inline-flex items-center gap-1">
                  {o.remote ? <Globe className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                  {o.remote ? "Remote" : o.location}
                </span>
                {o.licensing && <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" aria-hidden />inkl. Nutzungsrechte</span>}
              </p>
            </div>
            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
