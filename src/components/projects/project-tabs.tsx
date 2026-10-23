"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tabs des Projektraums; der aktive Tab steht in ?tab= (teilbar, „Nachricht“-Links springen direkt in den Chat).
export function ProjectTabs({ tabs }: { tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  const params = useSearchParams();
  const requested = params.get("tab");
  const value = tabs.some((t) => t.value === requested) ? requested! : tabs[0].value;

  function change(v: string) {
    const next = new URLSearchParams(params.toString());
    next.set("tab", v);
    window.history.replaceState(null, "", `?${next.toString()}`);
  }

  return (
    <Tabs value={value} onValueChange={change} className="gap-4">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} data-testid={`tab-${t.value}`}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
