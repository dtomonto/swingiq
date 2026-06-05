// ============================================================
// SwingVantage — Learning Profile Service
// Tracks how a user responds to drills and recommendations
// to personalise future analysis results.
// ============================================================

import type { SkillLevel } from '../types';
import type {
  UserLearningProfile,
  AnalysisFeedback,
  RecommendationInteraction,
  VisualIssueId,
} from './types';

// ──────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────

export function createDefaultLearningProfile(userId: string): UserLearningProfile {
  return {
    user_id: userId,
    skill_level: 'beginner',
    preferred_cue_style: 'mixed',
    responded_well_to_issues: [],
    persistent_issues: [],
    completed_drills: [],
    skipped_drills: [],
    average_feedback_rating: 0,
    total_analyses: 0,
    last_updated: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Update helpers (pure functions — call from server action)
// ──────────────────────────────────────────────────────────────

/**
 * Merge new feedback into an existing learning profile.
 * Returns a new profile object (immutable pattern).
 */
export function applyFeedbackToProfile(
  profile: UserLearningProfile,
  feedback: AnalysisFeedback,
): UserLearningProfile {
  const prevTotal = profile.total_analyses;
  const prevAvg = profile.average_feedback_rating;
  const newTotal = prevTotal + 1;
  const newAvg =
    newTotal === 1
      ? feedback.overall_rating
      : (prevAvg * prevTotal + feedback.overall_rating) / newTotal;

  return {
    ...profile,
    average_feedback_rating: Math.round(newAvg * 10) / 10,
    total_analyses: newTotal,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Merge a drill interaction into an existing learning profile.
 * Returns a new profile object.
 */
export function applyDrillInteractionToProfile(
  profile: UserLearningProfile,
  interaction: RecommendationInteraction,
): UserLearningProfile {
  const { drill_id, outcome } = interaction;

  const completedDrills = new Set(profile.completed_drills);
  const skippedDrills = new Set(profile.skipped_drills);

  if (outcome === 'felt_helpful') {
    completedDrills.add(drill_id);
    skippedDrills.delete(drill_id);
  } else if (outcome === 'irrelevant' || outcome === 'too_easy' || outcome === 'too_hard') {
    skippedDrills.add(drill_id);
  }

  return {
    ...profile,
    completed_drills: Array.from(completedDrills),
    skipped_drills: Array.from(skippedDrills),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Mark an issue as persistent (appeared in >= 3 analyses).
 */
export function markPersistentIssue(
  profile: UserLearningProfile,
  issueId: VisualIssueId,
): UserLearningProfile {
  if (profile.persistent_issues.includes(issueId)) return profile;
  return {
    ...profile,
    persistent_issues: [...profile.persistent_issues, issueId],
    last_updated: new Date().toISOString(),
  };
}

/**
 * Mark an issue as well-responded-to (user gave positive feedback after addressing it).
 */
export function markRespondedWellToIssue(
  profile: UserLearningProfile,
  issueId: VisualIssueId,
): UserLearningProfile {
  if (profile.responded_well_to_issues.includes(issueId)) return profile;
  return {
    ...profile,
    responded_well_to_issues: [...profile.responded_well_to_issues, issueId],
    last_updated: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Personalisation helpers
// ──────────────────────────────────────────────────────────────

/**
 * Return drills NOT in the user's skipped list, filtered by skill level.
 */
export function filterDrillsForProfile<T extends { id: string; skill_level: SkillLevel }>(
  drills: T[],
  profile: UserLearningProfile,
): T[] {
  const skillOrder: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'elite'];
  const userSkillIdx = skillOrder.indexOf(profile.skill_level);

  return drills.filter((d) => {
    if (profile.skipped_drills.includes(d.id)) return false;
    const drillSkillIdx = skillOrder.indexOf(d.skill_level);
    return drillSkillIdx <= userSkillIdx + 1; // allow one level above user skill
  });
}

/**
 * Infer preferred cue style from completed drills (feel vs technical).
 * This is a simple heuristic.
 */
export function inferPreferredCueStyle(
  profile: UserLearningProfile,
  _completedDrillMeta: Array<{ id: string; type: 'feel' | 'technical' }>,
): UserLearningProfile['preferred_cue_style'] {
  // Placeholder — with real data, we'd count feel vs technical drills completed
  return profile.preferred_cue_style;
}
