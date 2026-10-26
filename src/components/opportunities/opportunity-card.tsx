import Link from "next/link";
import { BadgeCheck, CalendarClock, FileSignature, MapPin, MessageSquareText, Sparkles, Wallet } from "lucide-react";
import { categoryName } from "@/lib/constants";
import { formatRelative, parseJson } from "@/lib/format";
import { CompanyLogo } from "@/components/companies/company-logo";
import { OpportunityStatusBadge, PitchStatusBadge, budgetRange } from "./opportunity-status";
import { cn } from "@/lib/utils";

export type OpportunityCardData = {
  slug: string; title: string; summary: string; categories: string; budgetMin: number; budgetMax: number; deadline: Date; location: string;
  remote: boolean; licensing: boolean; status: string; createdAt: Date; pitchCount: number;
  company: { name: string; slug: string; logoSeed: string; verified: boolean };
  match?: string; myPitchStatus?: string | null; newPitches?: number;
};

export function OpportunityCard({ o, compact, headingLevel = 2 }: { o: OpportunityCardData; compact?: boolean; headingLevel?: 2 | 3 }) {
  const cats = parseJson<string[]>(o.categories, []);
  const past = o.deadline < new Date();
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={cn("relative flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40", o.match && "border-primary/30")}>
      <div className="flex items-start gap-3">
        <CompanyLogo seed={o.company.logoSeed} name={o.company.name} className="size-12" sizes="48px" />
        <div className="min-w-0 flex-1">
          <H className="text-base leading-snug font-semibold">
            <Link href={`/ausschreibungen/${o.slug}`} className="after:absolute after:inset-0 hover:underline">{o.title}</Link>
          </H>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <span className="truncate">{o.company.name}</span>
            {o.company.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="verifiziert" />}
          </p>
        </div>
        <OpportunityStatusBadge status={o.status} className="hidden sm:inline-flex" />
      </div>
      {!compact && <p className="line-clamp-2 text-sm">{o.summary}</p>}
      {o.match && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden /> {o.match}
        </p>
      )}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-1 font-medium text-foreground"><Wallet className="size-3.5" aria-hidden />{budgetRange(o.budgetMin, o.budgetMax)}</li>
        <li className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden />{past ? "Deadline abgelaufen" : `Deadline ${formatRelative(o.deadline)}`}</li>
        <li className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{o.remote ? "Remote" : o.location}</li>
        {o.licensing && <li className="inline-flex items-center gap-1"><FileSignature className="size-3.5" aria-hidden />inkl. Licensing</li>}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
        <span className="flex flex-wrap gap-1">
          {cats.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{categoryName(c)}</span>
          ))}
        </span>
        <span className="flex items-center gap-2">
          <OpportunityStatusBadge status={o.status} className="sm:hidden" />
          {o.myPitchStatus ? (
            <span className="relative z-10 inline-flex items-center gap-1">Dein Pitch: <PitchStatusBadge status={o.myPitchStatus} /></span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MessageSquareText className="size-3.5" aria-hidden /> {o.pitchCount} Pitch{o.pitchCount === 1 ? "" : "es"}
              {o.newPitches ? <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">+{o.newPitches} neu</span> : null}
            </span>
          )}
        </span>
      </div>
    </article>
  );
}
