// ============================================================
// CentralIntelligenceOS — Coach Mix: Seed Profiles (admin-only)
// ------------------------------------------------------------
// Original SwingVantage teaching-influence frameworks. Each is built
// from GENERALIZED coaching principles, not any coach's content. The
// real coach is stored only as an admin `reference`/`publicHandle` and
// is NEVER shown to users unless an admin explicitly enables it.
//
// Every seed ships:
//   - visibility: 'admin_only'   (nothing user-facing yet)
//   - needsReview: true          (awaiting admin source approval)
//   - the mandatory COACH_MIX_DISCLAIMER
//
// The swing-model targets below are ILLUSTRATIVE starting points the
// admin refines once approved sources are reviewed — they are not
// claims about what any coach teaches.
// ============================================================

import type { CoachProfile, SwingModelTarget } from './types';
import { COACH_MIX_DISCLAIMER } from './config';

/** Build a profile with the disclaimer + safe defaults filled in. */
function defineProfile(
  p: Omit<CoachProfile, 'disclaimer' | 'status' | 'createdAt'> &
    Partial<Pick<CoachProfile, 'status' | 'createdAt'>>,
): CoachProfile {
  return {
    disclaimer: COACH_MIX_DISCLAIMER,
    status: p.status ?? 'active',
    createdAt: p.createdAt ?? '2026-06-08T00:00:00.000Z',
    ...p,
  };
}

// ── The always-available house model ────────────────────────

const DEFAULT_TARGET: SwingModelTarget = {
  name: 'SwingVantage Balanced Model',
  primaryMovementPattern: 'Honest, athletic, repeatable motion suited to the individual',
  setupPriorities: ['Neutral, athletic posture', 'Aim and alignment basics'],
  backswingPriorities: ['Width and structure', 'On-plane enough to repeat'],
  transitionPriorities: ['Smooth sequence from the ground up'],
  downswingPriorities: ['Rotate through', 'Deliver the face squarely'],
  impactPriorities: ['Center contact', 'Control low point'],
  finishPriorities: ['Balanced, complete rotation'],
  addressesFaults: ['over_the_top', 'early_extension', 'casting'],
  fitsPlayerTypes: ['Any athlete wanting honest, prioritized guidance'],
  mayNotFitPlayerTypes: ['Players seeking a single rigid method'],
  mobilityRequirements: 'No special requirement; scales to the athlete',
  skillSuitability: ['beginner', 'intermediate', 'advanced'],
  practiceDiscipline: 'Whatever the athlete will sustain — one fix at a time',
  recommendedLaunchMonitorMetrics: ['Club path', 'Face to path', 'Low point', 'Smash factor'],
  recommendedVideoCheckpoints: ['Setup', 'Top', 'Impact'],
};

export const SWINGVANTAGE_DEFAULT_PROFILE: CoachProfile = defineProfile({
  id: 'swingvantage-default',
  name: 'SwingVantage Default (house model)',
  sports: ['golf'],
  teachingStyleSummary:
    'The original SwingVantage voice: honest, prioritized, one-fix-at-a-time coaching that adapts to the athlete rather than forcing a single method.',
  styleTags: ['SwingVantage Blend'],
  swingModelTraits: ['balance_and_rhythm', 'face_control_first', 'sequencing_focused'],
  swingModelTarget: DEFAULT_TARGET,
  drillCategories: ['face control', 'low point', 'rotation & sequencing', 'tempo'],
  techniqueCategories: ['setup', 'sequencing', 'strike quality'],
  skillLevels: ['beginner', 'intermediate', 'advanced'],
  technicalDepth: 'balanced',
  visibility: 'user_visible', // the house voice is always safe to show
  defaultInfluenceWeight: 15,
  needsReview: false,
});

// ── 1. Mike Bender-inspired: structured, checkpoint-driven ──

