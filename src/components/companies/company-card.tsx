import Link from "next/link";
import { BadgeCheck, Briefcase, MapPin, Users } from "lucide-react";
import { industryName } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { CompanyLogo } from "./company-logo";
import { FollowButton } from "./follow-button";

export type CompanyCardData = {
  id: string; slug: string; name: string; tagline: string; industry: string; size: string; city: string; logoSeed: string; verified: boolean;
  followers: number; openOpportunities: number; following: boolean; isMember?: boolean;
};

export function CompanyCard({ company: c }: { company: CompanyCardData }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <Link href={`/unternehmen/${c.slug}`} tabIndex={-1} aria-hidden>
          <CompanyLogo seed={c.logoSeed} name={c.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-base leading-tight font-semibold">
            <Link href={`/unternehmen/${c.slug}`} className="truncate hover:underline">{c.name}</Link>
            {c.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verifiziertes Unternehmen" />}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.tagline}</p>
        </div>
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{industryName(c.industry)}</span>
        <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{c.size} Mitarbeitende</span>
        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{c.city}</span>
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <div className="min-w-0 text-xs">
          <p><strong className="tabular-nums">{formatNumber(c.followers)}</strong> <span className="text-muted-foreground">Follower</span></p>
          {c.openOpportunities > 0 ? (
            <Link href={`/unternehmen/${c.slug}#ausschreibungen`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Briefcase className="size-3.5" aria-hidden /> {c.openOpportunities} offene Ausschreibung{c.openOpportunities === 1 ? "" : "en"}
            </Link>
          ) : (
            <p className="text-muted-foreground">Keine offenen Ausschreibungen</p>
          )}
        </div>
        {c.isMember ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Dein Unternehmen</span>
        ) : (
          <FollowButton companyId={c.id} companyName={c.name} following={c.following} />
        )}
      </div>
    </article>
  );
}
