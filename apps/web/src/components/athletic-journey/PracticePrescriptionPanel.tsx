'use client';

// ============================================================
// SwingVantage — Athletic Journey: practice prescription panel
// ------------------------------------------------------------
// The stage- and weakness-aware weekly plan: ordered blocks, an
// on-course/match objective, the next upload, a retest, and an
// injury-aware safety note when relevant.
// ============================================================

import { useEffect } from 'react';
import { Dumbbell, Upload, RotateCcw, ShieldAlert, Target } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import type { PracticePrescription } from '@/lib/athletic-journey';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function PracticePrescriptionPanel({
  sport,
  prescription,
}: {
  sport: SportId;
  prescription: PracticePrescription;
}) {
  useEffect(() => {
    track(ANALYTICS_EVENTS.JOURNEY_PRACTICE_VIEWED, { sport, stage_code: prescription.stageCode });
  }, [sport, prescription.stageCode]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground">{prescription.headline}</p>

      <ol className="space-y-3">
        {prescription.blocks.map((block, i) => (
          <li key={block.id} className="rounded-theme border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              {block.category === 'scoring' && i === prescription.blocks.length - 1 ? (
                <Target size={15} className="text-primary" aria-hidden="true" />
              ) : (
                <Dumbbell size={15} className="text-primary" aria-hidden="true" />
              )}
              <span className="text-sm font-semibold text-foreground">{block.title}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{block.frequency}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{block.rationale}</p>
            <ul className="mt-2 space-y-0.5">
              {block.drills.map((d, j) => (
                <li key={j} className="text-xs text-foreground/90 flex gap-1.5">
                  <span className="text-primary mt-px">›</span> {d}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground/80">Proof it worked:</span> {block.proofMetric}
            </p>
          </li>
        ))}
      </ol>

      <div className="grid gap-2 sm:grid-cols-2">
        {prescription.uploadRequest && (
          <div className="flex items-start gap-2 rounded-theme border border-border p-2.5">
            <Upload size={15} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
            <span className="text-xs text-foreground">
              <span className="block font-medium">Upload next</span>
              <span className="text-muted-foreground">{prescription.uploadRequest}</span>
            </span>
          </div>
        )}
        {prescription.retest && (
          <div className="flex items-start gap-2 rounded-theme border border-border p-2.5">
            <RotateCcw size={15} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
            <span className="text-xs text-foreground">
              <span className="block font-medium">Retest</span>
              <span className="text-muted-foreground">{prescription.retest}</span>
            </span>
          </div>
        )}
      </div>

      {prescription.safetyNote && (
        <div className="flex items-start gap-2 rounded-theme border border-warning/30 bg-warning/10 p-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-xs text-foreground leading-relaxed">{prescription.safetyNote}</p>
        </div>
      )}
    </div>
  );
}
