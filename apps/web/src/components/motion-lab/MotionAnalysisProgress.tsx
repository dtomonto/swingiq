'use client';

// ============================================================
// SwingVantage — Motion Lab: Analysis Progress
// ============================================================

import { Check, Loader2 } from 'lucide-react';
import type { MotionStage } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';

const STAGES: Array<{ id: MotionStage; label: string }> = [
  { id: 'extracting', label: 'Extracting frames from your video' },
  { id: 'detecting', label: 'Detecting body landmarks (on-device)' },
  { id: 'reconstructing', label: 'Reconstructing the 3D motion estimate' },
  { id: 'segmenting', label: 'Segmenting the motion into phases' },
  { id: 'metrics', label: 'Calculating biomechanical metrics' },
  { id: 'report', label: 'Building your coaching report' },
  { id: 'rendering', label: 'Rendering 3D playback' },
];

export function MotionAnalysisProgress({ stage }: { stage: MotionStage }) {
  const activeIndex = STAGES.findIndex((s) => s.id === stage);
  return (
    <div className="max-w-md mx-auto space-y-2">
      {STAGES.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div
            key={s.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
              active ? 'bg-primary/10' : done ? 'opacity-70' : 'opacity-40',
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              done ? 'bg-success/20 text-success' : active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {done ? <Check className="w-3.5 h-3.5" /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-3xs">{i + 1}</span>}
            </div>
            <span className={cn('text-sm', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>{s.label}</span>
          </div>
        );
      })}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Everything runs in your browser. Your video never leaves this device.
      </p>
    </div>
  );
}
