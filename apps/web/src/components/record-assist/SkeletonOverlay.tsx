'use client';

import { cn } from '@/lib/utils';
import { LM } from '@/lib/record-assist/engines/landmarks';
import type { PoseSample } from '@/lib/record-assist/types';

// Bone connections (BlazePose) for a clean, readable stick figure.
const BONES: [number, number][] = [
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
];

const JOINTS = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
  LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
];

const VIS = 0.4;

export interface SkeletonOverlayProps {
  pose: PoseSample | null;
  className?: string;
}

/**
 * Live skeletal overlay (Phase 2 kinetic foundation). Draws the tracked
 * joints + bones over the preview. Confidence-aware: low-visibility joints
 * are not drawn, so we never imply tracking we don't have.
 */
export function SkeletonOverlay({ pose, className }: SkeletonOverlayProps) {
  const lm = pose?.landmarks;
  if (!lm || lm.length === 0) return null;

  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {BONES.map(([a, b], i) => {
        const p = lm[a];
        const q = lm[b];
        if (!p || !q || p.visibility < VIS || q.visibility < VIS) return null;
        return (
          <line
            key={i}
            x1={p.x * 100} y1={p.y * 100} x2={q.x * 100} y2={q.y * 100}
            className="stroke-primary/80"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        );
      })}
      {JOINTS.map((j) => {
        const p = lm[j];
        if (!p || p.visibility < VIS) return null;
        return <circle key={j} cx={p.x * 100} cy={p.y * 100} r="0.9" className="fill-white" />;
      })}
    </svg>
  );
}
