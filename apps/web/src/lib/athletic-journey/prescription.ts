// ============================================================
// SwingVantage — Athletic Journey: practice prescription engine
// ------------------------------------------------------------
// Turns the classification into a concrete weekly plan: a primary
// block for the keystone weakness, supporting blocks, an on-course /
// match objective, the next thing to upload, and a retest. Honors
// injury info by lowering intensity and adding a safety note — never
// diagnoses, never prescribes unsafe volume.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  ClassificationCategory,
  JourneySignals,
  MissingDataItem,
  PracticePrescription,
  PrescriptionBlock,
  SportJourneyConfig,
} from './types';
import type { ClassificationResult } from './classify';

interface BlockTemplate {
  title: string;
  rationale: string;
  drills: string[];
  frequency: string;
  proofMetric: string;
}

const GOLF_BLOCKS: Partial<Record<ClassificationCategory, BlockTemplate>> = {
  scoring: { title: 'Scoring block', rationale: 'Convert ball-striking into lower numbers.', drills: ['Par-18 short-game game', 'Worst-ball 9 holes', 'Up-and-down ladder'], frequency: '2x/week', proofMetric: 'Average score trend' },
  technique: { title: 'Tee & approach block', rationale: 'Build a repeatable, playable ball flight.', drills: ['Alignment-stick gate drill', 'Tee-shot fairway-finder', '9-shot trajectory matrix'], frequency: '2–3x/week', proofMetric: 'Playable tee-shot %' },
  consistency: { title: 'Dispersion block', rationale: 'Tighten your two-way miss.', drills: ['Center-contact face-tape drill', 'Start-line gate drill', 'Towel-under-arms connection'], frequency: '2x/week', proofMetric: 'Shot dispersion width' },
  finesse: { title: 'Short-game & putting block', rationale: 'Save the most strokes per practice hour.', drills: ['Wedge distance-ladder', 'Clock putting drill', 'Greenside up-and-down circuit'], frequency: '3x/week', proofMetric: 'Up-and-down %, 3-putt rate' },
  tactical: { title: 'Course-management block', rationale: 'Make smarter targets and club choices.', drills: ['On-course shot-decision journal', 'Conservative-target practice round', 'Risk/reward par-5 plan'], frequency: '1x/week on course', proofMetric: 'Penalties & doubles per round' },
  practice: { title: 'Practice-system block', rationale: 'Make every session count toward your stage.', drills: ['Block-to-random transfer practice', 'Skill-test scorecards', 'Pre-shot routine reps'], frequency: 'Every session', proofMetric: 'Skill-test scores' },
  competitive: { title: 'Competitive-exposure block', rationale: 'Results, not range numbers, define this tier.', drills: ['Play a ranked event', 'Pressure-scoring games', 'Post-round stat review'], frequency: '1–2 events/month', proofMetric: 'Tournament scoring average' },
  mental: { title: 'Pressure & routine block', rationale: 'Repeat your process when it counts.', drills: ['Pre-shot routine under timer', 'Breathing reset reps', 'Bad-hole recovery protocol'], frequency: '2x/week', proofMetric: 'Bounce-back hole rate' },
  movement: { title: 'Speed & mobility block', rationale: 'Support your swing safely.', drills: ['Dynamic warm-up', 'Rotational mobility', 'Overspeed protocol (if healthy)'], frequency: '2–3x/week', proofMetric: 'Club speed trend' },
};

