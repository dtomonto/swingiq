// ============================================================
// SwingVantage — AGI: Readiness mapper (pure)
// ------------------------------------------------------------
// Pure conversion from the readiness engine's TransparentScore into the AGI
// ReadinessSnapshot. Kept free of any React/hook imports so it stays unit-
// testable on its own; the client hook lives in ./readiness.
// ============================================================

import type { TransparentScore } from '@/lib/readiness';
import type { ReadinessSnapshot } from '../types';

export function readinessFromScore(score: TransparentScore): ReadinessSnapshot {
  const drivers = [...score.factors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((f) => ({ label: f.label, contribution: f.contribution }));

  return {
    score: score.score,
    band: score.band,
    headline: score.headline,
    drivers,
    caution: score.caution,
    basis: score.basis,
  };
}
