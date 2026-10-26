"use client";

import { BadgeCheck, ShieldOff } from "lucide-react";
import { setCompanyVerified } from "@/app/actions/admin-corporate";
import { ActionButton } from "./action-button";

export function CompanyVerifyButton({ id, verified, name }: { id: string; verified: boolean; name: string }) {
  return verified ? (
    <ActionButton size="sm" variant="outline" action={() => setCompanyVerified(id, false)} aria-label={`Verifizierung von ${name} entziehen`}>
      <ShieldOff aria-hidden /> Entziehen
    </ActionButton>
  ) : (
    <ActionButton size="sm" variant="secondary" action={() => setCompanyVerified(id, true)} aria-label={`${name} verifizieren`}>
      <BadgeCheck aria-hidden /> Verifizieren
    </ActionButton>
  );
}
