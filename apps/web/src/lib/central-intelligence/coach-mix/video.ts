// ============================================================
// CentralIntelligenceOS — Coach Mix: Video Concept Pipeline
// ------------------------------------------------------------
// Turn an APPROVED learned concept + the active coaching strategy into
// an ORIGINAL SwingVantage video concept (title, script outline, shot
// list, drill progression, retest, SEO/AEO/GEO keywords). It reuses
// Video Studio's vocabulary (VideoType/VideoStyle/AspectRatio) so the
// concept hands off cleanly to the existing brief pipeline.
//
// RULES: original SwingVantage content only — never a copy/clone/recreation
// of a coach's video. Concepts are 'draft' until an admin approves; coach
// names never appear unless the strategy opts in.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { AspectRatio, VideoStyle, VideoType } from '@/lib/video-studio/types';
import type { CoachingStrategy, LearnedConcept, StyleTag } from './types';

export interface CoachMixVideoConcept {
  id: string;
  title: string;
  sport: SportId;
  /** The swing problem this video targets. */
  targetProblem: string;
  /** Neutral influence framing (never a coach name unless opted in). */
  coachMixInfluence: string;
  influenceTags: StyleTag[];
  /** The kind of swing the video helps build. */
  swingModelObjective: string;
  drillProgression: string[];
  scriptOutline: string[];
  shotList: string[];
  practiceInstructions: string;
  retestInstructions: string;
  /** SEO + answer-engine + generative-engine keywords. */
  seoKeywords: string[];
  videoType: VideoType;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  durationTargetSec: number;
  approvalStatus: 'draft' | 'approved' | 'rejected';
  sourceConceptId: string | null;
  createdAt: string;
}

export interface VideoConceptInput {
  sport: SportId;
  /** Plain-language target problem (fault). */
  targetProblem: string;
  /** The active blend's resolved strategy. */
  strategy: CoachingStrategy;
  /** Ordered drill names to feature (e.g. from the curated recommendation). */
  drills: string[];
  /** The approved concept seeding this (optional but recommended). */
  sourceConcept?: LearnedConcept;
}

let _seq = 0;
function conceptId(): string {
  _seq += 1;
  return `vidconcept_${Date.now().toString(36)}_${_seq}`;
}

/**
 * Build an original video concept. Returns `null` if a source concept is
 * provided but not approved (only approved learning may seed a video).
 * Deterministic in content (id/timestamp aside).
 */
export function buildVideoConcept(input: VideoConceptInput): CoachMixVideoConcept | null {
  if (input.sourceConcept && input.sourceConcept.reviewStatus !== 'approved') return null;

  const { sport, targetProblem, strategy, drills } = input;
  const objective = strategy.influenceTags[0]
    ? `Build a ${strategy.influenceTags[0]} swing that resolves ${targetProblem}.`
    : `Resolve ${targetProblem} with a repeatable, athletic motion.`;

  const drillProgression = drills.length
    ? drills
    : ['Feel the change slowly', 'Add a target', 'Build to full speed'];

  const scriptOutline = [
    `Hook: the cost of ${targetProblem} (in plain language).`,
    `What good looks like — ${objective}`,
    `Drill 1: ${drillProgression[0]} (feel cue: ${strategy.movementCues[0] ?? 'smooth and athletic'}).`,
    ...drillProgression.slice(1).map((d, i) => `Drill ${i + 2}: ${d}.`),
    `Retest: ${strategy.retestProtocol}`,
    'Close: how this shows up in your real game.',
  ];

  const shotList = [
    'Title card + on-screen problem statement',
    'Slow-motion demo of the target motion (original footage)',
    ...drillProgression.map((d) => `Drill demo: ${d}`),
    'Before / after comparison (honest, same conditions)',
    'Outro card + practice reminder',
  ];

  const seoKeywords = Array.from(
    new Set([
      `${sport} ${targetProblem}`.toLowerCase(),
      `fix ${targetProblem}`.toLowerCase(),
      `how to fix ${targetProblem} in ${sport}`.toLowerCase(),
      `${sport} drills`,
      ...strategy.influenceTags.map((t) => `${t} ${sport}`.toLowerCase()),
    ]),
  );

  return {
    id: conceptId(),
    title: `Fix ${targetProblem}: a ${strategy.influenceTags[0] ?? 'SwingVantage'} approach`,
    sport,
    targetProblem,
    coachMixInfluence: strategy.influenceSummary,
    influenceTags: strategy.influenceTags,
    swingModelObjective: objective,
    drillProgression,
    scriptOutline,
    shotList,
    practiceInstructions: `Work one drill at a time. ${strategy.practiceProgression}`,
    retestInstructions: strategy.retestProtocol,
    seoKeywords,
    videoType: 'sport_instructional' as VideoType,
    style: 'hybrid' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
    durationTargetSec: 90,
    approvalStatus: 'draft',
    sourceConceptId: input.sourceConcept?.id ?? null,
    createdAt: new Date().toISOString(),
  };
}
