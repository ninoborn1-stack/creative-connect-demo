"use client";

import { useTransition } from "react";
import { Drama } from "lucide-react";
import { switchDemoUser } from "@/app/actions/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_USERS = [
  { email: "admin@demo.cc", label: "Admin (Nesto)" },
  { email: "kreativ@demo.cc", label: "Kreative:r (Jule)" },
  { email: "kunde@demo.cc", label: "Auftraggeber:in (Nordlicht)" },
];

export function RoleSwitcher({ currentEmail }: { currentEmail: string }) {
  const [pending, start] = useTransition();
  const known = DEMO_USERS.some((u) => u.email === currentEmail);
  return (
    <Select
      value={known ? currentEmail : undefined}
      onValueChange={(email) => start(() => switchDemoUser(email))}
      disabled={pending}
    >
      <SelectTrigger size="sm" aria-label="Demo-Rolle wechseln" className="max-w-[11rem] gap-1.5 sm:max-w-none">
        <Drama className="size-4 text-primary" />
        <SelectValue placeholder="Demo-Rolle" />
      </SelectTrigger>
      <SelectContent>
        {DEMO_USERS.map((u) => (
          <SelectItem key={u.email} value={u.email}>
            {u.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
