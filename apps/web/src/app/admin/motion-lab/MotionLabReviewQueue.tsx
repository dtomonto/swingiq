'use client';

// ============================================================
// /admin/motion-lab — Low-confidence review queue (client island)
// ------------------------------------------------------------
// MotionLab analyses run on-device and persist locally (never on a
// server), so the operator review queue is computed in the browser
// from this device's stored sessions. It surfaces the analyses whose
// confidence fell below a usable bar — the ones a real CV pipeline
// would route to human review or a re-film prompt — plus the most
// common key faults by sport. Read-only; nothing is mutated.
// ============================================================

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Camera } from 'lucide-react';
import { useMotionSessions } from '@/lib/motion-lab';

const LOW_CONFIDENCE = 0.5; // below this, an analysis is worth a human look

export function MotionLabReviewQueue() {
  const all = useMotionSessions();

  const lowConfidence = useMemo(
    () =>
      all
        .filter((s) => s.scoreboard.confidence < LOW_CONFIDENCE || !s.quality.analyzable)
        .sort((a, b) => a.scoreboard.confidence - b.scoreboard.confidence),
    [all],
  );

  const poorQuality = useMemo(() => all.filter((s) => s.quality.verdict === 'poor'), [all]);

  if (all.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No MotionLab sessions are stored on this device yet. Analyses are saved locally (never on a server),
        so this queue reflects only this browser. Run an analysis in the{' '}
        <Link href="/motion-lab" className="text-link hover:underline">Motion Lab</Link> to populate it.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span><b className="text-foreground">{all.length}</b> stored</span>
        <span><b className="text-link">{lowConfidence.length}</b> low confidence</span>
        <span><b className="text-error-text">{poorQuality.length}</b> poor camera angle</span>
      </div>

      {lowConfidence.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 text-success-text" />
          No low-confidence analyses on this device — every stored session cleared the {Math.round(LOW_CONFIDENCE * 100)}% bar.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {lowConfidence.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3">
              <span className="text-lg" aria-hidden>{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {s.sportLabel} · {s.motionLabel}
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.keyFault}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.quality.verdict === 'poor' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-error/40 bg-error/10 px-2 py-0.5 text-[10px] font-medium text-error-text">
                    <Camera className="h-3 w-3" /> {s.quality.verdict}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-link">
                  <AlertTriangle className="h-3 w-3" /> {Math.round(s.scoreboard.confidence * 100)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Confidence is the mean per-metric confidence from single-camera pose — a directional estimate, not a lab
        measurement. Low values usually mean a poor camera angle, occluded body, or a clip that is too short.
      </p>
    </div>
  );
}
