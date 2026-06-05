// ============================================================
// SwingVantage Community — Activity Feed Generator
// Generates feed items from session/achievement data.
// Uses structured translation keys instead of hardcoded strings.
// ============================================================

import type { ActivityFeedItem, ActivityVisibility } from './types';
import type { LocalSession, LocalVideoAnalysis, TrainingProgress } from '@/store';
import type { AchievementEarned } from './types';
import type { ChallengeCompleted } from './types';

let feedIdCounter = 0;
function generateFeedId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++feedIdCounter}`;
}

export function generateActivityFeed(
  sessions: LocalSession[],
  videoAnalyses: LocalVideoAnalysis[],
  achievementsEarned: AchievementEarned[],
  challengesCompleted: ChallengeCompleted[],
  training: TrainingProgress,
  displayName: string,
  defaultVisibility: ActivityVisibility = 'private'
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];
  const safeDisplayName = sanitizeDisplayName(displayName);

  // Sessions → feed items
  for (const session of sessions.slice(0, 20)) {
    items.push({
      id: generateFeedId('session'),
      type: 'session_completed',
      at: session.created_at,
      visibility: defaultVisibility,
      sport: session.sport,
      templateKey: 'activity.sessionCompleted',
      templateVars: {
        name: safeDisplayName,
        sport: session.sport,
      },
      xp: 30,
    });
  }

  // Video analyses → feed items
  for (const video of videoAnalyses.slice(0, 10)) {
    items.push({
      id: generateFeedId('video'),
      type: 'session_completed',
      at: video.created_at,
      visibility: defaultVisibility,
      sport: video.sport,
      templateKey: 'activity.sessionCompleted',
      templateVars: {
        name: safeDisplayName,
        sport: video.sport,
      },
      xp: 30,
    });
  }

  // Achievements → feed items
  for (const earned of achievementsEarned) {
    items.push({
      id: generateFeedId('achievement'),
      type: 'achievement_unlocked',
      at: earned.earnedAt,
      visibility: defaultVisibility,
      templateKey: 'activity.achievementUnlocked',
      templateVars: {
        name: safeDisplayName,
        badge: earned.id, // will be resolved to display name by the UI
      },
    });
  }

  // Challenges completed → feed items
  for (const completed of challengesCompleted) {
    items.push({
      id: generateFeedId('challenge'),
      type: 'challenge_completed',
      at: completed.completedAt,
      visibility: defaultVisibility,
      templateKey: 'activity.challengeCompleted',
      templateVars: {
        name: safeDisplayName,
        challenge: completed.id,
      },
      xp: completed.xpEarned,
    });
  }

  // Streak milestone → feed item when streak >= 7
  if (training.streak_days >= 7) {
    items.push({
      id: generateFeedId('streak'),
      type: 'streak_day',
      at: training.last_practice_date ?? new Date().toISOString(),
      visibility: defaultVisibility,
      templateKey: 'activity.streakDay',
      templateVars: {
        name: safeDisplayName,
        days: String(training.streak_days),
      },
    });
  }

  // Sort newest first
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function formatActivityTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 2) return 'just now';
  if (diffHours < 1) return `${diffMinutes}m ago`;
  if (diffDays < 1) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return date.toLocaleDateString();
}

// Sanitize user-provided display names to prevent XSS
function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[<>&"'`]/g, '')
    .trim()
    .slice(0, 50) || 'Athlete';
}
