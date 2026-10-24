"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { completeRedemption, redeemReward } from "@/app/actions/points";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RedeemDialog({ reward, balance }: { reward: { id: string; title: string; cost: number; soldOut: boolean }; balance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const missing = reward.cost - balance;

  if (reward.soldOut) return <Button disabled variant="secondary" className="w-full">Vergriffen</Button>;
  if (missing > 0) return <Button disabled variant="outline" className="w-full">Noch {formatNumber(missing)} Punkte</Button>;

  function confirm() {
    start(async () => {
      const res = await redeemReward(reward.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${res.message ?? "Eingelöst."} −${formatNumber(reward.cost)} Punkte`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="redeem-reward" className="w-full"><Gift aria-hidden />Einlösen</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>„{reward.title}“ einlösen?</DialogTitle>
          <DialogDescription>
            Dafür werden {formatNumber(reward.cost)} Punkte abgezogen – danach hast du noch {formatNumber(balance - reward.cost)} Punkte. Nesto bekommt Bescheid und meldet sich zur Abstimmung.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
          <Button data-testid="confirm-redeem" disabled={pending} onClick={confirm}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}Verbindlich einlösen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CompleteRedemptionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await completeRedemption(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message ?? "Erledigt.");
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}Erledigt
    </Button>
  );
}
