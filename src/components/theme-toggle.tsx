"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme, useIsDark } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const isDark = useIsDark();
  return (
    <Button variant="ghost" size="icon" aria-label="Farbschema wechseln" onClick={() => setTheme(isDark ? "light" : "dark")}>
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
