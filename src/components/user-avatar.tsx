import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarImage } from "@/lib/stock";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, seed, className }: { name: string; seed?: string | null; className?: string }) {
  return (
    <Avatar className={cn("size-10", className)}>
      {seed && <AvatarImage src={avatarImage(seed, 160)} alt="" />}
      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
