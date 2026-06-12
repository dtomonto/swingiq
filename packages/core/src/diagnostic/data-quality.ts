// ============================================================
// SwingVantage — Imported-session data quality (PURE)
// ------------------------------------------------------------
// Launch-monitor imports vary wildly: some exports carry the full club-delivery
// set, others are ball-flight only; some are 50 shots, some are 5. Video already
// has `visibilityQuality`; this gives LM sessions the equivalent honest signal.
//
// It scores the COMPLETENESS of an import (which of the key diagnostic fields
// are present) into a band + a confidence multiplier. Sample-size and
// shot-to-shot dispersion are ALREADY calibrated separately by the engine, so
// the confidence multiplier here is the completeness dimension ONLY — we never
// double-penalize. The band is a holistic display label (shots + completeness +
// whether consistency is even measurable). Pure + deterministic.
// ============================================================

import type { SessionStats } from './rules';

export type DataQualityBand = 'excellent' | 'good' | 'limited' | 'poor';

export interface ImportDataQuality {
  band: DataQualityBand;
  /** Holistic 0–100 display score (shots + completeness + dispersion presence). */
  score: number;
  /** Fraction of key diagnostic fields present (0–1). */
  completeness: number;
  /** 0.7–1.0 multiplier applied to diagnosis confidence (completeness ONLY). */
  completenessFactor: number;
  /** Honest, human-readable reasons behind the band. */
  reasons: string[];
}

/** The fields the diagnostic rules actually lean on. Their presence = a
 *  complete, diagnosable import; their absence = thin data to not over-trust. */
const KEY_FIELDS: (keyof SessionStats)[] = [
  'avg_face_to_path', 'avg_club_path', 'avg_face_angle', 'avg_attack_angle',
  'avg_spin_axis', 'avg_lateral_offline', 'avg_launch_angle', 'avg_spin_rate',
  'avg_carry', 'avg_ball_speed',
];

const DISPERSION_FIELDS: (keyof SessionStats)[] = [
  'face_to_path_std_dev', 'club_path_std_dev', 'carry_std_dev',
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function ramp(v: number, lo: number, hi: number): number {
  return clamp((v - lo) / (hi - lo), 0, 1);
}

/** Score an imported session's data quality. Pure + deterministic. */
export function computeImportQuality(stats: SessionStats): ImportDataQuality {
  const present = KEY_FIELDS.filter((f) => stats[f] !== undefined).length;
  const completeness = present / KEY_FIELDS.length;
  const hasDispersion = DISPERSION_FIELDS.some((f) => stats[f] !== undefined);
  const shots = stats.shot_count;

  const reasons: string[] = [];
  if (shots < 10) reasons.push(`Only ${shots} shot${shots === 1 ? '' : 's'} — small sample.`);
  if (completeness < 0.5) reasons.push(`Missing ${KEY_FIELDS.length - present} of ${KEY_FIELDS.length} key data fields.`);
  else if (completeness < 0.8) reasons.push(`Some key fields missing (${present}/${KEY_FIELDS.length} present).`);
  if (!hasDispersion) reasons.push('No shot-to-shot dispersion (std-dev) data — consistency can’t be measured.');

  // Holistic 0–100 display score.
  const score = Math.round(ramp(shots, 3, 30) * 40 + completeness * 45 + (hasDispersion ? 15 : 0));
  const band: DataQualityBand =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 35 ? 'limited' : 'poor';

  // Confidence multiplier = completeness ONLY. Full trust (1.0) once the import
  // is "complete enough" (≥85% of key fields), ramping down to 0.7 for a
  // genuinely thin (≤40%) import. A mostly-complete export is never penalized;
  // sample-size + dispersion are calibrated separately, so no double-counting.
  const completenessFactor = +(0.7 + 0.3 * ramp(completeness, 0.4, 0.85)).toFixed(3);

  if (reasons.length === 0) reasons.push('Complete, well-sampled import.');

  return { band, score, completeness: +completeness.toFixed(2), completenessFactor, reasons };
}
