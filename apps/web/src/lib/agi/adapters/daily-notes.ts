// ============================================================
// SwingVantage — AGI: Daily-notes adapter
// ------------------------------------------------------------
// Normalises "How did you play today?" daily notes into SignalBundle
// session refs so they feed the player profile the same honest way
// launch-monitor sessions do: they contribute recurring-fault,
// consistency and coverage reasoning, but emit NO capability signals
// (a self-report is not a body measurement). The self-rated feel is a
// user_entered overall carried at LOW confidence so it can never pose
// as a measured score.
// ============================================================

import type { SportId } from '@swingiq/core';
import { feelToScore, type DailyNote } from '@/lib/dailyNotes';
import type { SignalBundle, SportSessionRef } from '../types';

const SPORT_META: Record<string, { label: string; emoji: string }> = {
  golf: { label: 'Golf', emoji: '⛳' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  baseball: { label: 'Baseball', emoji: '⚾' },
  softball_slow: { label: 'Softball (slow pitch)', emoji: '🥎' },
  softball_fast: { label: 'Softball (fast pitch)', emoji: '🥎' },
};

function meta(sport: SportId): { label: string; emoji: string } {
  return SPORT_META[sport] ?? { label: sport, emoji: '🏅' };
}

/** A self-report is low-confidence by design. */
const NOTE_CONFIDENCE = 0.4;

/** Build session refs from daily notes (self-reports). */
export function bundleFromDailyNotes(notes: DailyNote[] = []): SignalBundle {
  const sportSessions: SportSessionRef[] = [];

  for (const n of notes) {
    const m = meta(n.sport);
    // Highest-confidence detected fault becomes the session's key fault, so it
    // flows into the existing cross-session recurring-fault reasoning.
    const keyFault = [...n.faults].sort((a, b) => b.confidence - a.confidence)[0]?.label ?? '';
    sportSessions.push({
      sport: n.sport,
      sportLabel: m.label,
      emoji: m.emoji,
      motionLabel: 'Daily note (self-report)',
      sessionId: n.id,
      at: n.created_at || n.date || new Date().toISOString(),
      overall: feelToScore(n.feel),
      confidence: NOTE_CONFIDENCE,
      keyFault,
      drillHints: [],
    });
  }

  return { signals: [], sportSessions };
}
