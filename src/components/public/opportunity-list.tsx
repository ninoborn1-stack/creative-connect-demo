import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate, formatEur } from "@/lib/format";

export type PublicOpportunity = {
  id: string; slug: string; title: string; summary: string; budgetMin: number; budgetMax: number; deadline: Date;
  location: string; remote: boolean; licensing: boolean; company: { name: string };
};

export const PUBLIC_OPPORTUNITY_SELECT = {
  id: true, slug: true, title: true, summary: true, budgetMin: true, budgetMax: true, deadline: true, location: true, remote: true, licensing: true,
  company: { select: { name: true } },
} as const;

// Ausschreibungen als Board-Zeilen (wie eine Anzeigetafel): Firma · Titel · Budget · Frist
export function OpportunityList({ items }: { items: PublicOpportunity[] }) {
  return (
    <ul className="border-t">
      {items.map((o) => (
        <li key={o.id} className="border-b">
          <Link
            href={`/ausschreibungen/${o.slug}`}
            className="group grid gap-x-6 gap-y-2 py-6 transition-colors hover:bg-primary hover:text-primary-foreground sm:px-3 lg:grid-cols-12 lg:items-center"
          >
            <p className="meta text-primary group-hover:text-primary-foreground lg:col-span-2">{o.company.name}</p>
            <div className="min-w-0 lg:col-span-5">
              <h3 className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{o.title}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground group-hover:text-primary-foreground/80">{o.summary}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums lg:col-span-2">{formatEur(o.budgetMin)} – {formatEur(o.budgetMax)}</p>
            <p className="meta text-muted-foreground group-hover:text-primary-foreground/80 lg:col-span-2">
              Bis {formatDate(o.deadline)} · {o.remote ? "Remote" : o.location}
              {o.licensing && " · inkl. Rechte"}
            </p>
            <ArrowUpRight className="hidden size-7 justify-self-end transition-transform duration-300 group-hover:rotate-45 lg:col-span-1 lg:block" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
