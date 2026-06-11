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
      <p className="text-sm text-gray-400">
        No MotionLab sessions are stored on this device yet. Analyses are saved locally (never on a server),
        so this queue reflects only this browser. Run an analysis in the{' '}
        <Link href="/motion-lab" className="text-amber-400 hover:underline">Motion Lab</Link> to populate it.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span><b className="text-gray-200">{all.length}</b> stored</span>
        <span><b className="text-amber-400">{lowConfidence.length}</b> low confidence</span>
        <span><b className="text-red-400">{poorQuality.length}</b> poor camera angle</span>
      </div>

      {lowConfidence.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          No low-confidence analyses on this device — every stored session cleared the {Math.round(LOW_CONFIDENCE * 100)}% bar.
        </p>
      ) : (
        <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800">
          {lowConfidence.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3">
              <span className="text-lg" aria-hidden>{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-100">
                  {s.sportLabel} · {s.motionLabel}
                </p>
                <p className="truncate text-xs text-gray-500">{s.keyFault}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.quality.verdict === 'poor' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                    <Camera className="h-3 w-3" /> {s.quality.verdict}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  <AlertTriangle className="h-3 w-3" /> {Math.round(s.scoreboard.confidence * 100)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-gray-500">
        Confidence is the mean per-metric confidence from single-camera pose — a directional estimate, not a lab
        measurement. Low values usually mean a poor camera angle, occluded body, or a clip that is too short.
      </p>
    </div>
  );
}
