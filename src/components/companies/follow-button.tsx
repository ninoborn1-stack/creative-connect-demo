"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { toggleFollowCompany } from "@/app/actions/companies";
import { Button } from "@/components/ui/button";

export function FollowButton({
  companyId, companyName, following: initial, size = "sm", className, onChange,
}: {
  companyId: string; companyName: string; following: boolean; size?: "sm" | "default" | "lg"; className?: string; onChange?: (followers: number) => void;
}) {
  const [following, setFollowing] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Button
      data-testid="follow-company"
      variant={following ? "secondary" : "default"}
      size={size}
      className={className}
      disabled={pending}
      aria-pressed={following}
      aria-label={following ? `${companyName} entfolgen` : `${companyName} folgen`}
      onClick={() =>
        start(async () => {
          const res = await toggleFollowCompany(companyId);
          if (!res.ok) return void toast.error(res.error);
          setFollowing(Boolean(res.following));
          if (typeof res.followers === "number") onChange?.(res.followers);
          if (res.message) toast.success(res.message);
        })
      }
    >
      {following ? <Check aria-hidden /> : <Plus aria-hidden />} {following ? "Gefolgt" : "Folgen"}
    </Button>
  );
}
