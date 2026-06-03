'use client';

// ============================================================
// SwingIQ — Motion Lab: Video Trimmer
// ------------------------------------------------------------
// Lets the user mark the start/end of the actual rep. We don't
// re-encode the file (no heavy ffmpeg dependency) — instead the trim
// window is passed to frame extraction so only that range is sampled.
// Honest + lightweight, and it sharpens the analysis on a long clip.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Scissors, Play } from 'lucide-react';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
}

interface Props {
  objectUrl: string;
  durationSeconds: number;
  onChange: (startSeconds: number, endSeconds: number) => void;
}

export function VideoTrimmer({ objectUrl, durationSeconds, onChange }: Props) {
  const dur = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0;
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(dur);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopAtRef = useRef<number | null>(null);

  // Initialise the end to full duration when it becomes known. Report once.
  useEffect(() => {
    setEnd(dur);
    onChange(0, dur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur]);

  // Call onChange imperatively from the handlers (not via an effect) so an
  // inline parent callback can't retrigger a render loop.
  const setStartClamped = (v: number) => {
    const s = Math.min(v, end - 0.2);
    setStart(s);
    onChange(s, end);
  };
  const setEndClamped = (v: number) => {
    const e = Math.max(v, start + 0.2);
    setEnd(e);
    onChange(start, e);
  };

  const previewTrim = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    stopAtRef.current = end;
    v.play().catch(() => {});
  }, [start, end]);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || stopAtRef.current == null) return;
    if (v.currentTime >= stopAtRef.current) {
      v.pause();
      v.currentTime = start;
      stopAtRef.current = null;
    }
  };

  const startPct = dur > 0 ? (start / dur) * 100 : 0;
  const endPct = dur > 0 ? (end / dur) * 100 : 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Scissors className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Trim to the rep <span className="text-muted-foreground font-normal">(optional)</span></p>
      </div>

      <video ref={videoRef} src={objectUrl} playsInline muted onTimeUpdate={onTimeUpdate}
        className="w-full rounded-lg bg-black max-h-[260px]" />

      {/* selected-window track */}
      <div className="relative h-2 rounded-full bg-muted">
        <div className="absolute h-full rounded-full bg-primary/40" style={{ left: `${startPct}%`, right: `${100 - endPct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted-foreground">
          Start: <span className="text-foreground font-medium tabular-nums">{fmt(start)}</span>
          <input type="range" min={0} max={dur} step={0.05} value={start}
            onChange={(e) => setStartClamped(Number(e.target.value))} className="w-full accent-primary" />
        </label>
        <label className="text-xs text-muted-foreground">
          End: <span className="text-foreground font-medium tabular-nums">{fmt(end)}</span>
          <input type="range" min={0} max={dur} step={0.05} value={end}
            onChange={(e) => setEndClamped(Number(e.target.value))} className="w-full accent-primary" />
        </label>
      </div>

      <button onClick={previewTrim} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Play className="w-3.5 h-3.5" /> Preview trimmed window ({(end - start).toFixed(1)}s)
      </button>
    </div>
  );
}
