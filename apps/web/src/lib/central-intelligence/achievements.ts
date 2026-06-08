// ============================================================
// CentralIntelligenceOS — Achievements (Founding Member + milestones)
// ------------------------------------------------------------
// The Founding Member achievement is the headline reward of the launch
// campaign. Session milestones (1 / 3 / 5 / 10) give early momentum and
// pace a user toward the 10-session qualification. Pure data + helpers;
// earned state lives in the local CentralIntelligence store.
// ============================================================

import { formatMemberNumber, FOUNDING_REQUIRED_SESSIONS } from './config';

export type AchievementTier = 'founding' | 'progress' | 'mastery';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Emoji icon (renders everywhere, theme-agnostic, no asset pipeline). */
  icon: string;
  tier: AchievementTier;
}

export const FOUNDING_MEMBER_ACHIEVEMENT: Achievement = {
  id: 'founding-member',
  name: 'Founding Member',
  description:
    'Among the first 1,000 SwingVantage pioneers — completed a full player profile and recorded 10 sessions.',
  icon: '🏛️',
  tier: 'founding',
};

/** Session-count milestones that pace a user toward Founding qualification. */
export const SESSION_MILESTONES: Array<Achievement & { sessions: number }> = [
  { id: 'session-1', sessions: 1, name: 'First Session', description: 'Recorded your very first session.', icon: '🎬', tier: 'progress' },
  { id: 'session-3', sessions: 3, name: 'Finding a Groove', description: 'Three sessions in — patterns start to show.', icon: '🌱', tier: 'progress' },
  { id: 'session-5', sessions: 5, name: 'Halfway to Founding', description: 'Five valid sessions recorded.', icon: '⛳', tier: 'progress' },
  {
    id: `session-${FOUNDING_REQUIRED_SESSIONS}`,
    sessions: FOUNDING_REQUIRED_SESSIONS,
    name: 'Ten Strong',
    description: 'Ten valid sessions — the session half of Founding status is done.',
    icon: '🔟',
    tier: 'mastery',
  },
];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  FOUNDING_MEMBER_ACHIEVEMENT,
  ...SESSION_MILESTONES,
];

export function getAchievement(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

/** Which session milestones a given valid-session count has earned. */
export function earnedSessionMilestones(validSessionCount: number): Achievement[] {
  return SESSION_MILESTONES.filter((m) => validSessionCount >= m.sessions);
}

/** Present a Founding Member badge with its number for display/sharing. */
export function buildFoundingMemberBadge(memberNumber: number | null): {
  achievement: Achievement;
  numberLabel: string;
  headline: string;
} {
  const numberLabel = memberNumber != null ? formatMemberNumber(memberNumber) : '';
  return {
    achievement: FOUNDING_MEMBER_ACHIEVEMENT,
    numberLabel,
    headline: memberNumber != null
      ? `Founding Member ${numberLabel}`
      : 'Founding Member',
  };
}
