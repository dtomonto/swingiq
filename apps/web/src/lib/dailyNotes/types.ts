// ============================================================
// SwingVantage — Daily Notes: Types
// ------------------------------------------------------------
// A lightweight, sport-neutral place to answer "How did you play
// today?" after a round / match / game / practice. Each note is a
// self-report (basis: user_entered) plus any faults we can honestly
// detect from the free text. Notes feed the Athlete GI player
// profile so the picture keeps sharpening with everyday use — no
// launch monitor or video required.
// ============================================================

import type { SportId } from '@swingiq/core';

/**
 * A 1–5 self-rating of how the day went. Deliberately plain-language
 * and non-clinical, aligned with the app's score bands. It is the
 * answer to "How did you play today?" and the only required field.
 */
export type PlayFeel = 1 | 2 | 3 | 4 | 5;

/** A fault honestly inferred from the note's free text. */
export interface ExtractedFault {
  /** Curated ontology id when we could map it, else a synthesized slug. */
  id: string;
  /** Human label shown to the user (e.g. "Slice tendency"). */
  label: string;
  /** 0–1 how confident the text→fault match is. */
  confidence: number;
  /** True when `id` maps to a curated fault ontology entry (retest-able). */
  curated: boolean;
}

/** One saved daily note. Persisted in the main store. */
export interface DailyNote {
  id: string;
  /** Calendar day the note is about (YYYY-MM-DD). */
  date: string;
  sport: SportId;
  /** Required self-rating — the "how did you play today?" answer. */
  feel: PlayFeel;
  /** Optional free text: what happened, what felt off, what worked. */
  text: string;
  /** Faults detected from `text` at save time (the user can edit these). */
  faults: ExtractedFault[];
  /** Optional one-line context (course / opponent / range, etc.). */
  context: string;
  created_at: string;
}

/** The shape the capture form hands to the store (id/created_at added there). */
export type DailyNoteDraft = Omit<DailyNote, 'id' | 'created_at'>;
