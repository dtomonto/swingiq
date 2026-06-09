// ============================================================
// SwingVantage — Cross-session fault persistence (recommendation #15)
// ------------------------------------------------------------
// The single-session diagnostic engine answers "what's wrong today?". This
// pure layer answers the more useful question: "is this a real, recurring
// pattern, or a one-off bad range day?". A fault seen in every recent session
// is what a player should actually fix; a fault that shows up once is likely
// noise and shouldn't be over-weighted.
//
// Deterministic + side-effect-free. Takes the current diagnosis plus the
// triggered fault ids from prior sessions (newest-first) and labels each
// fault's persistence + a confidence factor the caller can apply.
// ============================================================

import type { DiagnosisCategory } from '../types';
import type { DiagnosticResult } from './engine';

export type FaultPersistence = 'new' | 'intermittent' | 'persistent' | 'chronic';

export interface PersistentFault {
  id: DiagnosisCategory;
  name: string;
  /** Sessions (incl. current) in the window this fault appeared in. */
  occurrences: number;
  /** Total sessions considered (incl. current), capped at the window. */
  totalSessions: number;
  /** Fraction of the window the fault was present in (0–1). */
  rate: number;
  persistence: FaultPersistence;
  /**
   * Multiplier (≥1 for recurring, <1 for brand-new) the caller may apply to the
   * single-session confidence so a chronic fault is surfaced more strongly and a
   * one-off slightly less. Never auto-applied — the engine stays single-session.
   */
  persistenceFactor: number;
  /** Whether the fault is present in the current (most recent) session. */
  inCurrent: boolean;
}

export interface PersistenceAssessment {
  /** Every distinct fault across the window, sorted most-persistent first. */
  faults: PersistentFault[];
  /** Faults present in (nearly) every session — the things to actually fix. */
  chronic: PersistentFault[];
  /** Faults that appear today but never before — watch, don't over-react. */
  emerging: PersistentFault[];
  windowSize: number;
}

export interface PersistenceOptions {
  /** How many recent sessions (incl. current) to consider. Default 5. */
  window?: number;
}

const DEFAULT_WINDOW = 5;

/** Persistence band + confidence factor from how often a fault recurs. */
function classify(rate: number, totalSessions: number, occurrences: number): {
  persistence: FaultPersistence;
  persistenceFactor: number;
} {
  // "chronic" needs a real window to mean something (≥3 sessions, present in all).
  if (totalSessions >= 3 && rate >= 0.999) return { persistence: 'chronic', persistenceFactor: 1.3 };
  if (rate >= 0.6) return { persistence: 'persistent', persistenceFactor: 1.15 };
  if (occurrences > 1) return { persistence: 'intermittent', persistenceFactor: 1.0 };
  return { persistence: 'new', persistenceFactor: 0.95 };
}

/**
 * Assess how persistent each diagnosed fault is across recent sessions.
 *
 * @param current        the most recent session's diagnostic result
 * @param priorFaultIds  triggered fault ids from prior sessions, newest first
 *                       (e.g. each session's `diagnoses.map(d => d.rule.id)`)
 */
export function assessFaultPersistence(
  current: DiagnosticResult,
  priorFaultIds: DiagnosisCategory[][],
  opts: PersistenceOptions = {},
): PersistenceAssessment {
  const window = Math.max(1, opts.window ?? DEFAULT_WINDOW);

  const currentIds = current.diagnoses.map((d) => d.rule.id);
  const currentNames = new Map<DiagnosisCategory, string>(
    current.diagnoses.map((d) => [d.rule.id, d.rule.name]),
  );

  // Window = current session + up to (window-1) priors, newest first.
  const sessions: DiagnosisCategory[][] = [currentIds, ...priorFaultIds].slice(0, window);
  const totalSessions = sessions.length;

  // Count occurrences per fault, de-duped within a session.
  const occ = new Map<DiagnosisCategory, number>();
  for (const ids of sessions) {
    for (const id of new Set(ids)) occ.set(id, (occ.get(id) ?? 0) + 1);
  }

  const currentSet = new Set(currentIds);

  const faults: PersistentFault[] = [...occ.entries()].map(([id, occurrences]) => {
    const rate = occurrences / totalSessions;
    const { persistence, persistenceFactor } = classify(rate, totalSessions, occurrences);
    return {
      id,
      name: currentNames.get(id) ?? String(id),
      occurrences,
      totalSessions,
      rate,
      persistence,
      persistenceFactor,
      inCurrent: currentSet.has(id),
    };
  });

  // Most-persistent first, then by occurrences, then current-session faults ahead.
  const order: Record<FaultPersistence, number> = { chronic: 0, persistent: 1, intermittent: 2, new: 3 };
  faults.sort((a, b) => {
    const byBand = order[a.persistence] - order[b.persistence];
    if (byBand !== 0) return byBand;
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return Number(b.inCurrent) - Number(a.inCurrent);
  });

  return {
    faults,
    chronic: faults.filter((f) => f.persistence === 'chronic' || f.persistence === 'persistent'),
    emerging: faults.filter((f) => f.persistence === 'new' && f.inCurrent),
    windowSize: window,
  };
}

/** Persistence-weighted confidence (clamped 0–100). Caller opt-in. */
export function persistenceWeightedConfidence(confidence: number, fault: PersistentFault): number {
  return Math.round(Math.max(0, Math.min(100, confidence * fault.persistenceFactor)));
}
