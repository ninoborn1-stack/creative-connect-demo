import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";

export function PersonRow({
  name, slug, avatarSeed, subtitle, meta, action,
}: { name: string; slug?: string | null; avatarSeed?: string | null; subtitle?: string | null; meta?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={name} seed={avatarSeed} className="size-11" />
        <div className="min-w-0">
          {slug ? (
            <Link href={`/mitglieder/${slug}`} className="block truncate font-medium hover:underline">{name}</Link>
          ) : (
            <p className="truncate font-medium">{name}</p>
          )}
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
