// ============================================================
// CentralIntelligenceOS — Coach Mix: USER-FACING teaching styles
// ------------------------------------------------------------
// The styles an ATHLETE may choose for themselves. Every one is an
// ORIGINAL SwingVantage house voice — no coach reference, no admin-only
// coach-inspired profile is ever exposed here (those stay admin-gated
// per COACH_MIX_ETHICS.namesAdminGated). Picking one resolves a real
// CoachingStrategy through the same deterministic blend engine, so the
// user's choice genuinely biases their drills and explanations.
//
// Pure + server-safe (no DOM). The reactive preference store lives in
// user-preferences.ts.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  CoachMix,
  CoachMixEntry,
  CoachProfile,
  CoachingStrategy,
  SwingModelTarget,
} from './types';
import { SWINGVANTAGE_DEFAULT_PROFILE } from './seeds';
import { resolveCoachMix } from './mixing';

/** Fill a sensible house swing-model, overriding only what differs per style. */
function houseTarget(over: Partial<SwingModelTarget> & Pick<SwingModelTarget, 'name'>): SwingModelTarget {
  return {
    primaryMovementPattern: 'Repeatable, athletic motion suited to the individual',
    setupPriorities: ['Athletic posture', 'Aim and alignment basics'],
    backswingPriorities: ['Width and structure'],
    transitionPriorities: ['Smooth sequence from the ground up'],
    downswingPriorities: ['Rotate through', 'Deliver the face squarely'],
    impactPriorities: ['Center contact', 'Control low point'],
    finishPriorities: ['Balanced, complete rotation'],
    addressesFaults: [],
    fitsPlayerTypes: ['Any athlete wanting honest, prioritized guidance'],
    mayNotFitPlayerTypes: [],
    mobilityRequirements: 'No special requirement; scales to the athlete',
    skillSuitability: ['beginner', 'intermediate', 'advanced'],
    practiceDiscipline: 'One focused fix at a time, retested under the same conditions',
    recommendedLaunchMonitorMetrics: ['Club path', 'Face to path', 'Low point'],
    recommendedVideoCheckpoints: ['Setup', 'Top', 'Impact'],
    ...over,
  };
}

/** Build a user-visible, fully-original house profile (no coach reference). */
function houseProfile(
  p: Pick<
    CoachProfile,
    'id' | 'name' | 'teachingStyleSummary' | 'styleTags' | 'swingModelTraits' |
    'swingModelTarget' | 'drillCategories' | 'techniqueCategories' | 'technicalDepth'
  >,
): CoachProfile {
  return {
    sports: ['golf'],
    skillLevels: ['beginner', 'intermediate', 'advanced'],
    visibility: 'user_visible',
    defaultInfluenceWeight: 100,
    disclaimer: 'Original SwingVantage teaching voice.',
    needsReview: false,
    status: 'active',
    createdAt: '2026-06-08T00:00:00.000Z',
    ...p,
  };
}

// ── The original house voices users can pick ────────────────

const FEEL_PROFILE = houseProfile({
  id: 'house-feel-first',
  name: 'Simple & Feel-Based',
  teachingStyleSummary:
    'Plain language, one swing thought at a time, quick confidence-building drills that fix your biggest miss first.',
  styleTags: ['Feel-Based Simplicity'],
  swingModelTraits: ['balance_and_rhythm', 'face_control_first', 'tempo_driven'],
  technicalDepth: 'feel_first',
  drillCategories: ['tempo', 'face control', 'contact'],
  techniqueCategories: ['rhythm', 'simple feels', 'strike quality'],
  swingModelTarget: houseTarget({
    name: 'Feel-Based Model',
    addressesFaults: ['over_the_top', 'casting'],
    practiceDiscipline: 'Short, frequent reps on one feel — keep it simple and confident',
  }),
});

const TECHNICAL_PROFILE = houseProfile({
  id: 'house-technical-structured',
  name: 'Technical & Structured',
  teachingStyleSummary:
    'Clear checkpoints, setup discipline, on-plane structure and body–arm connection with before/after checks.',
  styleTags: ['Structured Fundamentals'],
  swingModelTraits: ['structured_checkpointing', 'plane_aware', 'connection_focused'],
  technicalDepth: 'technical',
  drillCategories: ['setup & alignment', 'swing plane', 'connection'],
  techniqueCategories: ['setup fundamentals', 'swing plane structure', 'repeatable mechanics'],
  swingModelTarget: houseTarget({
    name: 'Structured Fundamentals Model',
    addressesFaults: ['over_the_top', 'slice', 'connection_loss'],
    practiceDiscipline: 'Disciplined, checkpoint-based repetition with clear before/after checks',
    recommendedVideoCheckpoints: ['Setup', 'Halfway back', 'Top', 'Impact'],
  }),
});

