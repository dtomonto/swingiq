// ============================================================
// SwingVantage — Tempo Sync: pure tempo math
// ------------------------------------------------------------
// Presets, timing math, beat schedules, verdicts, and the bridge that
// syncs the trainer to a real Motion Lab temporal read. Pure + unit
// tested in __tests__/tempo-sync.test.ts. No DOM, no audio, no fabricated
// numbers — when we sync we pass the athlete's measured values through.
// ============================================================

import type { TemporalIntelligence } from '@/lib/motion-lab';
import type {
  TempoPreset,
  TempoTiming,
  TempoBeat,
  TempoVerdict,
  TempoSyncResult,
} from './types';

/** Reference capture rate the frame-count presets are expressed in. */
export const REFERENCE_FPS = 30;

/** The full-swing rhythm coaches converge on. */
export const IDEAL_FULL_RATIO = 3;
/** Putting / chipping tends to run nearer a 2:1 rhythm. */
export const IDEAL_PUTT_RATIO = 2;

/** Speed slider bounds (% of a preset's base speed). */
export const MIN_TEMPO_PCT = 70;
export const MAX_TEMPO_PCT = 130;

export function framesToMs(frames: number): number {
  return (frames / REFERENCE_FPS) * 1000;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round(n: number): number {
  return Math.round(n);
}

// ── Presets ───────────────────────────────────────────────────
// All full-swing presets hold the 3:1 ratio; the frame count sets the
// speed. These mirror the canonical Tour-Tempo numbers (27/9 … 18/6),
// plus a slower-transition putting rhythm at 2:1.
export const FULL_SWING_PRESETS: TempoPreset[] = [
  {
    id: 'smooth-27-9',
    label: 'Smooth',
    sport: 'golf',
    description: 'A slow, unhurried 3:1 — ideal for grooving the feel before adding speed.',
    backFrames: 27,
    downFrames: 9,
  },
  {
    id: 'balanced-24-8',
    label: 'Balanced',
    sport: 'golf',
    description: 'A relaxed, repeatable full-swing 3:1 that suits most amateurs.',
    backFrames: 24,
    downFrames: 8,
  },
  {
    id: 'tour-21-7',
    label: 'Tour',
    sport: 'golf',
    description: 'The signature 3:1 tour rhythm — 21 frames back, 7 down at 30fps.',
    backFrames: 21,
    downFrames: 7,
  },
  {
    id: 'quick-18-6',
    label: 'Quick',
    sport: 'golf',
    description: 'A faster 3:1 for athletic, aggressive swings — keep the ratio honest.',
    backFrames: 18,
    downFrames: 6,
  },
];

export const PUTT_PRESET: TempoPreset = {
  id: 'putt-18-9',
  label: 'Putting',
  sport: 'golf-putt',
  description: 'A 2:1 stroke rhythm for putting and short chips — steadier through the ball.',
  backFrames: 18,
  downFrames: 9,
};

/** Every preset the trainer offers, in display order. */
export const TEMPO_PRESETS: TempoPreset[] = [...FULL_SWING_PRESETS, PUTT_PRESET];

export const DEFAULT_PRESET_ID = 'tour-21-7';

export function getPreset(id: string): TempoPreset {
  return TEMPO_PRESETS.find((p) => p.id === id) ?? FULL_SWING_PRESETS[2];
}

export function idealRatioForPreset(preset: TempoPreset): number {
  return preset.sport === 'golf-putt' ? IDEAL_PUTT_RATIO : IDEAL_FULL_RATIO;
}

// ── Timing ────────────────────────────────────────────────────
export function presetTiming(preset: TempoPreset): TempoTiming {
  const backMs = framesToMs(preset.backFrames);
  const downMs = framesToMs(preset.downFrames);
  return {
    backMs,
    downMs,
    totalMs: backMs + downMs,
    ratio: +(preset.backFrames / preset.downFrames).toFixed(2),
  };
}

/** Build a timing from an explicit total duration + back:through ratio. */
export function customTiming(totalMs: number, ratio: number): TempoTiming {
  const safeTotal = Math.max(1, totalMs);
  const safeRatio = Math.max(0.1, ratio);
  const downMs = safeTotal / (safeRatio + 1);
  const backMs = safeTotal - downMs;
  return { backMs, downMs, totalMs: safeTotal, ratio: +safeRatio.toFixed(2) };
}

/**
 * Scale a timing to a % of its base speed, preserving the ratio.
 * 100% = base; >100% = faster (shorter); <100% = slower (longer).
 */
export function scaleTiming(timing: TempoTiming, tempoPct: number): TempoTiming {
  const pct = clamp(tempoPct, MIN_TEMPO_PCT, MAX_TEMPO_PCT);
  const factor = 100 / pct; // faster → shorter durations
  return {
    backMs: timing.backMs * factor,
    downMs: timing.downMs * factor,
    totalMs: timing.totalMs * factor,
    ratio: timing.ratio,
  };
}

/** Ordered cue schedule for one rep, timed from the takeaway. */
export function beatSchedule(timing: TempoTiming): TempoBeat[] {
  return [
    { kind: 'takeaway', at: 0, label: 'Set' },
    { kind: 'top', at: timing.backMs, label: 'Top' },
    { kind: 'impact', at: timing.totalMs, label: 'Strike' },
  ];
}

// ── Verdicts ──────────────────────────────────────────────────
const RATIO_TOLERANCE = 0.6;

export function tempoVerdict(ratio: number, idealRatio = IDEAL_FULL_RATIO): TempoVerdict {
  if (ratio < idealRatio - RATIO_TOLERANCE) {
    return {
      id: 'rushed',
      label: 'Rushed transition',
      detail: `Your downswing is quick relative to your backswing (about ${ratio.toFixed(1)}:1 vs an ideal ${idealRatio}:1). Let the change of direction breathe — a smoother top adds speed at the ball, not before it.`,
      tone: 'rushed',
    };
  }
  if (ratio > idealRatio + RATIO_TOLERANCE) {
    return {
      id: 'loose',
      label: 'Loose, drifty tempo',
      detail: `Your backswing is long relative to the downswing (about ${ratio.toFixed(1)}:1 vs an ideal ${idealRatio}:1). Commit to the strike — a touch more pace through the ball tightens the rhythm.`,
      tone: 'loose',
    };
  }
  return {
    id: 'smooth',
    label: 'Smooth, on-rhythm',
    detail: `Your tempo sits right around the ideal ${idealRatio}:1. Groove it so it repeats under pressure.`,
    tone: 'smooth',
  };
}

/** Pick the full-swing preset whose total duration is closest to a measured one. */
export function nearestFullSwingPreset(totalMs: number): TempoPreset {
  let best = FULL_SWING_PRESETS[0];
  let bestGap = Infinity;
  for (const p of FULL_SWING_PRESETS) {
    const gap = Math.abs(presetTiming(p).totalMs - totalMs);
    if (gap < bestGap) {
      bestGap = gap;
      best = p;
    }
  }
  return best;
}

// ── Sync to a real, measured swing ────────────────────────────
/**
 * Bridge a Motion Lab temporal read into a tempo target. Returns null when
 * the clip wasn't timeable. Recommends a preset that keeps the athlete's
 * own swing SPEED but grooves the ideal 3:1 RATIO — fix the rhythm, not the
 * tempo they're comfortable with.
 */
export function syncFromTemporal(t: TemporalIntelligence): TempoSyncResult | null {
  if (t.tempoRatio == null || !(t.totalMs > 0)) return null;
  const measuredRatio = t.tempoRatio;
  const measuredBackMs = t.loadDurationMs;
  const measuredThroughMs =
    measuredBackMs != null ? Math.max(0, t.totalMs - measuredBackMs) : null;
  const idealRatio = IDEAL_FULL_RATIO;
  return {
    measuredRatio,
    measuredBackMs,
    measuredThroughMs,
    measuredTotalMs: t.totalMs,
    idealRatio,
    verdict: tempoVerdict(measuredRatio, idealRatio),
    recommended: nearestFullSwingPreset(t.totalMs),
    confidence: clamp(t.confidence, 0, 1),
  };
}

/** Human-readable beats-per-minute feel of a timing (full cycle incl. rest). */
export function repsPerMinute(timing: TempoTiming, restMs: number): number {
  const cycle = timing.totalMs + Math.max(0, restMs);
  return cycle > 0 ? round(60000 / cycle) : 0;
}

export { round as roundMs };
