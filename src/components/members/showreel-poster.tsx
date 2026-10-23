"use client";

import { Play } from "lucide-react";
import { StockImage } from "@/components/stock-image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ShowreelPoster({ title, seed }: { title: string; seed: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-muted text-left"
          aria-label={`${title} abspielen`}
        >
          <StockImage seed={seed} w={960} h={540} alt="" sizes="(max-width: 768px) 100vw, 50vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
          <span className="absolute inset-0 grid place-items-center" aria-hidden>
            <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
              <Play className="size-6 translate-x-0.5" />
            </span>
          </span>
          <span className="absolute bottom-3 left-3 right-3 truncate text-sm font-semibold text-white">{title}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Demo – Showreel-Einbettung (YouTube/Vimeo) folgt.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          <StockImage seed={seed} w={960} h={540} alt="" />
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-medium text-white">Player-Platzhalter</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
