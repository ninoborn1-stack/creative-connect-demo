"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsDark } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const isDark = useIsDark();
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors position="top-center" theme={isDark ? "dark" : "light"} />
    </TooltipProvider>
  );
}