const TENNIS_BLOCKS: Partial<Record<ClassificationCategory, BlockTemplate>> = {
  scoring: { title: 'Match-play block', rationale: 'Turn practice quality into match results.', drills: ['Play sets vs varied opponents', 'Closing-the-set games', 'Score-from-behind drills'], frequency: '2x/week', proofMetric: 'Win rate & set-close rate' },
  technique: { title: 'Groundstroke block', rationale: 'Build reliable forehand and backhand shapes.', drills: ['Crosscourt depth rallies', 'Down-the-line targets', 'Spin-window drill'], frequency: '2–3x/week', proofMetric: 'Rally tolerance & unforced errors' },
  consistency: { title: 'Rally-tolerance block', rationale: 'Win the neutral exchange.', drills: ['10-ball crosscourt at 70%', 'Figure-8 rally', 'Depth-target consistency'], frequency: '3x/week', proofMetric: 'Neutral rally success %' },
  finesse: { title: 'Serve & return block', rationale: 'The two most-leveraged shots in tennis.', drills: ['First/second serve targets', 'Serve-plus-one patterns', 'Return-depth ladder'], frequency: '3x/week', proofMetric: 'First-serve %, double faults' },
  movement: { title: 'Movement & recovery block', rationale: 'Get to more balls in balance.', drills: ['Split-step timing', 'Spider-run footwork', 'Wide-ball recovery'], frequency: '2x/week', proofMetric: 'Balance-at-contact %' },
  tactical: { title: 'Pattern & tactics block', rationale: 'Win points on purpose, not by accident.', drills: ['Serve-plus-one pattern reps', 'Opponent-weakness targeting', 'Mid-point plan changes'], frequency: '2x/week', proofMetric: 'Points won by pattern' },
  practice: { title: 'Practice-system block', rationale: 'Make every session build your stage.', drills: ['Block-to-random transfer', 'Skill-test scorecards', 'Stroke-comparison reviews'], frequency: 'Every session', proofMetric: 'Skill-test scores' },
  mental: { title: 'Pressure-point block', rationale: 'Execute on break and set points.', drills: ['Break-point simulation', 'Routine-between-points reps', 'Reset-after-error protocol'], frequency: '2x/week', proofMetric: 'Break-point conversion %' },
};

function blocksFor(sport: SportId): Partial<Record<ClassificationCategory, BlockTemplate>> {
  return sport === 'golf' ? GOLF_BLOCKS : TENNIS_BLOCKS;
}

function toBlock(cat: ClassificationCategory, tpl: BlockTemplate, lowerIntensity: boolean): PrescriptionBlock {
  return {
    id: `block_${cat}`,
    title: tpl.title,
    rationale: tpl.rationale,
    drills: tpl.drills,
    frequency: lowerIntensity ? `${tpl.frequency} (reduced while recovering)` : tpl.frequency,
    proofMetric: tpl.proofMetric,
    category: cat,
  };
}

/** Build a stage- and weakness-aware weekly practice prescription. */
export function generatePracticePrescription(
  signals: JourneySignals,
  config: SportJourneyConfig,
  classification: ClassificationResult,
  missingData: MissingDataItem[],
): PracticePrescription {
  const lib = blocksFor(config.sport);
  const hasInjury = Boolean(signals.profile.injuries && signals.profile.injuries.trim().length);

  // Order categories: priority first, then remaining gaps, then strengths to maintain.
  const ordered: ClassificationCategory[] = [];
  const push = (c: ClassificationCategory | null | undefined) => {
    if (c && lib[c] && !ordered.includes(c)) ordered.push(c);
  };
  push(classification.priorityCategory);
  classification.developmentGaps.forEach((g) => push(g.category));
  // Fill out with the stage's most-weighted categories so the plan is complete.
  (Object.keys(config.weights) as ClassificationCategory[])
    .sort((a, b) => (config.weights[b] ?? 0) - (config.weights[a] ?? 0))
    .forEach(push);

  const blocks = ordered.slice(0, 4).map((c) => toBlock(c, lib[c]!, hasInjury));

  const topVideo = missingData.find((m) => m.kind === 'video');
  const competitionNoun = config.sport === 'golf' ? 'round' : 'match';
  const objectiveBlock: PrescriptionBlock = {
    id: 'block_objective',
    title: config.sport === 'golf' ? 'On-course objective' : 'Match-play objective',
    rationale: `Take one block onto the course this week and measure it under real conditions.`,
    drills: [
      config.sport === 'golf'
        ? `Play one ${competitionNoun} with a single scoring goal (e.g. zero lost tee balls).`
        : `Play one ${competitionNoun} with a single tactical goal (e.g. 60% first serves).`,
      `Log the ${competitionNoun} so your stage updates.`,
    ],
    frequency: `1 ${competitionNoun}/week`,
    proofMetric: config.sport === 'golf' ? 'Logged round score' : 'Logged match result',
    category: 'scoring',
  };

  return {
    stageCode: classification.currentStage.code,
    headline: `Your ${classification.currentStage.name} weekly plan — built around your ${
      classification.priorityCategory ? classification.priorityCategory.replace('_', ' ') : 'biggest opportunity'
    }.`,
    blocks: [...blocks, objectiveBlock],
    uploadRequest: topVideo ? topVideo.label : null,
    retest: `Retest your priority metric in 2–3 weeks to confirm the change is real.`,
    safetyNote: hasInjury
      ? 'You have an injury or limitation on file, so volume is reduced and intensity kept low. Swap any painful drill for a lower-load alternative, and see a qualified professional for medical concerns — this plan is not medical advice.'
      : null,
  };
}