const BENDER_TARGET: SwingModelTarget = {
  name: 'Structured Fundamentals Model',
  primaryMovementPattern: 'Repeatable, position-aware motion built on clear checkpoints',
  setupPriorities: ['Precise setup geometry', 'Posture and alignment discipline'],
  backswingPriorities: ['On-plane structure', 'Body–arm connection'],
  transitionPriorities: ['Stay connected', 'Keep the club in front of the body'],
  downswingPriorities: ['Sequenced delivery', 'Clubface control'],
  impactPriorities: ['Repeatable impact alignments', 'Center strike'],
  finishPriorities: ['Balanced, controlled finish'],
  addressesFaults: ['over_the_top', 'casting', 'connection_loss', 'slice'],
  fitsPlayerTypes: ['Learners who like structure and clear checkpoints', 'Players rebuilding fundamentals'],
  mayNotFitPlayerTypes: ['Players who improve best on feel alone'],
  mobilityRequirements: 'Low — built around positions and control, not max speed',
  skillSuitability: ['beginner', 'intermediate', 'advanced'],
  practiceDiscipline: 'Disciplined, checkpoint-based repetition with clear before/after checks',
  recommendedLaunchMonitorMetrics: ['Face angle', 'Club path', 'Face to path'],
  recommendedVideoCheckpoints: ['Setup', 'Halfway back', 'Top', 'Impact'],
};

export const BENDER_INSPIRED_PROFILE: CoachProfile = defineProfile({
  id: 'bender-inspired-structure',
  name: 'Structured Fundamentals (Bender-inspired)',
  publicHandle: 'Mike Bender',
  reference: 'Admin reference only — generalized structured/checkpoint teaching model',
  sports: ['golf'],
  teachingStyleSummary:
    'A structured, checkpoint-driven influence: precise setup, on-plane structure, body–arm connection, clubface control, and clear before/after checks.',
  styleTags: ['Structured Fundamentals'],
  swingModelTraits: ['structured_checkpointing', 'plane_aware', 'connection_focused', 'face_control_first'],
  swingModelTarget: BENDER_TARGET,
  drillCategories: ['setup & alignment', 'swing plane', 'connection', 'face control', 'checkpoint reps'],
  techniqueCategories: ['setup fundamentals', 'swing plane structure', 'body-arm connection', 'repeatable mechanics'],
  skillLevels: ['beginner', 'intermediate', 'advanced'],
  technicalDepth: 'technical',
  visibility: 'admin_only',
  defaultInfluenceWeight: 30,
  needsReview: true,
  adminNote: 'Seed profile. Add and approve sources before this influences user-facing recommendations. Do not imply endorsement.',
});

// ── 2. Kawamura-inspired: Japanese technical precision ──────

const KAWAMURA_TARGET: SwingModelTarget = {
  name: 'Technical Precision Model',
  primaryMovementPattern: 'Compact, balanced, technically clean motion built for repeatability',
  setupPriorities: ['Balanced, quiet setup', 'Precise alignment'],
  backswingPriorities: ['Compact, controlled', 'Swing-shape awareness'],
  transitionPriorities: ['Smooth rhythm', 'No rush'],
  downswingPriorities: ['Efficient mechanics', 'Controlled delivery'],
  impactPriorities: ['Clean, repeatable strike', 'Quality over power'],
  finishPriorities: ['Balanced, controlled'],
  addressesFaults: ['over_the_top', 'casting', 'tempo_inconsistency'],
  fitsPlayerTypes: ['Detail-oriented players', 'Players who value control and repeatability'],
  mayNotFitPlayerTypes: ['Players chasing maximum speed first'],
  mobilityRequirements: 'Low — emphasis on control and quality, not extreme ranges',
  skillSuitability: ['intermediate', 'advanced'],
  practiceDiscipline: 'High repetition quality, disciplined and patient',
  recommendedLaunchMonitorMetrics: ['Strike consistency', 'Face to path', 'Spin consistency'],
  recommendedVideoCheckpoints: ['Setup', 'Top', 'Impact'],
};

