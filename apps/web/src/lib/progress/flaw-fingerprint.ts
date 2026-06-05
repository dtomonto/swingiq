// ============================================================
// SwingVantage — Flaw Fingerprint
// ------------------------------------------------------------
// The recurring-pattern summary: the one issue that keeps coming
// back, the issues that travel with it, which drills the user
// actually found helpful, and the next intervention to try.
// Drill verdicts come from the local DrillMatch feedback loop;
// the pattern explanation comes from the fault ontology.
// ============================================================

import type { SportId } from '@swingiq/core';
import { resolveFault, matchFaultId } from '@/lib/faults';
import { getDrillCandidateById, type DrillFeedbackRecord } from '@/lib/drillmatch';
import type { SessionSummary } from '@/lib/agents';
import type { DrillVerdict, FlawFingerprint, FlawFingerprintInput } from './types';

function countFoci(sessions: SessionSummary[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.primaryFocus) continue;
    counts.set(s.primaryFocus, (counts.get(s.primaryFocus) ?? 0) + 1);
  }
  return counts;
}

function drillName(drillId: string): string {
  return getDrillCandidateById(drillId)?.name ?? 'A drill you tried';
}

/** Dedupe drill verdicts by drill id, keeping the first occurrence. */
function uniqueVerdicts(records: DrillFeedbackRecord[]): DrillVerdict[] {
  const seen = new Set<string>();
  const out: DrillVerdict[] = [];
  for (const r of records) {
    if (seen.has(r.drillId)) continue;
    seen.add(r.drillId);
    out.push({ drillId: r.drillId, name: drillName(r.drillId) });
  }
  return out;
}

export function buildFlawFingerprint(input: FlawFingerprintInput): FlawFingerprint {
  const { sport, allSessions, sportSessions, drillFeedback } = input;

  const counts = countFoci(sportSessions);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const hasData = ranked.length > 0;

  const mostCommonFlaw = ranked[0]?.[0] ?? null;
  const occurrences = ranked[0]?.[1] ?? 0;
  const relatedFlaws = ranked.slice(1).filter(([, n]) => n >= 1).map(([focus]) => focus).slice(0, 4);

  // Which sports have shown this same focus.
  const sportsAffected: SportId[] = mostCommonFlaw
    ? [...new Set(allSessions.filter((s) => s.primaryFocus === mostCommonFlaw).map((s) => s.sport))]
    : [];

  // Pattern explanation from the fault ontology.
  let patternExplanation = 'Not enough sessions yet to spot a pattern. Log a couple more and this sharpens up.';
  if (mostCommonFlaw) {
    const faultId = matchFaultId(mostCommonFlaw, sport) ?? '';
    const fault = resolveFault(faultId, { label: mostCommonFlaw, sport });
    const cause = fault.likelyRootCauses[0];
    patternExplanation = cause
      ? `This usually traces back to one habit: ${cause.charAt(0).toLowerCase() + cause.slice(1)}`
      : fault.description;
  }

  // Drill verdicts from the feedback loop, optionally focused on this fault.
  const relevant = mostCommonFlaw
    ? drillFeedback.filter((r) => {
        const id = matchFaultId(mostCommonFlaw, sport) ?? mostCommonFlaw;
        return r.faultId === id || r.faultId === mostCommonFlaw;
      })
    : drillFeedback;
  const pool = relevant.length > 0 ? relevant : drillFeedback;

  const drillsThatHelped = uniqueVerdicts(pool.filter((r) => r.value === 'helped'));
  const drillsThatDidNot = uniqueVerdicts(pool.filter((r) => r.value === 'hurt' || r.value === 'no_change'));

  let nextIntervention: string;
  if (drillsThatHelped.length > 0) {
    nextIntervention = `Keep leaning on "${drillsThatHelped[0].name}" — it's working for you. Retest to confirm the gain holds.`;
  } else if (mostCommonFlaw) {
    nextIntervention = `Open your Fix Stack for "${mostCommonFlaw}", run the drill, and mark whether it helped so SwingVantage learns what works for you.`;
  } else {
    nextIntervention = 'Run an analysis and your fingerprint will start to take shape.';
  }

  return {
    hasData,
    mostCommonFlaw,
    occurrences,
    relatedFlaws,
    sportsAffected,
    patternExplanation,
    drillsThatHelped,
    drillsThatDidNot,
    nextIntervention,
  };
}
