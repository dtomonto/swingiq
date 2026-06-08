// ============================================================
// CentralIntelligenceOS — Profile completion engine (pure)
// ------------------------------------------------------------
// Declares the coaching-critical profile fields per sport (as DATA),
// then scores a normalized profile snapshot against them. The field
// keys match what the live profile forms actually write:
//   • golf  → GolferProfileInput keys (flattened by the adapter)
//   • else  → sportProfiles[sport] keys (see profile/SportProfileForms)
//
// Progressive profiling: completion is gradual and the engine always
// surfaces the single highest-value "next" field so the UI never dumps
// a long form on the user.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { ProfileCompletion, ProfileFieldSpec } from './types';
import { PROFILE_COMPLETE_THRESHOLD } from './config';

/** Normalized, source-agnostic input for the pure scorer. */
export interface ProfileSnapshot {
  primarySport: SportId | null;
  /** Flattened field values for the primary sport. */
  fields: Record<string, unknown>;
  /** True when the user has ≥1 piece of equipment for the primary sport. */
  hasEquipment: boolean;
  /** When the profile first crossed the complete threshold, if recorded. */
  completedAt?: string | null;
}

// Reusable field specs ----------------------------------------------------

const REQ = (key: string, label: string, kind: ProfileFieldSpec['kind'], why: string): ProfileFieldSpec =>
  ({ key, label, kind, required: true, why });
const OPT = (key: string, label: string, kind: ProfileFieldSpec['kind'], why: string): ProfileFieldSpec =>
  ({ key, label, kind, required: false, why });

/**
 * Coaching-critical fields per sport, ordered by diagnostic value (most
 * valuable first) so prompts ask for the highest-impact field next.
 */
export const PROFILE_FIELDS: Record<SportId, ProfileFieldSpec[]> = {
  golf: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates every diagnosis and drill to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses your plan on what you actually want to fix.'),
    REQ('current_miss', 'Most common miss', 'text', 'Your miss pattern is the fastest route to a fix.'),
    REQ('performance_baseline', 'Average score or handicap', 'number', 'Anchors progress tracking to a real baseline.'),
    REQ('desired_shot_shape', 'Typical ball flight', 'choice', 'Tells the engine what "good" looks like for you.'),
    REQ('handedness', 'Dominant hand', 'choice', 'Mirrors analysis to your handedness.'),
    REQ('practice_environment', 'Practice setup', 'text', 'Tailors drills to mat/grass, indoor/outdoor.'),
    REQ('equipment', 'At least one club in your bag', 'equipment', 'Club specs sharpen distance + gapping advice.'),
    OPT('practice_frequency', 'Practice frequency', 'choice', 'Sets a realistic plan cadence.'),
    OPT('launch_monitor_owned', 'Launch monitor', 'choice', 'Unlocks data-grounded diagnostics.'),
    OPT('injury_notes', 'Injury / mobility notes', 'text', 'Keeps drills safe for your body.'),
  ],
  tennis: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_miss', 'Most common miss', 'text', 'Your error pattern drives the fix.'),
    REQ('dominant_hand', 'Dominant hand', 'choice', 'Mirrors stroke analysis correctly.'),
    REQ('backhand_style', 'Backhand style', 'choice', 'Backhand mechanics differ one- vs two-handed.'),
    REQ('playing_level', 'Match / competitive level', 'choice', 'Sets the standard your drills aim for.'),
    OPT('practice_frequency', 'Practice frequency', 'choice', 'Sets a realistic plan cadence.'),
    OPT('court_surface', 'Preferred surface', 'choice', 'Surface changes footwork and tactics.'),
    OPT('injury_notes', 'Injury / mobility notes', 'text', 'Keeps drills safe.'),
  ],
  baseball: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_miss', 'Most common miss', 'text', 'Your error pattern drives the fix.'),
    REQ('batting_side', 'Batting side', 'choice', 'Mirrors swing analysis to your side.'),
    REQ('throwing_hand', 'Throwing hand', 'choice', 'Completes your handedness picture.'),
    REQ('position', 'Primary position', 'text', 'Shapes both hitting and defensive goals.'),
    OPT('training_frequency', 'Training frequency', 'choice', 'Sets a realistic plan cadence.'),
    OPT('competition_level', 'League / level', 'choice', 'Sets the standard your drills aim for.'),
  ],
  softball_slow: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_miss', 'Most common miss', 'text', 'Your error pattern drives the fix.'),
    REQ('batting_side', 'Batting side', 'choice', 'Mirrors swing analysis to your side.'),
    REQ('throwing_hand', 'Throwing hand', 'choice', 'Completes your handedness picture.'),
    REQ('position', 'Primary position', 'text', 'Shapes both hitting and defensive goals.'),
    OPT('training_frequency', 'Training frequency', 'choice', 'Sets a realistic plan cadence.'),
    OPT('league_type', 'League type', 'choice', 'Sets the standard your drills aim for.'),
  ],
  softball_fast: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_hitting_result', 'Common hitting result', 'text', 'Your contact pattern drives the fix.'),
    REQ('batting_side', 'Batting side', 'choice', 'Mirrors swing analysis to your side.'),
    REQ('throwing_hand', 'Throwing hand', 'choice', 'Completes your handedness picture.'),
    REQ('position', 'Primary position', 'text', 'Shapes both hitting and defensive goals.'),
    OPT('training_frequency', 'Training frequency', 'choice', 'Sets a realistic plan cadence.'),
    OPT('competition_level', 'Level', 'choice', 'Sets the standard your drills aim for.'),
  ],
  pickleball: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_miss', 'Most common miss', 'text', 'Your error pattern drives the fix.'),
    REQ('dominant_hand', 'Dominant hand', 'choice', 'Mirrors stroke analysis correctly.'),
    REQ('preferred_style', 'Playing style', 'choice', 'Tactics and drills follow your style.'),
    REQ('format_preference', 'Singles / doubles', 'choice', 'Positioning advice depends on format.'),
    OPT('play_frequency', 'Play frequency', 'choice', 'Sets a realistic plan cadence.'),
  ],
  padel: [
    REQ('skill_level', 'Skill level', 'choice', 'Calibrates analysis to your level.'),
    REQ('primary_goal', 'Main goal', 'text', 'Focuses coaching on your target.'),
    REQ('common_miss', 'Most common miss', 'text', 'Your error pattern drives the fix.'),
    REQ('dominant_hand', 'Dominant hand', 'choice', 'Mirrors stroke analysis correctly.'),
    REQ('preferred_style', 'Playing style', 'choice', 'Tactics and drills follow your style.'),
    REQ('court_side', 'Preferred court side', 'choice', 'Positioning advice depends on your side.'),
    OPT('play_frequency', 'Play frequency', 'choice', 'Sets a realistic plan cadence.'),
  ],
};