export const KAWAMURA_INSPIRED_PROFILE: CoachProfile = defineProfile({
  id: 'kawamura-inspired-precision',
  name: 'Technical Precision (Kawamura-inspired)',
  publicHandle: 'kawamura28',
  reference: 'Admin reference only (Instagram: kawamura28) — generalized technical-precision model',
  sports: ['golf'],
  teachingStyleSummary:
    'A Japanese technical-precision influence: balance, rhythm, compact movement, repetition quality, body control, and clean, efficient mechanics.',
  styleTags: ['Technical Precision'],
  swingModelTraits: ['technical_precision', 'compact_movement', 'balance_and_rhythm'],
  swingModelTarget: KAWAMURA_TARGET,
  drillCategories: ['balance', 'rhythm & tempo', 'compact motion', 'repetition quality', 'swing shape'],
  techniqueCategories: ['balance', 'rhythm', 'compact movement', 'technical precision', 'efficient mechanics'],
  skillLevels: ['intermediate', 'advanced'],
  technicalDepth: 'technical',
  visibility: 'admin_only',
  defaultInfluenceWeight: 25,
  needsReview: true,
  adminNote: 'Admin-only until sources are reviewed and approved. Do not imply endorsement.',
});

// ── 3. RubyStar-inspired: placeholder, NEEDS REVIEW ─────────

const RUBYSTAR_TARGET: SwingModelTarget = {
  name: 'Technical Golf Model (unconfirmed)',
  primaryMovementPattern: 'Technical, sequencing-aware ball-striking (to be confirmed by admin)',
  setupPriorities: ['To be confirmed'],
  backswingPriorities: ['To be confirmed'],
  transitionPriorities: ['To be confirmed'],
  downswingPriorities: ['Motion sequencing (tentative)'],
  impactPriorities: ['Ball-striking quality (tentative)'],
  finishPriorities: ['To be confirmed'],
  addressesFaults: [],
  fitsPlayerTypes: ['Competitive/technical players (tentative)'],
  mayNotFitPlayerTypes: ['To be confirmed'],
  mobilityRequirements: 'To be confirmed',
  skillSuitability: ['intermediate', 'advanced'],
  practiceDiscipline: 'Structured practice (tentative)',
  recommendedLaunchMonitorMetrics: [],
  recommendedVideoCheckpoints: [],
};

export const RUBYSTAR_INSPIRED_PROFILE: CoachProfile = defineProfile({
  id: 'rubystar-inspired-placeholder',
  name: 'Technical Golf (RubyStar-inspired) — PLACEHOLDER',
  publicHandle: 'rubystar330',
  reference: 'Admin reference only (Instagram: rubystar330) — identity & style UNCONFIRMED',
  sports: ['golf'],
  teachingStyleSummary:
    'Placeholder profile. Coach identity, teaching style, source permissions, and intended influence categories must be confirmed by an admin before use.',
  styleTags: ['Technical Precision'],
  swingModelTraits: ['technical_precision', 'sequencing_focused'],
  swingModelTarget: RUBYSTAR_TARGET,
  drillCategories: ['technical development', 'ball-striking', 'practice structure'],
  techniqueCategories: ['technical swing development', 'motion sequencing', 'precision checkpoints'],
  skillLevels: ['intermediate', 'advanced'],
  technicalDepth: 'technical',
  visibility: 'admin_only',
  defaultInfluenceWeight: 10,
  needsReview: true,
  adminNote:
    'Needs admin review before this profile influences user-facing recommendations. Do not infer aggressively from limited data — confirm identity, style, and source permissions first.',
});

// ── 4. George Gankas-inspired: athletic, rotational ─────────

