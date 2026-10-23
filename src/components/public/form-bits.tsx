"use client";

import { CircleCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>;
}

export function SuccessPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
      <CircleCheck className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
