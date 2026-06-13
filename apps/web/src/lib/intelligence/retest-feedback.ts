// ============================================================
// SwingVantage — Retest → Diagnosis feedback loop
// ------------------------------------------------------------
// Closes the improvement loop: turns a sport's completed retest history into the
// two history signals the deterministic engine consumes (lastRetestOutcome,
// priorFailedAttempts) for a given reported miss. So a fix that keeps failing on
// the same issue raises urgency, lowers confidence, and tips the engine toward
// recommending a deeper (AI/video) look — automatically, next time.
//
// Pure + side-effect-free: it reads only the RetestResult[] it is handed
// (from lib/retest), never localStorage or the network.
// ============================================================

import type { SportId } from '@swingiq/core';
import { matchFaultId } from '@/lib/faults/ontology';
import type { RetestResult } from '@/lib/retest/types';
import type { RetestOutcomeSignal } from './diagnose-types';

export interface RetestSignals {
  /** The most recent matching retest outcome for this issue, if any. */
  lastRetestOutcome?: RetestOutcomeSignal;
  /** How many times the same fix has been retested without success. */
  priorFailedAttempts: number;
}

const STOP = new Set(['the', 'and', 'too', 'for', 'of', 'to', 'in', 'on', 'is', 'at', 'or', 'your', 'a', 'an', 'with']);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

/** Loose text fallback when neither focus nor issue resolves to a curated fault. */
function fuzzyMatch(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

/**
 * Derive the retest feedback signals for a reported `issue` in a `sport` from the
 * completed retest results. A result is "about this issue" when its prior focus
 * resolves to the same curated fault id, or (as a fallback) shares a keyword.
 * `persisting` and `regressed` outcomes count as failed attempts.
 */
export function deriveRetestSignals(issue: string, sport: SportId, results: RetestResult[]): RetestSignals {
  const targetFault = matchFaultId(issue, sport);

  const relevant = results
    .filter((r) => r.sport === sport)
    .filter((r) => {
      const focusFault = matchFaultId(r.priorFocus, sport);
      if (targetFault && focusFault) return focusFault === targetFault;
      return fuzzyMatch(r.priorFocus, issue);
    })
    .sort((a, b) => new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime());

  const priorFailedAttempts = relevant.filter(
    (r) => r.comparison.outcome === 'persisting' || r.comparison.outcome === 'regressed',
  ).length;

  // RetestOutcome and RetestOutcomeSignal are the same union — safe to forward.
  const lastRetestOutcome = relevant[0]?.comparison.outcome as RetestOutcomeSignal | undefined;

  return { lastRetestOutcome, priorFailedAttempts };
}
