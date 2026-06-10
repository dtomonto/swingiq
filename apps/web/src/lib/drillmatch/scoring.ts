// ============================================================
// SwingVantage — DrillMatch: Transparent Scoring
// ------------------------------------------------------------
// A rule-based, fully deterministic scoring function that ranks
// normalized drill candidates for a diagnosed fault. Every point
// carries a plain-language reason so the UI can answer "why this
// drill?" honestly. No randomness, no model — pure rules over the
// existing drill libraries + the user's own feedback history.
// ============================================================

import type { SkillLevel } from '@swingiq/core';
import { resolveFault, matchFaultId } from '@/lib/faults';
import type {
  DrillCandidate,
  DrillFeedbackRepository,
  DrillMatchInput,
  MatchReason,
  RankedDrill,
} from './types';
import { getCandidatesForSport, isAssumedEquipment } from './catalog';
import { latestFeedbackValue, localDrillFeedbackRepo } from './feedback';
import { drillEffectiveness } from './effectiveness';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'my', 'your', 'for', 'with',
  'too', 'at', 'is', 'it', 'i', 'more', 'less', 'better', 'good', 'swing', 'ball',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

const SKILL_INDEX: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  elite: 2,
};

const DIFFICULTY_INDEX: Record<DrillCandidate['difficulty'], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** True when every non-assumed equipment token a drill needs is available. */
function equipmentSatisfied(needed: string[], available: string[]): { ok: boolean; missing: string[] } {
  const have = available.map((s) => s.toLowerCase());
  const missing = needed.filter((req) => {
    const r = req.toLowerCase();
    return !have.some((h) => h.includes(r) || r.includes(h));
  });
  return { ok: missing.length === 0, missing };
}

export interface ScoredDrill {
  drill: DrillCandidate;
  rawScore: number;
  reasons: MatchReason[];
  feedbackApplied: RankedDrill['feedbackApplied'];
  directHit: boolean;
}

/**
 * Score one candidate against the match input. Pure + deterministic.
 * `familyTokens` is the fault's drill-family vocabulary (precomputed once
 * by the caller) used for fuzzy "same skill area" matching.
 */
