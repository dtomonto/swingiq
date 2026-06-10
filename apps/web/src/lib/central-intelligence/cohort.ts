// ============================================================
// CentralIntelligenceOS — Cohort similarity recommender (recommendation #23)
// ------------------------------------------------------------
// "Players who shared your issue most often improved with X." A privacy-safe,
// keyless cohort signal built on the existing anonymized aggregation: it finds
// the cohort similar to the current athlete (same fault, ideally same skill
// band) and surfaces what most helped them — honest that it's a community
// signal, not a guarantee, and suppressed entirely below the k-anonymity
// threshold so a small group can never be re-identified.
//
// Pure; reuses buildDistribution's k-anonymity guard. No raw records leak —
// only ranked counts/percents.
// ============================================================

import type { AggregateBucket } from './types';
import { AGGREGATE_MIN_COHORT } from './config';
import { buildDistribution } from './aggregate';

/** One anonymized "this fault was resolved with X" record from another athlete. */
export interface CohortRecord {
  faultId: string;
  skillLevel: string | null;
  /** What helped them resolve it (a drill id or fix label). Null = no fix recorded. */
  helpedWith: string | null;
}

export interface CohortTarget {
  faultId: string;
  skillLevel?: string | null;
}

export interface CohortRecommendation {
  faultId: string;
  /** Number of similar players whose successful fix contributed. */
  cohortSize: number;
  /** True when the cohort was too small to anonymize safely. */
  suppressed: boolean;
  /** Whether the cohort was narrowed to the athlete's own skill band. */
  skillMatched: boolean;
  /** Ranked fixes that helped similar players (most common first). */
  topFixes: AggregateBucket[];
  message: string;
}

/**
 * What most helped players similar to the target (same fault, ideally same
 * skill). Falls back to an all-skill cohort for the fault when the same-skill
 * group is too small, and suppresses entirely below the k-anonymity minimum.
 */
export function cohortRecommendation(
  records: CohortRecord[],
  target: CohortTarget,
  opts: { minCohort?: number } = {},
): CohortRecommendation {
  const minCohort = opts.minCohort ?? AGGREGATE_MIN_COHORT;
  const sameFault = records.filter((r) => r.faultId === target.faultId);

  // Prefer same-skill cohort if it clears the threshold; otherwise widen to all
  // skill levels for the same fault.
  let cohort = sameFault;
  let skillMatched = false;
  if (target.skillLevel) {
    const sameSkill = sameFault.filter((r) => r.skillLevel === target.skillLevel);
    if (sameSkill.length >= minCohort) {
      cohort = sameSkill;
      skillMatched = true;
    }
  }

  const dist = buildDistribution(
    'helpedWith',
    cohort.map((r) => r.helpedWith),
    { minCohort },
  );

  if (dist.suppressed || dist.buckets.length === 0) {
    return {
      faultId: target.faultId,
      cohortSize: dist.total,
      suppressed: true,
      skillMatched,
      topFixes: [],
      message: 'Not enough similar players yet to suggest what works — this unlocks as the community grows.',
    };
  }

  const top = dist.buckets[0];
  const who = skillMatched ? 'players at your level who shared this issue' : 'players who shared this issue';
  return {
    faultId: target.faultId,
    cohortSize: dist.total,
    suppressed: false,
    skillMatched,
    topFixes: dist.buckets,
    message: `Most ${who} improved with ${top.label} (${top.percent}% of ${dist.total}). A community signal, not a guarantee.`,
  };
}
