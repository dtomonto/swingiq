// ============================================================
// SwingVantage — Multi-session fault consistency (pure)
// ------------------------------------------------------------
// Distinguishes a CONSISTENT, recurring fault from a one-off blip, and turns
// that into a confidence/ranking multiplier:
//   • A fault confirmed across many sessions (esp. the latest) is more
//     trustworthy than a single read → modest BOOST.
//   • A fault seen once, a while ago, is likely noise → DAMPEN it so it can't
//     top the priority list (the false-positive guard).
// Honest: a brand-new finding is neither boosted nor punished — it's just "new,
// re-check." Boost is capped so a recurring fault can't be over-claimed.
// ============================================================

export type FaultPattern = 'new' | 'one-off' | 'intermittent' | 'recurring' | 'persistent';

export interface ConsistencyResult {
  pattern: FaultPattern;
  /** occurrences / totalSessions, 0..1. */
  hitRate: number;
  /** Multiplier applied to confidence + ranking score. */
  factor: number;
  /** Plain-language explanation for the athlete. */
  note: string;
}

export interface ConsistencyInput {
  /** How many sessions this fault appeared in. */
  occurrences: number;
  /** Total sessions in the window. */
  totalSessions: number;
  /** Present in the most recent session. */
  inLatest: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Classify how consistently a fault recurs, and how to weight it. */
export function classifyFaultConsistency({ occurrences, totalSessions, inLatest }: ConsistencyInput): ConsistencyResult {
  const total = Math.max(1, totalSessions);
  const hitRate = round2(Math.min(occurrences, total) / total);

  // Not enough history to confirm any pattern yet.
  if (total <= 1) {
    return { pattern: 'new', hitRate, factor: 1, note: 'First session — not enough history to confirm a pattern yet.' };
  }

  if (occurrences <= 1) {
    if (inLatest) {
      return { pattern: 'new', hitRate, factor: 1, note: 'New this session — re-check next time to see if it’s a real pattern.' };
    }
    return { pattern: 'one-off', hitRate, factor: 0.8, note: 'Seen once and not recently — likely a one-off, not a pattern.' };
  }

  if (hitRate >= 0.6 && inLatest) {
    return {
      pattern: 'persistent',
      hitRate,
      factor: 1.1,
      note: `Seen in ${occurrences} of ${total} sessions, including your latest — a consistent pattern worth prioritizing.`,
    };
  }

  if (inLatest || hitRate >= 0.4) {
    return {
      pattern: 'recurring',
      hitRate,
      factor: 1,
      note: `Recurs across ${occurrences} of ${total} sessions — a real pattern, not noise.`,
    };
  }

  return {
    pattern: 'intermittent',
    hitRate,
    factor: 0.9,
    note: `Comes and goes (${occurrences} of ${total} sessions) and not in your latest — keep an eye on it.`,
  };
}

/** Apply the consistency factor to a 0–100 confidence, clamped. */
export function adjustConfidence(base: number, factor: number): number {
  return Math.max(0, Math.min(100, Math.round(base * factor)));
}

/** Short label for the pattern (for an evidence chip / badge). */
export function patternLabel(pattern: FaultPattern): string {
  switch (pattern) {
    case 'persistent': return 'Consistent pattern';
    case 'recurring': return 'Recurring';
    case 'intermittent': return 'Intermittent';
    case 'one-off': return 'One-off';
    case 'new': return 'New';
  }
}
