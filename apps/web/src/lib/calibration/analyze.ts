// ============================================================
// SwingVantage — Confidence calibration (recommendation #16)
// ------------------------------------------------------------
// The diagnostic engine attaches a confidence to every diagnosis. This layer
// answers the empirical question that earns trust: when we say "80% confident",
// is the diagnosis actually right ~80% of the time?
//
// We record each surfaced diagnosis with its predicted confidence, then later
// resolve it (confirmed / refuted) from a retest or the player's own feedback.
// This PURE module turns those records into a calibration report. Storage lives
// in ./store (local-first). Deterministic + side-effect-free.
// ============================================================

/** Did the diagnosis turn out to be right? */
export type CalibrationOutcome = 'confirmed' | 'refuted' | 'inconclusive';

export interface CalibrationEntry {
  id: string;
  diagnosisId: string;
  diagnosisName: string;
  /** Confidence the engine reported when this diagnosis was surfaced (0–100). */
  predictedConfidence: number;
  sport: string;
  recordedAt: string;
  /** Resolved later from a retest / feedback; null while pending. */
  outcome: CalibrationOutcome | null;
  resolvedAt: string | null;
}

export interface CalibrationBand {
  label: string;
  min: number;
  max: number;
  /** Resolved (confirmed|refuted) entries in this band. */
  n: number;
  /** Mean predicted confidence of resolved entries in the band (0–1). */
  meanPredicted: number;
  /** Observed confirmation rate among resolved entries (0–1). */
  observedRate: number;
  /** observedRate − meanPredicted. Negative ⇒ overconfident in this band. */
  gap: number;
}

export type CalibrationReliability = 'well-calibrated' | 'fair' | 'poorly-calibrated' | 'insufficient';
export type CalibrationTendency = 'overconfident' | 'underconfident' | 'calibrated' | 'insufficient';

export interface CalibrationReport {
  bands: CalibrationBand[];
  totalResolved: number;
  totalPending: number;
  /** Mean |gap| weighted by band sample size (0–1); lower is better. */
  meanAbsGap: number;
  reliability: CalibrationReliability;
  tendency: CalibrationTendency;
}

const BAND_DEFS: { label: string; min: number; max: number }[] = [
  { label: '40–59%', min: 40, max: 59 },
  { label: '60–79%', min: 60, max: 79 },
  { label: '80–100%', min: 80, max: 100 },
];

/** Minimum resolved samples before we'll judge calibration at all. */
export const MIN_RESOLVED_FOR_REPORT = 10;

function isResolved(e: CalibrationEntry): e is CalibrationEntry & { outcome: 'confirmed' | 'refuted' } {
  return e.outcome === 'confirmed' || e.outcome === 'refuted';
}

/** Turn recorded + resolved calibration entries into a calibration report. */
export function computeCalibration(entries: CalibrationEntry[]): CalibrationReport {
  const resolved = entries.filter(isResolved);
  const totalPending = entries.length - resolved.length;

  const bands: CalibrationBand[] = BAND_DEFS.map((def) => {
    const inBand = resolved.filter((e) => e.predictedConfidence >= def.min && e.predictedConfidence <= def.max);
    const n = inBand.length;
    const meanPredicted = n === 0 ? 0 : inBand.reduce((s, e) => s + e.predictedConfidence, 0) / n / 100;
    const observedRate = n === 0 ? 0 : inBand.filter((e) => e.outcome === 'confirmed').length / n;
    return { ...def, n, meanPredicted, observedRate, gap: observedRate - meanPredicted };
  });

  const weighted = bands.filter((b) => b.n > 0);
  const totalResolved = resolved.length;
  const meanAbsGap =
    totalResolved === 0
      ? 0
      : weighted.reduce((s, b) => s + Math.abs(b.gap) * b.n, 0) / totalResolved;

  let reliability: CalibrationReliability;
  let tendency: CalibrationTendency;
  if (totalResolved < MIN_RESOLVED_FOR_REPORT) {
    reliability = 'insufficient';
    tendency = 'insufficient';
  } else {
    reliability = meanAbsGap <= 0.1 ? 'well-calibrated' : meanAbsGap <= 0.2 ? 'fair' : 'poorly-calibrated';
    // Signed mean gap: positive ⇒ confirmed more often than predicted (underconfident).
    const signedGap = weighted.reduce((s, b) => s + b.gap * b.n, 0) / totalResolved;
    tendency = signedGap > 0.05 ? 'underconfident' : signedGap < -0.05 ? 'overconfident' : 'calibrated';
  }

  return { bands, totalResolved, totalPending, meanAbsGap, reliability, tendency };
}
