"use client";

import { useState } from "react";
import { Ban, BadgeCheck, Check, Loader2, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { approveMember, blockMember, unblockMember, verifyMember } from "@/app/actions/admin";
import { ActionButton, useAdminAction } from "./action-button";
import { BLOCK_REASONS } from "./admin-constants";

type Member = { id: string; name: string; status: string; isAdmin: boolean; isSelf: boolean };

export function MemberActions({ member }: { member: Member }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {member.status === "eingeladen" && (
        <ActionButton size="sm" variant="secondary" action={() => approveMember(member.id)}>
          <Check aria-hidden /> Freigeben
        </ActionButton>
      )}
      {(member.status === "aktiv" || member.status === "eingeladen") && (
        <ActionButton size="sm" variant="outline" action={() => verifyMember(member.id)}>
          <BadgeCheck aria-hidden /> Verifizieren
        </ActionButton>
      )}
      {member.status === "gesperrt" ? (
        <ActionButton size="sm" variant="outline" action={() => unblockMember(member.id)}>
          <LockOpen aria-hidden /> Entsperren
        </ActionButton>
      ) : (
        !member.isAdmin && !member.isSelf && <BlockDialog member={member} />
      )}
    </div>
  );
}

function BlockDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const { pending, run } = useAdminAction();
  const valid = reason !== "" && note.trim().length >= 10;
  const noteId = `block-note-${member.id}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        setOpen(o);
        if (!o) {
          setReason("");
          setNote("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Ban aria-hidden /> Sperren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member.name} sperren</DialogTitle>
          <DialogDescription>
            Sperren nur aus den in den AGB genannten Gründen. Die Person erhält die Begründung per Mail und kann widersprechen.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) run(() => blockMember(member.id, reason, note), () => setOpen(false));
          }}
        >
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Sperrgrund (AGB)</legend>
            <RadioGroup value={reason} onValueChange={setReason} aria-label="Sperrgrund">
              {BLOCK_REASONS.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <RadioGroupItem value={r.key} id={`reason-${member.id}-${r.key}`} />
                  <Label htmlFor={`reason-${member.id}-${r.key}`} className="font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor={noteId}>Begründung (Pflicht, mind. 10 Zeichen)</Label>
            <Textarea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Was ist konkret vorgefallen?" required minLength={10} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>Abbrechen</Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />} Sperren
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
