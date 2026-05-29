'use client';

import { cn } from '@/lib/utils';
import type { SwingPhaseSegment } from '@swingiq/core';

interface SwingPhaseTimelineProps {
  phases: SwingPhaseSegment[];
  currentTime: number;
  duration: number;
  onSeekToPhase?: (time: number) => void;
  className?: string;
}

export function SwingPhaseTimeline({
  phases,
  currentTime,
  duration,
  onSeekToPhase,
  className,
}: SwingPhaseTimelineProps) {
  if (!phases.length || !duration) return null;

  const qualifying = phases.filter((p) => currentTime >= p.start_time);
  const activePhase = qualifying.length > 0 ? qualifying[qualifying.length - 1] : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Swing phases
        </p>
        {phases[0]?.is_estimated && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            ⚠ Estimated timing
          </span>
        )}
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
        {phases.map((phase, i) => {
          const startPct = (phase.start_time / duration) * 100;
          const endPct = (phase.end_time / duration) * 100;
          const widthPct = endPct - startPct;
          const isActive = activePhase?.phase === phase.phase;

          return (
            <button
              key={phase.phase}
              type="button"
              className={cn(
                'absolute top-0 h-full border-r border-white/60 transition-all duration-150',
                'hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500',
                isActive ? 'brightness-100' : 'brightness-90 opacity-70',
                // Alternating color pattern for readability
                i % 2 === 0 ? 'bg-green-200' : 'bg-green-300',
              )}
              style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 1)}%` }}
              onClick={() => onSeekToPhase?.(phase.key_frame_time)}
              title={phase.label}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-green-600 pointer-events-none transition-[left] duration-75"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Phase labels — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {phases.map((phase) => {
          const isActive = activePhase?.phase === phase.phase;
          return (
            <button
              key={phase.phase}
              type="button"
              onClick={() => onSeekToPhase?.(phase.key_frame_time)}
              className={cn(
                'flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-green-500',
                isActive
                  ? 'bg-green-600 text-white font-semibold shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Active phase detail */}
      {activePhase && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <p className="text-xs font-semibold text-green-800">{activePhase.label}</p>
          {activePhase.is_estimated && (
            <p className="text-xs text-green-600 mt-0.5">
              Phase timing is estimated from total video duration.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
