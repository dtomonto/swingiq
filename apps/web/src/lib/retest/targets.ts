// ============================================================
// SwingIQ — Retest Engine: Derivation
// ------------------------------------------------------------
// Builds OPEN retest targets and COMPLETED results purely from
// saved video history + the fault ontology's retest rules + the
// user's dismiss/acknowledge choices. Nothing new has to be
// written at analysis time — the loop emerges from data the app
// already saves.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { SavedVideoAnalysis } from '@/lib/video/history';
import { resolveFault } from '@/lib/faults';
import { buildWindow, statusFor, compareAnalyses } from './engine';
import type { RetestResult, RetestStoreState, RetestTarget } from './types';

/** Group analyses by sport, each list newest-first (history is already sorted). */
function bySport(history: SavedVideoAnalysis[]): Map<SportId, SavedVideoAnalysis[]> {
  const map = new Map<SportId, SavedVideoAnalysis[]>();
  for (const rec of history) {
    const list = map.get(rec.sport) ?? [];
    list.push(rec);
    map.set(rec.sport, list);
  }
  return map;
}

/** A stable, ontology-friendly slug for a free-text focus string. */
function focusSlug(focus: string): string {
  return focus.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'swing_focus';
}

/** Turn the most recent analysis for a sport into an OPEN retest target. */
function toTarget(latest: SavedVideoAnalysis, now: Date): RetestTarget {
  const focus = latest.topFocus;
  const fault = resolveFault(focusSlug(focus), { label: focus, sport: latest.sport });
  const window = buildWindow(latest.createdAt, fault.retest.activeWindowDays);
  return {
    id: latest.id,
    sport: latest.sport,
    sportLabel: latest.sportLabel,
    emoji: latest.emoji,
    faultId: fault.id,
    faultName: fault.name,
    focus,
    declaredCameraAngle: latest.declaredCameraAngle,
    window,
    status: statusFor(window, now),
    sameConditions: fault.retest.sameConditions,
    whatToReassess: fault.retest.whatToReassess,
  };
}

/**
 * OPEN retests: the latest analysis per sport whose window is still relevant
 * (active/due/overdue) and which the user hasn't dismissed. Sorted by urgency
 * (overdue → due → active), then by how long it's been waiting.
 */
export function deriveRetestTargets(
  history: SavedVideoAnalysis[],
  store: RetestStoreState,
  now: Date = new Date(),
): RetestTarget[] {
  const dismissed = new Set(store.dismissedTargetIds);
  const targets: RetestTarget[] = [];

  for (const [, list] of bySport(history)) {
    const latest = list[0];
    if (!latest || dismissed.has(latest.id)) continue;
    targets.push(toTarget(latest, now));
  }

  const rank = { overdue: 0, due: 1, active: 2 } as const;
  return targets.sort((a, b) => {
    const r = rank[a.status.status] - rank[b.status.status];
    if (r !== 0) return r;
    return b.status.daysSinceDiagnosis - a.status.daysSinceDiagnosis;
  });
}

/**
 * COMPLETED retests: for every sport with at least two analyses, compare the
 * two most recent. These are the "you retested — here's what changed" cards.
 * Excludes results the user has acknowledged.
 */
export function deriveRetestResults(
  history: SavedVideoAnalysis[],
  store: RetestStoreState,
): RetestResult[] {
  const acknowledged = new Set(store.acknowledgedResultIds);
  const results: RetestResult[] = [];

  for (const [sport, list] of bySport(history)) {
    if (list.length < 2) continue;
    const [current, previous] = list; // newest, second-newest
    if (acknowledged.has(current.id)) continue;
    results.push({
      id: current.id,
      sport,
      sportLabel: current.sportLabel,
      emoji: current.emoji,
      priorFocus: previous.topFocus,
      priorDate: previous.createdAt,
      currentDate: current.createdAt,
      comparison: compareAnalyses(previous, current),
    });
  }

  // Newest comparisons first.
  return results.sort(
    (a, b) => new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime(),
  );
}

/** The single most urgent open retest, if any (for a compact dashboard nudge). */
export function topRetestTarget(targets: RetestTarget[]): RetestTarget | null {
  return targets.find((t) => t.status.status !== 'active') ?? null;
}
