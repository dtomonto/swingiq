// ============================================================
// SwingVantage — AGI: Store-sessions adapter
// ------------------------------------------------------------
// Normalises the app's launch-monitor sessions (`LocalSession`) and saved
// video analyses (`LocalVideoAnalysis`) into SignalBundle session refs.
//
// Honesty note: a launch monitor measures BALL-FLIGHT OUTCOMES, not body
// capabilities, so these sources do NOT emit capability signals (rotation,
// sequencing, …) — they only contribute session refs, which feed the
// consistency, coverage, and cross-sport-breadth reasoning. We never invent a
// "rotation score" from ball data.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { LocalSession, LocalVideoAnalysis } from '@/store';
import type { SignalBundle, SportSessionRef } from '../types';

const SPORT_META: Record<string, { label: string; emoji: string }> = {
  golf: { label: 'Golf', emoji: '⛳' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  pickleball: { label: 'Pickleball', emoji: '🏓' },
  padel: { label: 'Padel', emoji: '🎾' },
  baseball: { label: 'Baseball', emoji: '⚾' },
  softball_slow: { label: 'Softball (slow pitch)', emoji: '🥎' },
  softball_fast: { label: 'Softball (fast pitch)', emoji: '🥎' },
};

function meta(sport: SportId): { label: string; emoji: string } {
  return SPORT_META[sport] ?? { label: sport, emoji: '🏅' };
}

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Build session refs from launch-monitor sessions + saved video analyses. */
export function bundleFromStore(
  sessions: LocalSession[] = [],
  videos: LocalVideoAnalysis[] = [],
): SignalBundle {
  const sportSessions: SportSessionRef[] = [];

  for (const s of sessions) {
    if (s.swing_score === null || typeof s.swing_score !== 'number') continue;
    const m = meta(s.sport);
    sportSessions.push({
      sport: s.sport,
      sportLabel: m.label,
      emoji: m.emoji,
      motionLabel: s.name || s.club_name || 'Range session',
      sessionId: s.id,
      at: s.created_at || s.date || new Date().toISOString(),
      overall: clampScore(s.swing_score),
      confidence: 0.6,
      keyFault: s.diagnoses?.[0]?.rule?.name ?? '',
      drillHints: [],
    });
  }

  for (const v of videos) {
    if (typeof v.overall_score !== 'number') continue;
    const m = meta(v.sport);
    sportSessions.push({
      sport: v.sport,
      sportLabel: m.label,
      emoji: m.emoji,
      motionLabel: v.file_name || 'Video analysis',
      sessionId: v.id,
      at: v.created_at || new Date().toISOString(),
      overall: clampScore(v.overall_score),
      confidence: 0.55,
      keyFault: v.primary_issue ?? '',
      drillHints: [],
    });
  }

  return { signals: [], sportSessions };
}
