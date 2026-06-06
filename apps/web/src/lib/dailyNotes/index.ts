// ============================================================
// SwingVantage — Daily Notes: Public API (barrel)
// ------------------------------------------------------------
// "How did you play today?" capture that feeds the player profile.
// Import from '@/lib/dailyNotes'.
// ============================================================

import type { DailyNote, PlayFeel } from './types';

export * from './types';
export { extractFaultsFromText } from './extract';

/** Plain-language, non-clinical labels for the 1–5 "how did you play" scale. */
export const FEEL_LABELS: Record<PlayFeel, string> = {
  1: 'Rough',
  2: 'Off',
  3: 'Solid',
  4: 'Really good',
  5: 'Dialed in',
};

/** Short helper sub-text shown under each feel option. */
export const FEEL_HINTS: Record<PlayFeel, string> = {
  1: 'Nothing clicked',
  2: 'Below my best',
  3: 'A normal day',
  4: 'Better than usual',
  5: 'Everything working',
};

const FEEL_EMOJI: Record<PlayFeel, string> = {
  1: '😣',
  2: '😕',
  3: '🙂',
  4: '😄',
  5: '🔥',
};

export function feelEmoji(feel: PlayFeel): string {
  return FEEL_EMOJI[feel];
}

/**
 * Map a self-rated feel to an honest 0–100 score. This is a SELF-REPORT
 * (basis: user_entered), so it is intentionally coarse and is always
 * surfaced with low confidence downstream — it never poses as a measurement.
 */
export function feelToScore(feel: PlayFeel): number {
  return { 1: 25, 2: 42, 3: 60, 4: 75, 5: 90 }[feel];
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayISODate(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** A compact one-line summary of a note, for lists and the player profile. */
export function summarizeNote(note: DailyNote): string {
  const feel = FEEL_LABELS[note.feel];
  if (note.faults.length > 0) {
    return `${feel} — ${note.faults.map((f) => f.label).slice(0, 3).join(', ')}`;
  }
  return note.text.trim() ? `${feel} — ${note.text.trim().slice(0, 60)}` : feel;
}