export function scoreDrill(
  drill: DrillCandidate,
  input: DrillMatchInput,
  familyTokens: Set<string>,
  repo: DrillFeedbackRepository = localDrillFeedbackRepo,
): ScoredDrill {
  const reasons: MatchReason[] = [];
  const add = (label: string, weight: number) => {
    if (weight !== 0) reasons.push({ label, weight });
  };

  // ── Fault relevance (the dominant signal) ──
  const directHit = Boolean(input.faultId && drill.faultIds.includes(input.faultId));
  const drillFamilyTokens = tokenize(drill.families.join(' '));
  const familyOverlap = overlapCount(drillFamilyTokens, familyTokens);

  if (directHit) {
    add('Targets your exact issue', 50);
  } else if (familyOverlap > 0) {
    add('Trains the same skill area', 24);
  } else if (input.faultName) {
    const nameOverlap = overlapCount(
      tokenize(input.faultName),
      tokenize([drill.name, drill.goal, drill.families.join(' ')].join(' ')),
    );
    if (nameOverlap > 0) add('Related to your reported issue', 12);
    else add('General fundamentals for this sport', 4);
  } else {
    add('General fundamentals for this sport', 4);
  }

  // ── Skill fit ──
  if (input.skillLevel) {
    const diff = Math.abs(SKILL_INDEX[input.skillLevel] - DIFFICULTY_INDEX[drill.difficulty]);
    if (diff === 0) add('Matched to your level', 14);
    else if (diff === 1) add('Close to your level', 7);
    else add('May be off your level', -4);
  } else if (drill.difficulty === 'beginner') {
    add('Beginner-friendly', 4);
  }

  // ── Time fit ──
  if (typeof input.timeAvailableMinutes === 'number') {
    const t = input.timeAvailableMinutes;
    if (drill.estimatedMinutes <= t) add(`Fits your ${t}-min window`, 10);
    else if (drill.estimatedMinutes <= t * 1.25) add('Just over your time window', 3);
    else add('Longer than your time window', -8);
  }

  // ── Equipment fit (only when the user told us what they have) ──
  if (input.availableEquipment && input.availableEquipment.length > 0) {
    const needed = drill.equipment.filter((e) => !isAssumedEquipment(e));
    if (needed.length === 0) {
      add('No special gear needed', 8);
    } else {
      const { ok, missing } = equipmentSatisfied(needed, input.availableEquipment);
      if (ok) add('Uses gear you have', 12);
      else add(`Needs ${missing[0]} you didn't list`, -14);
    }
  }

  // ── Constraints / safety ──
  if (input.physicalConstraints && input.physicalConstraints.length > 0) {
    if (drill.difficulty === 'advanced' || drill.safetyNote) {
      add('Heavier load — mind your constraint', -10);
    }
    if (drill.difficulty === 'beginner') {
      add('Gentler option', 6);
    }
  }

  // ── Goal alignment ──
  if (input.goal) {
    const goalOverlap = overlapCount(
      tokenize(input.goal),
      tokenize([drill.name, drill.goal].join(' ')),
    );
    if (goalOverlap > 0) add('Supports your goal', 6);
  }

  // ── Feedback memory (#24: weigh the FULL history, not just the latest) ──
  // Mirror latestFeedbackValue's fault-specific-preferred-else-any selection,
  // then apply a sample/recency-aware nudge so a drill that consistently helps
  // outranks one helped once. A single record reproduces the old fixed nudge.
  const feedback = latestFeedbackValue(drill.id, input.faultId, repo);
  if (feedback) {
    const faultRecords = input.faultId ? repo.getFor(drill.id, input.faultId) : [];
    const records = faultRecords.length > 0 ? faultRecords : repo.getFor(drill.id);
    const label =
      feedback === 'helped'
        ? 'You said this helped before'
        : feedback === 'no_change'
          ? 'No change reported last time'
          : 'You found this unhelpful before';
    add(label, drillEffectiveness(records).nudge);
  }

  const rawScore = reasons.reduce((sum, r) => sum + r.weight, 0);
  return { drill, rawScore, reasons, feedbackApplied: feedback, directHit };
}

/** Map a raw additive score onto a friendly 0–100 display score. */
export function displayScore(raw: number): number {
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Fill in a canonical curated `faultId` from a free-text `faultName` when one
 * wasn't supplied, so direct-hit matching + the right retest criteria kick in.
 * Returns a new input; never mutates the original.
 */
export function normalizeMatchInput(input: DrillMatchInput): DrillMatchInput {
  if (input.faultId || !input.faultName) return input;
  const matched = matchFaultId(input.faultName, input.sport);
  return matched ? { ...input, faultId: matched } : input;
}

/**
 * Rank all drills for the input's sport+fault. Deterministic ordering:
 * raw score desc, then direct hits first, then drill id for stability.
 * Drops clearly-negative matches unless that would leave nothing to show.
 */
export function rankDrills(
  rawInput: DrillMatchInput,
  repo: DrillFeedbackRepository = localDrillFeedbackRepo,
): RankedDrill[] {
  const input = normalizeMatchInput(rawInput);
  const limit = input.limit ?? 4;
  const fault =
    input.faultId || input.faultName
      ? resolveFault(input.faultId ?? '', { label: input.faultName, sport: input.sport })
      : null;
  const familyTokens = tokenize((fault?.drillFamilies ?? []).join(' '));

  const scored = getCandidatesForSport(input.sport).map((d) =>
    scoreDrill(d, input, familyTokens, repo),
  );

  scored.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (a.directHit !== b.directHit) return a.directHit ? -1 : 1;
    return a.drill.id.localeCompare(b.drill.id);
  });

  const positive = scored.filter((s) => s.rawScore > 0);
  const pool = positive.length > 0 ? positive : scored;

  return pool.slice(0, limit).map((s) => ({
    drill: s.drill,
    score: displayScore(s.rawScore),
    reasons: s.reasons,
    feedbackApplied: s.feedbackApplied,
    directHit: s.directHit,
  }));
}
