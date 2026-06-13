// ============================================================
// SwingVantage — Deterministic Diagnosis: Symptom Rule Packs + Registry
// ------------------------------------------------------------
// Data-driven, weighted mappings from an athlete-REPORTED symptom (the miss
// pattern they pick) to ranked candidate causes (fault ids in lib/faults).
//
// This is the "rules engine" content: weights, reinforcement, contradiction,
// and the high-value follow-up questions that sharpen a diagnosis. Adding a
// sport or a symptom is pure data — the engine (diagnose.ts) never changes.
//
// Every faultId referenced here resolves through lib/faults (curated symptom
// packs + mechanical faults), so evidence, severity, retest, and drill
// families all come from one shared vocabulary.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { SkillLevel } from './diagnose-types';

/** A weighted symptom→cause rule. */
export interface SymptomRule {
  /** Canonical symptom id (normalized; what the athlete reports). */
  symptom: string;
  /** Human label for the symptom — used for intake questions / UI. */
  label: string;
  /** Free-text aliases that should normalize onto this symptom. */
  aliases?: string[];
  /** Candidate fault ids with base weights (higher = stronger lead). */
  candidates: { faultId: string; weight: number }[];
  /** Symptoms that, if also present, reinforce these candidates. */
  reinforcedBy?: string[];
  /** Symptoms that, if present, contradict these candidates. */
  contradictedBy?: string[];
  /** High-value follow-up questions that would sharpen the diagnosis. */
  missingDataPrompts?: string[];
}

/** Per-sport diagnosis configuration (thresholds, limits, disclaimers, rules). */
export interface SportDiagnosisConfig {
  sport: SportId;
  displayName: string;
  /** Confidence (0..100) below which AI/video escalation is recommended. */
  escalationConfidenceThreshold: number;
  /** Recommendation limits by skill level (brief §7). */
  recommendationLimits: Record<SkillLevel, { primary: number; optional: number }>;
  /** Sport-specific safety / trust disclaimer. */
  disclaimer: string;
  rules: SymptomRule[];
}

// Recommendation limits are identical across sports (a product rule, not a
// sport rule) — defined once and reused.
const RECOMMENDATION_LIMITS: SportDiagnosisConfig['recommendationLimits'] = {
  beginner: { primary: 1, optional: 1 },
  intermediate: { primary: 1, optional: 2 },
  advanced: { primary: 1, optional: 3 },
  elite: { primary: 1, optional: 3 },
};

// ──────────────────────────────────────────────────────────────
// GOLF
// ──────────────────────────────────────────────────────────────

