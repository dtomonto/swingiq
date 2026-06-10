// ============================================================
// SwingVantage — RecordAssist: AutoTrimEngine (motion-event detection)
// ------------------------------------------------------------
// Given a series of per-frame motion-energy samples captured during
// recording, find the active-motion window (the actual swing/serve/throw)
// so analysis can concentrate on it and skip the dead time before and
// after. Pure + deterministic — the energy signal is the only input.
// ============================================================

export interface MotionSample {
  /** Milliseconds from the start of recording. */
  tMs: number;
  /** Motion energy 0..∞ (normalized joint displacement between frames). */
  energy: number;
}

export interface TrimWindow {
  startMs: number;
  endMs: number;
}

export interface AutoTrimOptions {
  /** Fraction of peak energy that counts as "moving" (default 0.25). */
  threshold?: number;
  /** Padding kept on each side of the active window, ms (default 300). */
  paddingMs?: number;
  /** Minimum active window worth trimming to, ms (default 500). */
  minWindowMs?: number;
}

const DEFAULTS: Required<AutoTrimOptions> = {
  threshold: 0.25,
  paddingMs: 300,
  minWindowMs: 500,
};

/**
 * Detect the active-motion window. Returns null when there isn't enough
 * signal, or when the motion already spans essentially the whole clip (so
 * trimming would gain nothing — honest no-op rather than a fake trim).
 */
export function detectMotionWindow(
  samples: MotionSample[],
  totalMs: number,
  options: AutoTrimOptions = {},
): TrimWindow | null {
  const opts = { ...DEFAULTS, ...options };
  if (samples.length < 4 || totalMs <= 0) return null;

  const peak = samples.reduce((m, s) => Math.max(m, s.energy), 0);
  if (peak <= 0) return null;

  const cutoff = peak * opts.threshold;
  const active = samples.filter((s) => s.energy >= cutoff);
  if (active.length === 0) return null;

  let startMs = Math.max(0, active[0].tMs - opts.paddingMs);
  let endMs = Math.min(totalMs, active[active.length - 1].tMs + opts.paddingMs);

  // Clamp to sane order + minimum window.
  if (endMs - startMs < opts.minWindowMs) {
    const mid = (startMs + endMs) / 2;
    startMs = Math.max(0, mid - opts.minWindowMs / 2);
    endMs = Math.min(totalMs, mid + opts.minWindowMs / 2);
  }

  // If the window covers (almost) the whole clip, there's nothing to trim.
  const trimmed = startMs + (totalMs - endMs);
  if (trimmed < opts.paddingMs) return null;

  return { startMs: Math.round(startMs), endMs: Math.round(endMs) };
}

/** Convenience: window in seconds, or null. */
export function detectMotionWindowSeconds(
  samples: MotionSample[],
  totalMs: number,
  options?: AutoTrimOptions,
): { start: number; end: number } | null {
  const w = detectMotionWindow(samples, totalMs, options);
  if (!w) return null;
  return { start: w.startMs / 1000, end: w.endMs / 1000 };
}
