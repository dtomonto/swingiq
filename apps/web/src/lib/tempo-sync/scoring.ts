// ============================================================
// SwingVantage — Tempo Sync: rhythm scoring (pure)
// ------------------------------------------------------------
// Turns a list of signed timing errors (ms between the athlete's tap and
// the target Strike beat; negative = early, positive = late) into an
// honest accuracy score + tendency. Pure + unit-tested. The errors
// themselves are captured against the Web Audio clock in the metronome
// hook — this just grades them.
// ============================================================

export interface RhythmScore {
  /** Number of scored taps. */
  taps: number;
  /** Mean absolute timing error (ms). */
  avgErrorMs: number;
  /** Signed mean error (ms): negative = consistently early, positive = late. */
  tendencyMs: number;
  /** Largest single absolute error (ms). */
  worstErrorMs: number;
  /** 0–100 accuracy. */
  accuracy: number;
  grade: 'A' | 'B' | 'C' | 'D';
  note: string;
}

/** A tap landing this far from the beat (ms) scores ~0; on the beat scores 100. */
export const SCORE_TOLERANCE_MS = 250;
/** Within this signed error we treat timing as "on the beat", not early/late. */
const TENDENCY_DEADBAND_MS = 35;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function gradeFor(accuracy: number): RhythmScore['grade'] {
  if (accuracy >= 90) return 'A';
  if (accuracy >= 75) return 'B';
  if (accuracy >= 55) return 'C';
  return 'D';
}

function noteFor(accuracy: number, tendencyMs: number): string {
  if (accuracy >= 90) return 'Locked in — your strike is right on the beat.';
  if (tendencyMs > TENDENCY_DEADBAND_MS) {
    return 'You tend to arrive late — start your downswing a hair sooner so the strike lands on the beat.';
  }
  if (tendencyMs < -TENDENCY_DEADBAND_MS) {
    return 'You tend to arrive early — let the beat come to you; trust the transition.';
  }
  return 'Close and even — tighten the spread to lock it in.';
}

/** Grade a set of signed timing errors. Returns null with no taps yet. */
export function scoreRhythm(errorsMs: number[]): RhythmScore | null {
  if (!errorsMs.length) return null;
  const abs = errorsMs.map((e) => Math.abs(e));
  const avgErrorMs = Math.round(mean(abs));
  const tendencyMs = Math.round(mean(errorsMs));
  const worstErrorMs = Math.round(Math.max(...abs));
  const accuracy = clamp(Math.round(100 * (1 - avgErrorMs / SCORE_TOLERANCE_MS)), 0, 100);
  return {
    taps: errorsMs.length,
    avgErrorMs,
    tendencyMs,
    worstErrorMs,
    accuracy,
    grade: gradeFor(accuracy),
    note: noteFor(accuracy, tendencyMs),
  };
}
