'use client';

import { cn } from '@/lib/utils';
import type { FrameQualitySignals, SportActionPreset } from '@/lib/record-assist/types';

export interface AthleteFrameOverlayProps {
  quality: FrameQualitySignals | null;
  preset?: SportActionPreset;
  className?: string;
}

/**
 * Premium, low-clutter framing overlay drawn over the live preview. Uses a
 * 0–100 viewBox so it scales with any aspect ratio. The athlete box turns
 * green when the full body is in frame; the centering target and safe-zone
 * guide help solo users line up without another person.
 */
export function AthleteFrameOverlay({ quality, preset, className }: AthleteFrameOverlayProps) {
  const box = quality?.boundingBox;
  const fullBody = quality?.fullBodyVisible;
  const centered = quality?.centering === 'centered';

  // Safe movement zone derived from preset headroom; defaults to a centered box.
  const headroom = (preset?.headroomFraction ?? 0.08) * 100;
  const safe = { x: 18, y: Math.max(4, headroom * 0.5), w: 64, h: 100 - Math.max(4, headroom * 0.5) - 4 };

  const boxColor = fullBody ? 'stroke-success' : box ? 'stroke-warning' : 'stroke-white/40';

  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Safe movement zone */}
      <rect
        x={safe.x} y={safe.y} width={safe.w} height={safe.h}
        rx="2"
        className="fill-none stroke-white/25"
        strokeWidth="0.4"
        strokeDasharray="2 2"
      />

      {/* Centering target — vertical line at mid-frame */}
      <line
        x1="50" y1={safe.y} x2="50" y2={safe.y + safe.h}
        className={cn(centered ? 'stroke-success/70' : 'stroke-white/30')}
        strokeWidth="0.3"
        strokeDasharray="1.5 1.5"
      />

      {/* Headroom marker */}
      <line
        x1={safe.x} y1={safe.y} x2={safe.x + safe.w} y2={safe.y}
        className="stroke-white/40"
        strokeWidth="0.3"
      />

      {/* Athlete bounding box */}
      {box && (
        <rect
          x={box.x * 100}
          y={box.y * 100}
          width={box.width * 100}
          height={box.height * 100}
          rx="1.5"
          className={cn('fill-none transition-colors', boxColor)}
          strokeWidth="0.6"
        />
      )}

      {/* Feet indicator line */}
      {box && (
        <line
          x1={box.x * 100}
          y1={(box.y + box.height) * 100}
          x2={(box.x + box.width) * 100}
          y2={(box.y + box.height) * 100}
          className={cn(quality?.feetVisible === 'visible' ? 'stroke-success' : 'stroke-error')}
          strokeWidth="0.8"
        />
      )}
    </svg>
  );
}
