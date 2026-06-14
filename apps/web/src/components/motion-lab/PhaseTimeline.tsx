'use client';

// ============================================================
// SwingVantage — Motion Lab: Phase Timeline
// ============================================================

import type { MotionPhaseSegment } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';

interface Props {
  phases: MotionPhaseSegment[];
  accent?: string;
  activeKey?: string | null;
  onSelect?: (phase: MotionPhaseSegment) => void;
}

export function PhaseTimeline({ phases, accent = '#22C55E', activeKey, onSelect }: Props) {
  if (phases.length === 0) return null;
  const total = Math.max(1, phases[phases.length - 1].endFrame);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-foreground">Motion Phases</h3>
        <span className="text-2xs text-muted-foreground">estimated · tap a phase</span>
      </div>
      <div className="flex w-full h-8 rounded-lg overflow-hidden border border-border">
        {phases.map((p, i) => {
          const span = Math.max(1, p.endFrame - p.startFrame + 1);
          const widthPct = (span / total) * 100;
          const active = p.key === activeKey;
          return (
            <button
              key={p.key + i}
              onClick={() => onSelect?.(p)}
              title={`${p.label} · confidence ${Math.round(p.confidence * 100)}%`}
              className={cn(
                'h-full text-3xs font-medium text-white/95 truncate px-1 border-r border-black/20 last:border-r-0 transition-opacity hover:opacity-100',
                active ? 'opacity-100 ring-2 ring-inset ring-white/60' : 'opacity-80',
              )}
              style={{ width: `${widthPct}%`, background: accent, opacity: 0.35 + p.confidence * 0.5 }}
            >
              {p.shortLabel}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-3xs text-muted-foreground">
        <span>Start</span>
        <span>Finish</span>
      </div>
    </div>
  );
}
