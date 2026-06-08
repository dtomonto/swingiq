// ============================================================
// SwingVantage — Athlete Timeline types (Phase 5)
// ============================================================

import type { SportId } from '@swingiq/core';

export type TimelineEventType =
  | 'session' // launch-monitor / simulator session imported or logged
  | 'video' // a video analysis
  | 'note' // a daily "how did you play" note
  | 'diagnosis' // an issue the engine surfaced
  | 'equipment' // a club added / changed
  | 'onboarding'; // setup / identity progress

export interface TimelineEvent {
  id: string;
  /** ISO timestamp used for ordering. */
  date: string;
  type: TimelineEventType;
  /** Sport the event belongs to, or null when not sport-specific. */
  sport: SportId | null;
  title: string;
  detail?: string;
  /** Club name when relevant (enables club filtering). */
  club?: string | null;
}

export interface TimelineSummary {
  total: number;
  byType: Record<TimelineEventType, number>;
  firstDate: string | null;
  lastDate: string | null;
  sports: SportId[];
}
