"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BARS = 40;
let currentAudio: HTMLAudioElement | null = null;

function barHeights(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + i;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
    return Math.round((0.25 + r * 0.75) * envelope * 100);
  });
}

function fmt(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Hörproben-Player mit Wellenform-Optik aus CSS-Balken (Keyframes `eq` in globals.css).
export function AudioPlayer({ src, title, subtitle, className }: { src: string; title: string; subtitle?: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const heights = useMemo(() => barHeights(title + src), [title, src]);
  const progress = duration ? time / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      if (currentAudio === audio) currentAudio = null;
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (currentAudio && currentAudio !== audio) currentAudio.pause();
      currentAudio = audio;
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(duration, audio.currentTime + 5);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-card p-3", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <Button
        type="button"
        size="icon-lg"
        className="rounded-full"
        onClick={toggle}
        aria-label={playing ? `${title} pausieren` : `${title} abspielen`}
      >
        {playing ? <Pause /> : <Play className="translate-x-px" />}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {fmt(time)} / {fmt(duration)}
          </span>
        </div>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Fortschritt ${title}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} von ${fmt(duration)}`}
          onClick={seek}
          onKeyDown={onKey}
          className="mt-2 flex h-9 cursor-pointer items-center gap-[2px] rounded"
        >
          {heights.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "w-full flex-1 rounded-full transition-colors",
                i / BARS < progress ? "bg-primary" : "bg-muted-foreground/30",
              )}
              style={{
                height: `${h}%`,
                animation: playing ? `eq ${0.7 + (i % 5) * 0.12}s ease-in-out ${(i % 7) * 0.08}s infinite` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