const GOLF_RULES: SymptomRule[] = [
  {
    symptom: 'slice', label: 'Slice (curves away / right for RH)',
    aliases: ['slicing', 'curves right', 'big fade'],
    candidates: [{ faultId: 'slice', weight: 1.0 }, { faultId: 'over_the_top', weight: 0.7 }],
    reinforcedBy: ['pull', 'topped'], contradictedBy: ['hook', 'push'],
    missingDataPrompts: ['Which way does the ball start — left, straight, or right?', 'Do you take a divot, and where does it start relative to the ball?'],
  },
  {
    symptom: 'hook', label: 'Hook (curves toward you / left for RH)',
    aliases: ['hooking', 'curves left', 'snap hook'],
    candidates: [{ faultId: 'hook', weight: 1.0 }],
    contradictedBy: ['slice', 'pull'],
    missingDataPrompts: ['Which way does the ball start before it curves?'],
  },
  {
    symptom: 'pull', label: 'Pull (starts and stays left for RH)',
    candidates: [{ faultId: 'pull', weight: 1.0 }, { faultId: 'over_the_top', weight: 0.6 }],
    reinforcedBy: ['slice'], contradictedBy: ['push'],
  },
  {
    symptom: 'push', label: 'Push (starts and stays right for RH)',
    candidates: [{ faultId: 'push', weight: 1.0 }],
    contradictedBy: ['pull', 'slice'],
  },
  {
    symptom: 'fat', label: 'Fat / heavy contact (hit the ground first)',
    aliases: ['chunk', 'heavy', 'behind the ball'],
    candidates: [{ faultId: 'fat_contact', weight: 1.0 }, { faultId: 'early_extension', weight: 0.5 }],
    reinforcedBy: ['thin'],
    missingDataPrompts: ['Where does your divot start — behind, at, or after the ball?'],
  },
  {
    symptom: 'thin', label: 'Thin / bladed contact (low, hot)',
    aliases: ['skull', 'blade', 'thin shots'],
    candidates: [{ faultId: 'thin_contact', weight: 1.0 }, { faultId: 'early_extension', weight: 0.5 }, { faultId: 'topped', weight: 0.3 }],
    reinforcedBy: ['fat', 'topped'],
  },
  {
    symptom: 'topped', label: 'Topped (rolls along the ground)',
    aliases: ['top', 'worm burner'],
    candidates: [{ faultId: 'topped', weight: 1.0 }, { faultId: 'thin_contact', weight: 0.5 }, { faultId: 'early_extension', weight: 0.4 }],
  },
  {
    symptom: 'shank', label: 'Shank (off the hosel, shoots right)',
    aliases: ['hosel', 'shanks'],
    candidates: [{ faultId: 'shank', weight: 1.0 }, { faultId: 'heel_strike', weight: 0.6 }, { faultId: 'early_extension', weight: 0.4 }],
  },
  {
    symptom: 'toe', label: 'Toe strike (contact toward the toe)',
    candidates: [{ faultId: 'toe_strike', weight: 1.0 }, { faultId: 'early_extension', weight: 0.4 }],
  },
  {
    symptom: 'heel', label: 'Heel strike (contact toward the heel)',
    candidates: [{ faultId: 'heel_strike', weight: 1.0 }, { faultId: 'shank', weight: 0.4 }],
  },
  {
    symptom: 'pop_up', label: 'Sky / pop-up off the driver',
    aliases: ['sky', 'skied', 'pop up'],
    candidates: [{ faultId: 'sky_pop_up', weight: 1.0 }],
  },
  {
    symptom: 'low_launch', label: 'Too low / no height',
    aliases: ['low flight', 'knockdown', 'no carry height'],
    candidates: [{ faultId: 'low_launch', weight: 1.0 }],
  },
  {
    symptom: 'excessive_spin', label: 'Balloons / spins too much',
    aliases: ['ballooning', 'too much spin', 'floaty'],
    candidates: [{ faultId: 'excessive_spin', weight: 1.0 }],
  },
  {
    symptom: 'distance_loss', label: 'Losing distance',
    aliases: ['short', 'no distance', 'lost yards'],
    candidates: [
      { faultId: 'distance_loss', weight: 1.0 },
      { faultId: 'thin_contact', weight: 0.3 }, { faultId: 'toe_strike', weight: 0.3 }, { faultId: 'heel_strike', weight: 0.3 },
    ],
    missingDataPrompts: ['Where on the face do you tend to make contact?', 'Is the loss on every club or mainly the driver?'],
  },
];

// ──────────────────────────────────────────────────────────────
// BASEBALL / SOFTBALL (shared bat mechanics)
// ──────────────────────────────────────────────────────────────