/** A field counts as satisfied when it holds a real, non-empty value. */
export function isFieldSatisfied(spec: ProfileFieldSpec, snapshot: ProfileSnapshot): boolean {
  if (spec.kind === 'equipment') return snapshot.hasEquipment === true;
  const raw = snapshot.fields[spec.key];
  if (raw === null || raw === undefined) return false;
  if (typeof raw === 'number') return Number.isFinite(raw);
  return String(raw).trim() !== '';
}

/**
 * Score a profile snapshot. Completion percent is over REQUIRED fields only
 * (optional fields add polish, not pressure). When `primarySport` is null the
 * user hasn't picked a sport yet — 0% and the whole spec is "missing".
 */
export function calculateProfileCompletion(snapshot: ProfileSnapshot): ProfileCompletion {
  const sport = snapshot.primarySport;
  if (!sport) {
    return {
      sport: null,
      completionPercent: 0,
      completed: false,
      missingRequiredFields: [],
      missingOptionalFields: [],
      nextPrompt: null,
      completedAt: null,
    };
  }

  const specs = PROFILE_FIELDS[sport] ?? [];
  const required = specs.filter((s) => s.required);
  const optional = specs.filter((s) => !s.required);

  const missingRequired = required.filter((s) => !isFieldSatisfied(s, snapshot));
  const missingOptional = optional.filter((s) => !isFieldSatisfied(s, snapshot));

  const satisfiedRequired = required.length - missingRequired.length;
  const completionPercent = required.length === 0
    ? 0
    : Math.round((satisfiedRequired / required.length) * 100);

  const completed = completionPercent >= PROFILE_COMPLETE_THRESHOLD;

  // Next prompt: highest-value missing required field, else next optional.
  const nextPrompt = missingRequired[0] ?? missingOptional[0] ?? null;

  return {
    sport,
    completionPercent,
    completed,
    missingRequiredFields: missingRequired,
    missingOptionalFields: missingOptional,
    nextPrompt,
    completedAt: completed ? (snapshot.completedAt ?? null) : null,
  };
}

/** Convenience: just the missing required fields for a snapshot. */
export function getMissingProfileFields(snapshot: ProfileSnapshot): ProfileFieldSpec[] {
  return calculateProfileCompletion(snapshot).missingRequiredFields;
}

/** Convenience: the single best next field to ask for (progressive profiling). */
export function getNextProfilePrompt(snapshot: ProfileSnapshot): ProfileFieldSpec | null {
  return calculateProfileCompletion(snapshot).nextPrompt;
}
