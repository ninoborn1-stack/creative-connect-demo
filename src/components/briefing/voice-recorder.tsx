"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_SECONDS = 60;

// Echte Browser-Aufnahme (MediaRecorder). Die Transkription ist im Demo-Modus ein fester Beispieltext.
export function VoiceRecorder({ transcript, onTranscript }: { transcript: string; onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
  }

  useEffect(() => cleanup, []);

  function finish(fromMic: boolean) {
    cleanup();
    setRecording(false);
    onTranscript(transcript);
    toast.success(fromMic ? "Sprachnachricht transkribiert (Demo-Transkription)" : "Kein Mikrofon verfügbar – Demo-Transkription eingesetzt");
  }

  async function start() {
    const supported = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
    if (!supported) return finish(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s);
      recorder.current = r;
      r.onstop = () => finish(true);
      r.start();
      setSeconds(0);
      setRecording(true);
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) stop();
      }, 1000);
    } catch {
      finish(false);
    }
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    else finish(true);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return recording ? (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="destructive" onClick={stop} data-testid="voice-stop">
        <Square aria-hidden /> Aufnahme beenden
      </Button>
      <span className="inline-flex items-center gap-2 text-sm tabular-nums" aria-live="polite">
        <span className="size-2.5 animate-pulse rounded-full bg-destructive" aria-hidden />
        Aufnahme läuft {mm}:{ss}
      </span>
    </div>
  ) : (
    <Button type="button" variant="outline" onClick={start} data-testid="voice-start">
      <Mic aria-hidden /> Sprachnachricht aufnehmen
    </Button>
  );
}