function batRules(opts: { fastPitch?: boolean } = {}): SymptomRule[] {
  const rules: SymptomRule[] = [
    {
      symptom: 'pop_up', label: 'Pop-ups (weak ball in the air)',
      aliases: ['popping up', 'infield fly'],
      candidates: [
        { faultId: 'pop_up', weight: 1.0 },
        { faultId: 'dropping_back_shoulder', weight: 0.7 }, { faultId: 'undercut_ball', weight: 0.6 },
      ],
      reinforcedBy: ['undercut'], contradictedBy: ['rollover'],
      missingDataPrompts: ['Are the pop-ups on pitches up in the zone or down?'],
    },
    {
      symptom: 'rollover', label: 'Rollover ground balls (weak pull-side)',
      aliases: ['rolling over', 'weak grounders', 'topping it'],
      candidates: [{ faultId: 'rollover_grounder', weight: 1.0 }],
      contradictedBy: ['pop_up'],
    },
    {
      symptom: 'late', label: 'Late / behind on the pitch',
      aliases: ['late contact', 'getting beat', 'fouling it back'],
      candidates: [
        { faultId: 'late_contact_bat', weight: 1.0 },
        { faultId: 'casting_hands', weight: 0.6 },
        ...(opts.fastPitch ? [{ faultId: 'fp_late_load', weight: 0.6 }] : []),
      ],
      contradictedBy: ['early'],
      missingDataPrompts: ['Is the late contact on fastballs, off-speed, or both?'],
    },
    {
      symptom: 'early', label: 'Early / out in front (fooled by off-speed)',
      aliases: ['rushing', 'lunging', 'too early'],
      candidates: [{ faultId: 'early_contact', weight: 1.0 }, { faultId: 'lunging_forward', weight: 0.7 }],
      contradictedBy: ['late'],
    },
    {
      symptom: 'weak_oppo', label: 'Weak opposite-field contact',
      aliases: ['cant go oppo', 'soft the other way'],
      candidates: [{ faultId: 'weak_oppo_contact', weight: 1.0 }],
    },
    {
      symptom: 'undercut', label: 'Under the ball / too much uppercut',
      aliases: ['swinging up', 'uppercut', 'lazy fly balls'],
      candidates: [
        { faultId: 'undercut_ball', weight: 1.0 },
        { faultId: 'dropping_back_shoulder', weight: 0.6 }, { faultId: 'pop_up', weight: 0.5 },
      ],
      reinforcedBy: ['pop_up'],
    },
    {
      symptom: 'low_carry', label: 'Good contact but no carry',
      aliases: ['hard but low', 'no lift'],
      candidates: [{ faultId: 'low_carry_good_contact', weight: 1.0 }],
    },
    {
      symptom: 'no_power', label: 'Weak / no power (armsy)',
      aliases: ['no pop', 'all arms', 'weak'],
      candidates: [
        { faultId: 'hip_stall', weight: 0.9 },
        { faultId: 'poor_hip_shoulder_separation', weight: 0.7 },
        { faultId: 'casting_hands', weight: 0.5 },
      ],
      missingDataPrompts: ['Does your back hip clear through contact, or stall?'],
    },
  ];
  if (opts.fastPitch || opts.fastPitch === undefined) {
    rules.push({
      symptom: 'jammed', label: 'Jammed on inside pitches',
      aliases: ['sawed off', 'inside pitch'],
      candidates: [{ faultId: 'jammed_contact', weight: 1.0 }],
    });
  }
  return rules;
}

// ──────────────────────────────────────────────────────────────
// RACKET SPORTS (tennis / pickleball / padel)
// ──────────────────────────────────────────────────────────────

function racketRules(opts: { hasSplitStep?: boolean; hasRecovery?: boolean } = {}): SymptomRule[] {
  const rules: SymptomRule[] = [
    {
      symptom: 'net_errors', label: 'Hitting into the net',
      aliases: ['into the net', 'net error', 'short'],
      candidates: [{ faultId: 'net_errors', weight: 1.0 }],
      contradictedBy: ['long_errors'],
      missingDataPrompts: ['Are the net errors mostly forehand, backhand, or volleys?'],
    },
    {
      symptom: 'long_errors', label: 'Hitting long / past the baseline',
      aliases: ['too long', 'sailing', 'out the back'],
      candidates: [{ faultId: 'long_errors', weight: 1.0 }],
      contradictedBy: ['net_errors'],
    },
    {
      symptom: 'mishits', label: 'Mishits / off-center / shanks',
      aliases: ['framing it', 'shank', 'off center'],
      candidates: [{ faultId: 'mishit_offcenter', weight: 1.0 }, { faultId: 'footwork_breakdown', weight: 0.5 }],
      reinforcedBy: ['footwork', 'late'],
    },
    {
      symptom: 'late', label: 'Late / cramped contact',
      aliases: ['late contact', 'rushed', 'cramped'],
      candidates: [
        { faultId: 'late_contact_racket', weight: 1.0 },
        { faultId: 'footwork_breakdown', weight: 0.5 },
        ...(opts.hasSplitStep ? [{ faultId: 'poor_split_step', weight: 0.5 }] : []),
      ],
      reinforcedBy: ['footwork'],
    },
    {
      symptom: 'weak_serve', label: 'Weak / inconsistent serve',
      aliases: ['bad serve', 'double faults', 'no pace serve'],
      candidates: [{ faultId: 'weak_serve', weight: 1.0 }],
      missingDataPrompts: ['Is the issue more the toss, the pace, or where it lands?'],
    },
    {
      symptom: 'footwork', label: 'Slow / breaking-down footwork',
      aliases: ['flat footed', 'slow feet', 'reaching'],
      candidates: [
        { faultId: 'footwork_breakdown', weight: 1.0 },
        ...(opts.hasSplitStep ? [{ faultId: 'poor_split_step', weight: 0.6 }] : []),
      ],
    },
    {
      symptom: 'spacing', label: 'Crowding the ball / poor spacing',
      aliases: ['too close', 'jammed', 'crowding'],
      candidates: [{ faultId: 'poor_spacing', weight: 1.0 }],
    },
    {
      symptom: 'under_pressure', label: 'Breaks down under pressure',
      aliases: ['choking', 'tight in matches', 'big points'],
      candidates: [{ faultId: 'mishit_under_pressure', weight: 1.0 }],
    },
  ];
  if (opts.hasRecovery) {
    rules.push({
      symptom: 'poor_recovery', label: 'Out of position / slow recovery',
      aliases: ['out of position', 'caught flat'],
      candidates: [{ faultId: 'poor_recovery', weight: 1.0 }, { faultId: 'footwork_breakdown', weight: 0.6 }],
    });
  }
  // Tennis carries an extra over-rotation pattern from the mechanical ontology.
  if (opts.hasSplitStep && opts.hasRecovery) {
    rules.push({
      symptom: 'overrotation', label: 'Over-rotating / pulling off the ball',
      aliases: ['opening up early', 'spinning out'],
      candidates: [{ faultId: 'open_hips_early', weight: 1.0 }],
    });
  }
  return rules;
}

