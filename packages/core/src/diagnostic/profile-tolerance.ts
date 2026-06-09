// ============================================================
// SwingVantage — Profile-relative diagnosis (recommendation #13)
// ------------------------------------------------------------
// The diagnostic rules detect a fault against absolute (near-tour) windows.
// But a beginner's +4° face-to-path is *expected* for their level, while the
// same +4° for an elite player is a clear priority. This pure layer re-weights
// each diagnosis by how far OUTSIDE the player's OWN level the driving metric
// is — so we coach against your level, not tour standards.
//
// It does NOT rewrite the rules or the diagnosis: it annotates each with a
// profile-relative severity + a relevance factor the caller can use to re-rank
// or soften copy. Skill levels match the grading profile ids in apps/web.
// Deterministic + side-effect-free.
// ============================================================

import type { DiagnosticResult } from './engine';
import type { DiagnosisCategory } from '../types';

export type GolfSkillLevel =
  | 'beginner'
  | 'developing'
  | 'intermediate'
  | 'advanced'
  | 'competitive'
  | 'elite'
  | 'professional';

export interface MetricTolerance {
  /** ± acceptable face-to-path for this level (°). */
  faceToPath: number;
  /** ± acceptable club path for this level (°). */
  clubPath: number;
}

/**
 * Per-level "what's normal at your stage" windows for the two primary drivers.
 * Tighten roughly linearly from Beginner → Professional. A delivery inside the
 * window is expected for that level and should not be flagged as a hard priority.
 */
export const PROFILE_TOLERANCES: Record<GolfSkillLevel, MetricTolerance> = {
  beginner: { faceToPath: 6.0, clubPath: 6.0 },
  developing: { faceToPath: 5.0, clubPath: 5.0 },
  intermediate: { faceToPath: 4.0, clubPath: 4.0 },
  advanced: { faceToPath: 3.0, clubPath: 3.0 },
  competitive: { faceToPath: 2.5, clubPath: 2.5 },
  elite: { faceToPath: 2.0, clubPath: 2.0 },
  professional: { faceToPath: 1.5, clubPath: 1.5 },
};

export type RelativeSeverity = 'within_expected' | 'slightly_outside' | 'outside' | 'well_outside';

export interface ProfileRelativeDiagnosis {
  id: DiagnosisCategory;
  name: string;
  /** The single-session confidence (unchanged). */
  confidence: number;
  /** Which metric governs the profile comparison, or null when none applies. */
  metric: 'face_to_path' | 'club_path' | null;
  /** The session-average value of that metric (°), or null. */
  value: number | null;
  /** The player's tolerance for that metric at their level (°), or null. */
  tolerance: number | null;
  /** |value| / tolerance. ≤1 ⇒ within the level's expected window. */
  exceedance: number | null;
  relativeSeverity: RelativeSeverity;
  /**
   * Re-rank weight (~0.6 within-expected → ~1.3 well-outside) the caller may
   * apply to confidence/priority so faults that are normal for the player's
   * level are softened and genuine outliers are surfaced.
   */
  relevanceFactor: number;
  note: string;
}

export interface ProfileRelativeAssessment {
  level: GolfSkillLevel;
  items: ProfileRelativeDiagnosis[];
}

const SEVERITY_BANDS: { max: number; severity: RelativeSeverity; factor: number }[] = [
  { max: 1.0, severity: 'within_expected', factor: 0.6 },
  { max: 1.5, severity: 'slightly_outside', factor: 0.9 },
  { max: 2.5, severity: 'outside', factor: 1.15 },
  { max: Infinity, severity: 'well_outside', factor: 1.3 },
];

const LEVEL_LABEL: Record<GolfSkillLevel, string> = {
  beginner: 'a beginner',
  developing: 'a developing player',
  intermediate: 'an intermediate player',
  advanced: 'an advanced player',
  competitive: 'a competitive player',
  elite: 'an elite player',
  professional: 'a professional',
};

function bandFor(exceedance: number) {
  return SEVERITY_BANDS.find((b) => exceedance <= b.max)!;
}

/** Re-weight each diagnosis by how far outside the player's own level it sits. */
export function relativizeDiagnoses(
  result: DiagnosticResult,
  level: GolfSkillLevel,
): ProfileRelativeAssessment {
  const tol = PROFILE_TOLERANCES[level];

  const items: ProfileRelativeDiagnosis[] = result.diagnoses.map((d) => {
    const ftp = d.stats?.avg_face_to_path;
    const path = d.stats?.avg_club_path;

    // Governing metric = whichever driver is most exceeded relative to its
    // level tolerance. Strike/equipment faults with neither stat get a neutral
    // (1.0) factor so we never accidentally soften a real non-swing problem.
    const candidates: { metric: 'face_to_path' | 'club_path'; value: number; tolerance: number }[] = [];
    if (ftp !== undefined) candidates.push({ metric: 'face_to_path', value: ftp, tolerance: tol.faceToPath });
    if (path !== undefined) candidates.push({ metric: 'club_path', value: path, tolerance: tol.clubPath });

    if (candidates.length === 0) {
      return {
        id: d.rule.id, name: d.rule.name, confidence: d.confidence,
        metric: null, value: null, tolerance: null, exceedance: null,
        relativeSeverity: 'outside', relevanceFactor: 1.0,
        note: 'No swing-delivery metric available to compare against your level.',
      };
    }

    const governing = candidates.reduce((a, b) =>
      Math.abs(b.value) / b.tolerance > Math.abs(a.value) / a.tolerance ? b : a,
    );
    const exceedance = Math.abs(governing.value) / governing.tolerance;
    const band = bandFor(exceedance);
    const within = band.severity === 'within_expected';
    const metricLabel = governing.metric === 'face_to_path' ? 'face-to-path' : 'club path';

    const note = within
      ? `${governing.value.toFixed(1)}° ${metricLabel} is within the expected window for ${LEVEL_LABEL[level]} (±${governing.tolerance}°) — keep building, not a hard priority yet.`
      : `${governing.value.toFixed(1)}° ${metricLabel} is ${exceedance.toFixed(1)}× ${LEVEL_LABEL[level]}'s expected ±${governing.tolerance}° — ${band.severity === 'well_outside' ? 'a clear priority.' : 'worth addressing.'}`;

    return {
      id: d.rule.id, name: d.rule.name, confidence: d.confidence,
      metric: governing.metric, value: governing.value, tolerance: governing.tolerance,
      exceedance, relativeSeverity: band.severity, relevanceFactor: band.factor, note,
    };
  });

  return { level, items };
}

/** Profile-relative, relevance-weighted confidence (clamped 0–100). Caller opt-in. */
export function profileRelativeConfidence(item: ProfileRelativeDiagnosis): number {
  return Math.round(Math.max(0, Math.min(100, item.confidence * item.relevanceFactor)));
}
