"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { acceptConnection, declineConnection, removeConnection, requestConnection, withdrawConnection } from "@/app/actions/network";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ConnectState = "none" | "pending_out" | "pending_in" | "connected";

type Props = {
  targetId: string;
  targetName: string;
  state: ConnectState;
  connectionId?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  /** Bei eingehender Anfrage zusätzlich „Ablehnen“ anzeigen */
  showDecline?: boolean;
};

export function ConnectButton({ targetId, targetName, state: initial, connectionId: initialId, size = "sm", className, showDecline }: Props) {
  const [state, setState] = useState<ConnectState>(initial);
  const [connectionId, setConnectionId] = useState(initialId);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string; state?: ConnectState; connectionId?: string }>) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Das hat nicht geklappt.");
        return;
      }
      if (res.state) setState(res.state);
      if (res.connectionId) setConnectionId(res.connectionId);
      if (res.message) toast.success(res.message);
    });
  }

  if (state === "connected") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-testid="connect-button" data-state-connection="connected" variant="secondary" size={size} className={className} disabled={pending} aria-label={`Mit ${targetName} verbunden – Optionen`}>
            <UserCheck aria-hidden /> Verbunden
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => run(() => removeConnection(targetId))}>
            <X aria-hidden /> Kontakt entfernen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (state === "pending_out") {
    return (
      <Button
        data-testid="connect-button"
        data-state-connection="pending_out"
        variant="outline"
        size={size}
        className={className}
        disabled={pending || !connectionId}
        onClick={() => connectionId && run(() => withdrawConnection(connectionId))}
        aria-label={`Anfrage an ${targetName} gesendet – klicken zum Zurückziehen`}
        title="Anfrage zurückziehen"
      >
        <Clock aria-hidden /> Angefragt
      </Button>
    );
  }

  if (state === "pending_in" && connectionId) {
    return (
      <span className={cn("inline-flex flex-wrap gap-2", className)}>
        <Button data-testid="connect-button" data-state-connection="pending_in" size={size} disabled={pending} onClick={() => run(() => acceptConnection(connectionId))} aria-label={`Kontaktanfrage von ${targetName} annehmen`}>
          <Check aria-hidden /> Anfrage annehmen
        </Button>
        {showDecline && (
          <Button variant="ghost" size={size} disabled={pending} onClick={() => run(() => declineConnection(connectionId))} aria-label={`Kontaktanfrage von ${targetName} ablehnen`}>
            <X aria-hidden /> Ablehnen
          </Button>
        )}
      </span>
    );
  }

  return (
    <Button data-testid="connect-button" data-state-connection="none" variant="outline" size={size} className={className} disabled={pending} onClick={() => run(() => requestConnection(targetId))} aria-label={`Mit ${targetName} vernetzen`}>
      <UserPlus aria-hidden /> Vernetzen
    </Button>
  );
}