// ──────────────────────────────────────────────────────────────
// Registry
// ──────────────────────────────────────────────────────────────

const HONEST_DISCLAIMER =
  'This is a deterministic estimate based on your reported miss pattern, skill level, and goals — not a measured or video-confirmed analysis. Treat the cause below as the most likely starting point and retest to confirm.';

const CONFIGS: Record<SportId, SportDiagnosisConfig> = {
  golf: {
    sport: 'golf', displayName: 'Golf', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER, rules: GOLF_RULES,
  },
  baseball: {
    sport: 'baseball', displayName: 'Baseball', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER, rules: batRules({ fastPitch: true }),
  },
  softball_fast: {
    sport: 'softball_fast', displayName: 'Fast-Pitch Softball', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER, rules: batRules({ fastPitch: true }),
  },
  softball_slow: {
    sport: 'softball_slow', displayName: 'Slow-Pitch Softball', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER, rules: batRules({ fastPitch: false }),
  },
  tennis: {
    sport: 'tennis', displayName: 'Tennis', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER,
    rules: racketRules({ hasSplitStep: true, hasRecovery: true }),
  },
  pickleball: {
    sport: 'pickleball', displayName: 'Pickleball', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER,
    rules: racketRules({ hasSplitStep: false, hasRecovery: false }),
  },
  padel: {
    sport: 'padel', displayName: 'Padel', escalationConfidenceThreshold: 55,
    recommendationLimits: RECOMMENDATION_LIMITS, disclaimer: HONEST_DISCLAIMER,
    rules: racketRules({ hasSplitStep: false, hasRecovery: true }),
  },
};

/** All sports that have a deterministic diagnosis configuration. */
export function listDiagnosisSports(): SportId[] {
  return Object.keys(CONFIGS) as SportId[];
}

/** The diagnosis config for a sport, or `null` for an unknown sport. */
export function getSportDiagnosisConfig(sport: SportId): SportDiagnosisConfig | null {
  return CONFIGS[sport] ?? null;
}

/** The reportable symptoms for a sport — useful for intake questions / UI. */
export function getSymptomsForSport(sport: SportId): { symptom: string; label: string }[] {
  const cfg = CONFIGS[sport];
  if (!cfg) return [];
  return cfg.rules.map((r) => ({ symptom: r.symptom, label: r.label }));
}

/**
 * The recommendation limit for a sport + skill level (brief §7): how many
 * primary vs optional actions to show, so beginners aren't overwhelmed.
 */
export function getRecommendationLimit(sport: SportId, skill: SkillLevel): { primary: number; optional: number } {
  return (CONFIGS[sport] ?? CONFIGS.golf).recommendationLimits[skill] ?? RECOMMENDATION_LIMITS.intermediate;
}
