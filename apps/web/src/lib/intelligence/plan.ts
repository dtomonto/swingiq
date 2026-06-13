// ============================================================
// SwingVantage — Deterministic Practice-Plan Generator (brief §8)
// ------------------------------------------------------------
// Turns a deterministic diagnosis into a focused, token-free practice plan:
// warm-up, one main technical focus, skill-scaled drills with rep/time
// prescriptions, success criteria, failure signals, retest instructions, and a
// progression / regression path — plus a short (Today) and long (report) form.
//
// Pure + side-effect-free: composes the fault ontology (retest + drill families)
// and the real drill library; respects per-skill recommendation limits so it
// never overwhelms. No AI, no I/O.
// ============================================================

import type { SportId } from '@swingiq/core';
import { resolveFault } from '@/lib/faults/ontology';
import { getAllDrills } from '@/lib/drills/catalog';
import type { DeterministicDiagnosis, SkillLevel } from './diagnose-types';
import { getRecommendationLimit } from './symptom-rules';

export interface PlanDrill {
  name: string;
  goal: string;
  slug?: string;
  /** Skill-scaled rep / time prescription. */
  prescription: string;
}

export interface DeterministicPlan {
  sport: SportId;
  skillLevel: SkillLevel;
  /** The single main technical focus. */
  focus: string;
  warmup: string;
  drills: PlanDrill[];
  successCriteria: string;
  failureSignals: string;
  retest: string;
  /** What to do when it's working — make it harder / transfer it. */
  progression: string;
  /** What to do when the athlete struggles — step back. */
  regression: string;
  estimatedMinutes: number;
  /** A 3–4 line Today version (default-closed detail elsewhere). */
  shortForm: string[];
  /** The full, report-length version. */
  longForm: string[];
}

const STOP = new Set(['the', 'and', 'too', 'for', 'of', 'to', 'in', 'on', 'is', 'at', 'or', 'your', 'a', 'an', 'with']);
function tokens(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
}
function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/** Pick the best N drills for a fault from the real library (else its families). */
function pickDrills(sport: SportId, faultName: string, drillFamilies: string[], n: number): { name: string; goal: string; slug?: string }[] {
  const pool = getAllDrills().filter((d) => d.sport === sport);
  const needle = tokens([faultName, ...drillFamilies].join(' '));
  const scored = pool
    .map((d) => ({ d, score: overlap(needle, tokens([d.name, d.targetFault ?? '', d.category ?? '', d.goal].join(' '))) }))
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0)
    .slice(0, n)
    .map((s) => ({ name: s.d.name, goal: s.d.goal, slug: s.d.slug }));
  if (scored.length >= Math.min(2, n)) return scored;
  // Fall back to drill families when the library lacks coverage for this sport.
  return drillFamilies.slice(0, n).map((fam) => ({ name: `${fam} work`, goal: `Build the ${fam} pattern.` }));
}

/** Skill-scaled rep / time prescription, varied a touch per drill index. */
function prescriptionFor(skill: SkillLevel, index: number): string {
  switch (skill) {
    case 'beginner':
      return index === 0 ? '10 slow, controlled reps — quality over speed' : '2 short sets, rest between';
    case 'intermediate':
      return index === 0 ? '2 sets of 10, add a little speed once the feel holds' : '2 sets of 8–10';
    case 'advanced':
    case 'elite':
    default:
      return index === 0 ? '3 sets of 12 with a quality gate (reset if it breaks down)' : '3 sets of 10, game-speed on the last set';
  }
}

const WARMUP: Record<SkillLevel, string> = {
  beginner: '3–4 minutes of easy, slow-motion reps to feel the move — no ball pressure yet.',
  intermediate: '5 minutes: slow reps, then half-speed with feedback before full motion.',
  advanced: '5–7 minutes: mobility + slow patterning, then build to speed with a quality gate.',
  elite: '5–7 minutes: activation + slow patterning, then ramp to speed holding the standard.',
};

const MINUTES: Record<SkillLevel, number> = { beginner: 15, intermediate: 20, advanced: 30, elite: 30 };

/**
 * Generate a structured, deterministic practice plan from a diagnosis. The drill
 * count follows the per-skill recommendation limit (primary + optional).
 */
export function generateDeterministicPlan(
  diagnosis: DeterministicDiagnosis,
  opts: { skillLevel?: SkillLevel } = {},
): DeterministicPlan {
  const skill = opts.skillLevel ?? diagnosis.skillLevel;
  const sport = diagnosis.sport;
  const cause = diagnosis.primary;
  const fault = resolveFault(cause.faultId, { sport, label: cause.name });

  const limit = getRecommendationLimit(sport, skill);
  const drillCount = Math.max(2, limit.primary + limit.optional);
  const picked = pickDrills(sport, cause.name, cause.drillFamilies, drillCount);
  const drills: PlanDrill[] = picked.map((d, i) => ({ ...d, prescription: prescriptionFor(skill, i) }));

  const focus = `Fix ${cause.name.toLowerCase()} first — it's your single highest-leverage change.`;
  const successCriteria = fault.retest.improvedWhen;
  const failureSignals = `If ${cause.name.toLowerCase()} still shows up at full speed after a focused block, slow down and rebuild the feel.`;
  const retest = `${fault.retest.whatToReassess} Keep it fair: ${fault.retest.sameConditions.join('; ')}. Window: ~${fault.retest.activeWindowDays} days.`;
  const progression = 'Once the feel holds, add speed, then mix in game-like reps and track results before moving on.';
  const regression = 'If it falls apart, shrink the move: slower, smaller, no ball pressure — rebuild quality before speed.';

  const lead = drills[0]?.name ?? 'the primary drill';
  const shortForm = [
    `Focus: ${cause.name}`,
    `Warm-up, then ${lead} — ${drills[0]?.prescription ?? 'a short, quality block'}.`,
    drills[1] ? `Then ${drills[1].name} — ${drills[1].prescription}.` : 'Keep the block short and clean.',
    `Done when: ${successCriteria.toLowerCase()}`,
  ];

  const longForm = [
    `Warm-up — ${WARMUP[skill]}`,
    `Main focus — ${focus}`,
    ...drills.map((d, i) => `Drill ${i + 1}: ${d.name} — ${d.goal} (${d.prescription}).`),
    `Success criteria — ${successCriteria}`,
    `Failure signals — ${failureSignals}`,
    `Progression — ${progression}`,
    `Regression — ${regression}`,
    `Retest — ${retest}`,
  ];

  return {
    sport,
    skillLevel: skill,
    focus,
    warmup: WARMUP[skill],
    drills,
    successCriteria,
    failureSignals,
    retest,
    progression,
    regression,
    estimatedMinutes: MINUTES[skill],
    shortForm,
    longForm,
  };
}