const GANKAS_TARGET: SwingModelTarget = {
  name: 'Athletic Rotational Model',
  primaryMovementPattern: 'Athletic, pivot-driven motion using the ground and rotation to create speed',
  setupPriorities: ['Athletic, ready posture', 'Room to rotate'],
  backswingPriorities: ['Deep pivot and turn', 'Width with rotation'],
  transitionPriorities: ['Ground-up sequence', 'Shallow the club via body'],
  downswingPriorities: ['Aggressive rotation', 'Match the face to the body', 'Speed creation'],
  impactPriorities: ['Dynamic, rotary impact', 'Manage the face through speed'],
  finishPriorities: ['Full, athletic release'],
  addressesFaults: ['early_extension', 'over_the_top', 'slide_no_turn', 'casting'],
  fitsPlayerTypes: ['Athletic players', 'Speed-seekers', 'Players who learn by movement'],
  mayNotFitPlayerTypes: ['Limited-mobility players', 'Players who need positions over feels'],
  mobilityRequirements: 'Moderate–high — rotation and ground use reward mobility',
  skillSuitability: ['intermediate', 'advanced'],
  practiceDiscipline: 'Movement-based reps, matchups, and speed work',
  recommendedLaunchMonitorMetrics: ['Club speed', 'Club path', 'Face to path', 'Attack angle'],
  recommendedVideoCheckpoints: ['Setup', 'Top', 'Transition', 'Impact'],
};

export const GANKAS_INSPIRED_PROFILE: CoachProfile = defineProfile({
  id: 'gankas-inspired-athletic',
  name: 'Athletic Rotation (Gankas-inspired)',
  publicHandle: 'georgegankasgolf',
  reference: 'Admin reference only (georgegankasgolf) — generalized athletic, rotational model',
  sports: ['golf'],
  teachingStyleSummary:
    'An athletic, rotational, movement-driven influence: pivot-driven motion, ground reaction, rotation, matchups, shallowing, and speed creation.',
  styleTags: ['Athletic Rotation'],
  swingModelTraits: ['athletic_rotation', 'pivot_driven', 'ground_force_emphasis', 'sequencing_focused'],
  swingModelTarget: GANKAS_TARGET,
  drillCategories: ['rotation & sequencing', 'ground force', 'shallowing', 'speed', 'matchups'],
  techniqueCategories: ['pivot-driven movement', 'athletic sequencing', 'ground reaction', 'shallowing', 'speed creation'],
  skillLevels: ['intermediate', 'advanced'],
  technicalDepth: 'balanced',
  visibility: 'admin_only',
  defaultInfluenceWeight: 30,
  needsReview: true,
  adminNote:
    'Seed profile. Do not use the coach name in user-facing outputs unless admin explicitly enables coach-visible labeling. Do not imply endorsement.',
});

// ── 5. Baseball: athletic rotational power (house-authored) ─

const BASEBALL_POWER_TARGET: SwingModelTarget = {
  name: 'Rotational Power Model',
  primaryMovementPattern: 'Ground-up rotational hitting that turns the lower body into bat speed',
  setupPriorities: ['Athletic, balanced stance', 'Quiet, repeatable load'],
  backswingPriorities: ['Controlled load', 'Hip–shoulder separation'],
  transitionPriorities: ['Lead with the lower half', 'Stay connected'],
  downswingPriorities: ['Fire the hips', 'On-plane bat path', 'Stay through the ball'],
  impactPriorities: ['Square, on-time contact', 'Full extension'],
  finishPriorities: ['Balanced, complete rotation'],
  addressesFaults: ['no_hip_shoulder_separation', 'casting_the_bat', 'poor_weight_shift', 'long_swing'],
  fitsPlayerTypes: ['Athletic hitters', 'Players chasing exit velocity'],
  mayNotFitPlayerTypes: ['Contact-first players who slap the ball'],
  mobilityRequirements: 'Moderate — rotation and separation reward mobility',
  skillSuitability: ['intermediate', 'advanced'],
  practiceDiscipline: 'Tee + soft-toss reps that groove the sequence, then live timing',
  recommendedLaunchMonitorMetrics: ['Exit velocity', 'Launch angle', 'Bat speed'],
  recommendedVideoCheckpoints: ['Stance', 'Load', 'Contact', 'Extension'],
};

