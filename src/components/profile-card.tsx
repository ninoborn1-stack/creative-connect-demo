import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatEur, parseJson } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { AvailabilityDot, CategoryBadge, Rating, VerifiedBadge } from "@/components/badges";

export type ProfileCardData = {
  slug: string; headline: string; city: string; categories: string; dayRateMin: number; dayRateMax: number;
  availability: string; verified: boolean; ratingAvg: number; ratingCount: number; avatarSeed: string; coverSeed: string; isPro: boolean;
  user: { id: string; name: string };
};

export function ProfileCard({ profile, action }: { profile: ProfileCardData; action?: React.ReactNode }) {
  const cats = parseJson<string[]>(profile.categories, []);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40">
      <Link href={`/mitglieder/${profile.slug}`} className="relative block aspect-[16/9] bg-muted">
        <StockImage seed={profile.coverSeed} w={640} h={360} sizes="(max-width: 640px) 100vw, 33vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {profile.isPro && <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">PRO</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="-mt-10 flex items-end gap-3">
          <UserAvatar name={profile.user.name} seed={profile.avatarSeed} className="size-14 ring-4 ring-card" />
          <div className="min-w-0 pb-0.5">
            <Link href={`/mitglieder/${profile.slug}`} className="block truncate font-semibold hover:underline">{profile.user.name}</Link>
            <p className="truncate text-xs text-muted-foreground">{profile.headline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => <CategoryBadge key={c} slug={c} />)}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{profile.city}</span>
          <AvailabilityDot value={profile.availability} showLabel />
          {profile.verified && <VerifiedBadge />}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div>
            <p className="text-sm font-semibold">{formatEur(profile.dayRateMin)} – {formatEur(profile.dayRateMax)}</p>
            <p className="text-[11px] text-muted-foreground">Tagessatz</p>
          </div>
          <Rating value={profile.ratingAvg} count={profile.ratingCount} />
        </div>
        {action}
      </div>
    </article>
  );
}
