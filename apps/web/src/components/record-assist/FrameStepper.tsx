'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FrameStepperPhase {
  key: string;
  label: string;
  /** 0–1 position of the phase start along the clip. */
  startFraction: number;
}

export interface FrameStepperProps {
  src: string;
  /** Approx capture frame rate (drives the step size). */
  fps?: number;
  /** Optional phase markers (from the Motion Lab session) shown on the bar. */
  phases?: FrameStepperPhase[];
  /** Fired the first time the user steps a frame (analytics). */
  onStep?: () => void;
  className?: string;
}

/**
 * Frame-by-frame review of the recorded clip. Steps `currentTime` by one
 * capture frame (±1/fps), with a scrubber and optional phase markers so the
 * athlete can inspect the swing position by position. Pure client video — the
 * clip never leaves the device.
 */
export function FrameStepper({ src, fps = 8, phases, onStep, className }: FrameStepperProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const steppedRef = useRef(false);
  const step = 1 / Math.max(1, fps);

  const onLoaded = useCallback(() => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration)) setDuration(v.duration);
  }, []);

  const onTime = useCallback(() => {
    const v = videoRef.current;
    if (v) setCurrent(v.currentTime);
  }, []);

  useEffect(() => {
    // Pause on mount so stepping is deterministic.
    const v = videoRef.current;
    if (v) v.pause();
  }, []);

  const seek = useCallback(
    (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      const clamped = Math.max(0, Math.min(duration || v.duration || 0, t));
      v.currentTime = clamped;
      if (!steppedRef.current) {
        steppedRef.current = true;
        onStep?.();
      }
    },
    [duration, onStep],
  );

  const stepBy = useCallback((dir: -1 | 1) => seek((videoRef.current?.currentTime ?? 0) + dir * step), [seek, step]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- silent user-recorded swing clip; no audio/dialogue to caption */}
        <video
          ref={videoRef}
          src={src}
          playsInline
          preload="auto"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTime}
          className="mx-auto max-h-[60vh] w-full"
        />
      </div>

      {/* Scrubber with phase markers */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={step}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Scrub clip"
          className="w-full accent-primary"
        />
        {phases && duration > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2">
            {phases.map((p) => (
              <span
                key={p.key}
                title={p.label}
                className="absolute top-0 h-2 w-px bg-primary/70"
                style={{ left: `${Math.min(100, Math.max(0, p.startFraction * 100))}%` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => stepBy(-1)}
          aria-label="Previous frame"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted tap-target"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Frame
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          {current.toFixed(2)}s / {duration ? duration.toFixed(2) : '—'}s
        </span>
        <button
          type="button"
          onClick={() => stepBy(1)}
          aria-label="Next frame"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted tap-target"
        >
          Frame <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