export const BASEBALL_POWER_PROFILE: CoachProfile = defineProfile({
  id: 'house-baseball-rotational-power',
  name: 'Rotational Power (Baseball, house model)',
  reference: 'House-authored SwingVantage style model — not based on any named coach',
  sports: ['baseball'],
  teachingStyleSummary:
    'An original, generalized baseball influence: ground-up rotation, hip–shoulder separation, an on-plane bat path, and staying through the ball for power.',
  styleTags: ['Athletic Rotation'],
  swingModelTraits: ['athletic_rotation', 'pivot_driven', 'sequencing_focused', 'ground_force_emphasis'],
  swingModelTarget: BASEBALL_POWER_TARGET,
  drillCategories: ['rotation & sequencing', 'separation', 'bat path', 'lower-half power'],
  techniqueCategories: ['hip-shoulder separation', 'rotational sequencing', 'bat path', 'weight shift'],
  skillLevels: ['intermediate', 'advanced'],
  technicalDepth: 'balanced',
  visibility: 'admin_only',
  defaultInfluenceWeight: 25,
  needsReview: true,
  adminNote: 'House-authored multi-sport seed. Review before it influences user-facing recommendations.',
});

// ── 6. Tennis: modern technical groundstrokes (house-authored) ─

const TENNIS_MODERN_TARGET: SwingModelTarget = {
  name: 'Modern Technical Model',
  primaryMovementPattern: 'Compact unit turn into a relaxed, fast, topspin-friendly swing',
  setupPriorities: ['Athletic ready position', 'Early split step'],
  backswingPriorities: ['Unit turn', 'Compact, early preparation'],
  transitionPriorities: ['Drop and lag the racquet', 'Stay relaxed'],
  downswingPriorities: ['Swing low-to-high', 'Accelerate through contact'],
  impactPriorities: ['Out in front', 'Stable wrist, clean strike'],
  finishPriorities: ['Full, balanced follow-through'],
  addressesFaults: ['late_preparation', 'arm_only_swing', 'no_unit_turn', 'poor_split_step'],
  fitsPlayerTypes: ['Developing players building modern technique', 'Topspin-oriented players'],
  mayNotFitPlayerTypes: ['Classic flat-hitting styles by preference'],
  mobilityRequirements: 'Low–moderate',
  skillSuitability: ['beginner', 'intermediate', 'advanced'],
  practiceDiscipline: 'Shadow swings + fed-ball reps grooving prep and low-to-high path',
  recommendedLaunchMonitorMetrics: ['Spin (where available)', 'Consistency / depth'],
  recommendedVideoCheckpoints: ['Split step', 'Unit turn', 'Contact', 'Finish'],
};

export const TENNIS_MODERN_PROFILE: CoachProfile = defineProfile({
  id: 'house-tennis-modern-technical',
  name: 'Modern Technical (Tennis, house model)',
  reference: 'House-authored SwingVantage style model — not based on any named coach',
  sports: ['tennis'],
  teachingStyleSummary:
    'An original, generalized tennis influence: early unit turn, a compact relaxed swing, low-to-high path, and clean out-front contact.',
  styleTags: ['Technical Precision'],
  swingModelTraits: ['technical_precision', 'sequencing_focused', 'compact_movement'],
  swingModelTarget: TENNIS_MODERN_TARGET,
  drillCategories: ['unit turn', 'preparation timing', 'low-to-high path', 'contact point'],
  techniqueCategories: ['unit turn', 'compact preparation', 'swing path', 'contact point'],
  skillLevels: ['beginner', 'intermediate', 'advanced'],
  technicalDepth: 'balanced',
  visibility: 'admin_only',
  defaultInfluenceWeight: 25,
  needsReview: true,
  adminNote: 'House-authored multi-sport seed. Review before it influences user-facing recommendations.',
});

/** All seed profiles, house model first. */
export const SEED_COACH_PROFILES: CoachProfile[] = [
  SWINGVANTAGE_DEFAULT_PROFILE,
  BENDER_INSPIRED_PROFILE,
  KAWAMURA_INSPIRED_PROFILE,
  RUBYSTAR_INSPIRED_PROFILE,
  GANKAS_INSPIRED_PROFILE,
  BASEBALL_POWER_PROFILE,
  TENNIS_MODERN_PROFILE,
];

export function getSeedProfile(id: string): CoachProfile | undefined {
  return SEED_COACH_PROFILES.find((p) => p.id === id);
}
