'use client';

// ============================================================
// SwingIQ — AI Analysis Progress
// Honest, staged progress that mirrors the real pipeline:
// prepare -> extract frames -> AI inspection -> diagnosis -> plan.
// The copy never overclaims; each step maps to actual work.
// ============================================================

import { Loader2, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnalysisStage =
  | 'preparing'
  | 'extracting'
  | 'measuring'
  | 'inspecting'
  | 'building'
  | 'plan'
  | 'done';

const STAGES: { id: AnalysisStage; label: string; detail: string }[] = [
  { id: 'preparing', label: 'Preparing your video', detail: 'Reading the clip in your browser' },
  { id: 'extracting', label: 'Extracting key frames', detail: 'Sampling the full motion as still images' },
  { id: 'measuring', label: 'Measuring body positions', detail: 'On-device pose detection (stays on your device)' },
  { id: 'inspecting', label: 'Inspecting mechanics with AI', detail: 'The AI vision model reviews each frame' },
  { id: 'building', label: 'Building your diagnosis', detail: 'Identifying evidence-based priorities' },
  { id: 'plan', label: 'Creating your practice plan', detail: 'Matching drills to what was seen' },
];

const ORDER: AnalysisStage[] = [
  'preparing',
  'extracting',
  'measuring',
  'inspecting',
  'building',
  'plan',
  'done',
];

export function AnalysisProgress({ stage }: { stage: AnalysisStage }) {
  const currentIndex = ORDER.indexOf(stage);

  return (
    <div className="max-w-md mx-auto" role="status" aria-live="polite">
      <ol className="space-y-3">
        {STAGES.map((s) => {
          const idx = ORDER.indexOf(s.id);
          const state = idx < currentIndex ? 'done' : idx === currentIndex ? 'active' : 'pending';
          return (
            <li key={s.id} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                {state === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : state === 'active' ? (
                  <Loader2 className="w-5 h-5 text-golf-fairway animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </span>
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    state === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-muted-foreground mt-6">
        Only still frames are sent for analysis — your original video never leaves this device.
      </p>
    </div>
  );
}