const DATA_PROFILE = houseProfile({
  id: 'house-data-driven',
  name: 'Data-Driven',
  teachingStyleSummary:
    'Uses your launch-monitor / simulator numbers, explains the likely number-to-outcome link, and prioritizes by scoring impact with retests.',
  styleTags: ['Data-Driven Performance'],
  swingModelTraits: ['face_control_first', 'sequencing_focused'],
  technicalDepth: 'balanced',
  drillCategories: ['face control', 'path correction', 'low point', 'launch monitor'],
  techniqueCategories: ['face control', 'path correction', 'measurement-led practice'],
  swingModelTarget: houseTarget({
    name: 'Data-Driven Model',
    addressesFaults: ['over_the_top', 'early_extension'],
    practiceDiscipline: 'Measure, change one variable, re-measure — let the numbers confirm the fix',
    recommendedLaunchMonitorMetrics: ['Club path', 'Face to path', 'Low point', 'Smash factor', 'Spin'],
  }),
});

const PRECISION_PROFILE = houseProfile({
  id: 'house-precision',
  name: 'Precision Practice',
  teachingStyleSummary:
    'Balance, rhythm, compact and repeatable motion — high-quality reps with technical checkpoints, precision over power.',
  styleTags: ['Technical Precision'],
  swingModelTraits: ['technical_precision', 'compact_movement', 'balance_and_rhythm'],
  technicalDepth: 'technical',
  drillCategories: ['balance', 'rhythm & tempo', 'compact motion'],
  techniqueCategories: ['balance', 'rhythm', 'compact movement', 'technical precision'],
  swingModelTarget: houseTarget({
    name: 'Technical Precision Model',
    addressesFaults: ['tempo_inconsistency', 'over_the_top'],
    practiceDiscipline: 'High repetition quality, disciplined and patient',
  }),
});

/** All profiles the resolver needs in scope (house default + the four voices). */
export const USER_STYLE_PROFILES: CoachProfile[] = [
  SWINGVANTAGE_DEFAULT_PROFILE,
  FEEL_PROFILE,
  TECHNICAL_PROFILE,
  DATA_PROFILE,
  PRECISION_PROFILE,
];

/** A user-selectable coaching style (maps to a weighted blend of house voices). */
export interface UserCoachingStyle {
  /** Stable id stored in the user's preference (e.g. 'feel'). */
  id: string;
  label: string;
  /** One-line, user-friendly description. */
  blurb: string;
  /** The blend this style resolves to. */
  entries: CoachMixEntry[];
}

export const USER_COACHING_STYLES: UserCoachingStyle[] = [
  {
    id: 'default',
    label: 'SwingVantage Default',
    blurb: 'Honest, prioritized coaching that adapts to you — one fix at a time.',
    entries: [{ coachProfileId: 'swingvantage-default', weightPct: 100 }],
  },
  {
    id: 'feel',
    label: 'Simple & Feel-Based',
    blurb: 'Plain language and one swing thought at a time. Great for recreational play.',
    entries: [{ coachProfileId: 'house-feel-first', weightPct: 100 }],
  },
  {
    id: 'technical',
    label: 'Technical & Structured',
    blurb: 'Clear checkpoints, setup discipline and on-plane structure.',
    entries: [{ coachProfileId: 'house-technical-structured', weightPct: 100 }],
  },
  {
    id: 'data',
    label: 'Data-Driven',
    blurb: 'Built around your launch-monitor / simulator numbers and scoring impact.',
    entries: [{ coachProfileId: 'house-data-driven', weightPct: 100 }],
  },
  {
    id: 'precision',
    label: 'Precision Practice',
    blurb: 'Balance, rhythm and compact, repeatable motion. Precision over power.',
    entries: [{ coachProfileId: 'house-precision', weightPct: 100 }],
  },
  {
    id: 'blended',
    label: 'Blended',
    blurb: 'A balanced mix of every SwingVantage teaching voice.',
    entries: [
      { coachProfileId: 'house-feel-first', weightPct: 25 },
      { coachProfileId: 'house-technical-structured', weightPct: 25 },
      { coachProfileId: 'house-data-driven', weightPct: 25 },
      { coachProfileId: 'house-precision', weightPct: 25 },
    ],
  },
];

/** The default style id when the user hasn't chosen one (§6). */
export const DEFAULT_USER_STYLE_ID = 'default';

export function getUserStyle(styleId: string | null | undefined): UserCoachingStyle {
  return (
    USER_COACHING_STYLES.find((s) => s.id === styleId) ??
    USER_COACHING_STYLES.find((s) => s.id === DEFAULT_USER_STYLE_ID)!
  );
}

/**
 * Resolve a user's chosen style into the CoachingStrategy that biases their
 * drills/explanations. Deterministic; never touches the admin store, so a
 * regular athlete's recommendation depends only on their own choice.
 */
export function resolveUserStyleStrategy(
  styleId: string | null | undefined,
  sport: SportId = 'golf',
): CoachingStrategy {
  const style = getUserStyle(styleId);
  const mix: CoachMix = {
    id: `user-${style.id}`,
    name: style.label,
    description: style.blurb,
    sport,
    entries: style.entries,
    visibility: 'user_visible',
    userLabelMode: 'style_only',
    createdAt: '',
  };
  return resolveCoachMix(mix, USER_STYLE_PROFILES);
}
