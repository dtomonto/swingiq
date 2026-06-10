// ============================================================
// SwingVantage — Tempo Sync: types
// ------------------------------------------------------------
// Tempo Sync is an audio-visual swing-tempo trainer. It plays three
// cues per rep — takeaway → top → strike — spaced to a back:through
// time ratio (the classic ~3:1 full-swing rhythm). The math here is
// pure and unit-tested; audio lives in the React hook, UI in the
// component.
//
// Grounded in the well-known "tempo as a frame-count ratio" coaching
// model (e.g. 21 frames back : 7 frames down at 30fps = 3:1). Nothing
// is fabricated — when we sync to a real swing we carry the measured
// numbers and confidence straight through.
// ============================================================

export type TempoSport = 'golf' | 'golf-putt';

/**
 * A tempo target expressed as a frame count (at REFERENCE_FPS) for the
 * backswing and the downswing — the Tour-Tempo style of describing rhythm.
 * The frame counts set BOTH the ratio (back:down) and the absolute speed.
 */
export interface TempoPreset {
  id: string;
  label: string;
  sport: TempoSport;
  description: string;
  /** Backswing length in frames at REFERENCE_FPS. */
  backFrames: number;
  /** Downswing length in frames at REFERENCE_FPS. */
  downFrames: number;
}

/** Concrete millisecond timing for one rep. */
export interface TempoTiming {
  /** Takeaway → top of backswing. */
  backMs: number;
  /** Top → strike. */
  downMs: number;
  /** Takeaway → strike. */
  totalMs: number;
  /** back:through ratio, e.g. 3 for a 3:1 rhythm. */
  ratio: number;
}

export type TempoBeatKind = 'takeaway' | 'top' | 'impact';

/** One audible/visual cue inside a rep, timed from the takeaway. */
export interface TempoBeat {
  kind: TempoBeatKind;
  /** Milliseconds from the start of the rep. */
  at: number;
  label: string;
}

export type TempoTone = 'rushed' | 'smooth' | 'loose';

/** Plain-language read on a measured tempo ratio vs the ideal. */
export interface TempoVerdict {
  id: string;
  label: string;
  detail: string;
  tone: TempoTone;
}

/**
 * Result of syncing the trainer to a real, measured swing. Carries the
 * athlete's actual numbers (never fabricated) plus a recommended preset
 * that keeps their natural speed but grooves the ideal ratio.
 */
export interface TempoSyncResult {
  measuredRatio: number;
  measuredBackMs: number | null;
  measuredThroughMs: number | null;
  measuredTotalMs: number;
  idealRatio: number;
  verdict: TempoVerdict;
  /** Preset whose total duration is nearest the athlete's — at the ideal ratio. */
  recommended: TempoPreset;
  /** Tracking confidence carried through from the motion read (0–1). */
  confidence: number;
}
