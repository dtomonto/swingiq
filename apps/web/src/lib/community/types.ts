// ============================================================
// SwingVantage Community — Data Types
// All types for the gamified community layer.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { LanguageCode } from '@/lib/i18n';

// ── Achievement / Badge ───────────────────────────────────────

export type AchievementCategory =
  | 'consistency'
  | 'improvement'
  | 'personal_bests'
  | 'sport_mastery'
  | 'diagnostics'
  | 'community'
  | 'challenges'
  | 'data_protection'
  | 'comeback'
  | 'coachability';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  sport: SportId | 'all';
  xpReward: number;
  icon: string; // emoji
  maxProgress: number;
  /** Returns current progress (0 to maxProgress) given app state */
  getProgress: (ctx: AchievementContext) => number;
  /** Returns true when fully earned */
  isEarned: (ctx: AchievementContext) => boolean;
}

export interface AchievementEarned {
  id: string;
  earnedAt: string; // ISO string
}

export interface AchievementContext {
  sessions: import('@/store').LocalSession[];
  videoAnalyses: import('@/store').LocalVideoAnalysis[];
  training: import('@/store').TrainingProgress;
  lastExportAt: string | null;
  exportCount: number;
  challengesCompleted: ChallengeCompleted[];
}

// ── Challenge ─────────────────────────────────────────────────

export type ChallengeType =
  | 'consistency'
  | 'improvement'
  | 'personal_best'
  | 'accuracy'
  | 'skill'
  | 'team'
  | 'beginner'
  | 'data';

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  sport: SportId | 'all';
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  durationDays: number;
  rules: string[];
  rewardBadgeId: string | null;
  rewardXP: number;
  icon: string;
  isDataChallenge: boolean;
  /** Returns progress 0–100 given state */
  getProgress: (ctx: ChallengeContext) => number;
}

export interface ChallengeActive {
  id: string;
  joinedAt: string;
  progress: number;
  expiresAt: string | null;
}

export interface ChallengeCompleted {
  id: string;
  completedAt: string;
  xpEarned: number;
}

export interface ChallengeContext {
  sessions: import('@/store').LocalSession[];
  videoAnalyses: import('@/store').LocalVideoAnalysis[];
  lastExportAt: string | null;
  exportCount: number;
  joinedAt: string;
}

// ── Streaks ───────────────────────────────────────────────────

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  type: 'practice' | 'export' | 'challenge';
}

// ── Backup Health ─────────────────────────────────────────────

export type BackupHealthStatus = 'current' | 'recommended' | 'urgent' | 'none';

export interface BackupHealth {
  status: BackupHealthStatus;
  lastExportAt: string | null;
  sessionsSinceExport: number;
  milestonesUnprotected: number;
  exportCount: number;
}

// ── XP / Points ───────────────────────────────────────────────

export type XPEventType =
  | 'session_complete'
  | 'session_save'
  | 'diagnostic_complete'
  | 'drill_complete'
  | 'challenge_join'
  | 'challenge_complete'
  | 'metric_improvement'
  | 'personal_best'
  | 'streak_maintained'
  | 'export_data'
  | 'import_restore'
  | 'achievement_unlock'
  | 'group_join';

export interface XPEvent {
  type: XPEventType;
  xp: number;
  at: string;
  description: string;
}

// ── Activity Feed ─────────────────────────────────────────────

export type ActivityItemType =
  | 'session_completed'
  | 'achievement_unlocked'
  | 'streak_day'
  | 'personal_best'
  | 'challenge_completed'
  | 'challenge_joined'
  | 'backup_exported'
  | 'milestone_reached'
  | 'group_joined';

export type ActivityVisibility = 'private' | 'followers' | 'public';

export interface ActivityFeedItem {
  id: string;
  type: ActivityItemType;
  at: string;
  visibility: ActivityVisibility;
  sport?: SportId;
  templateKey: string;
  templateVars: Record<string, string>;
  xp?: number;
}

// ── Community Profile ─────────────────────────────────────────

export type ProfileVisibility = 'private' | 'followers' | 'public';

export interface CommunityProfile {
  displayName: string;
  bio: string;
  visibility: ProfileVisibility;
  hideExactMetrics: boolean;
  showImprovementOnly: boolean;
  leaderboardOptOut: boolean;
  isYouthAthlete: boolean;
  primarySports: SportId[];
}

// ── Privacy Settings ──────────────────────────────────────────

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  feedVisibility: ActivityVisibility;
  leaderboardOptOut: boolean;
  hideExactMetrics: boolean;
  showImprovementOnly: boolean;
  allowFollowers: boolean;
}

// ── Group / Club ──────────────────────────────────────────────

export type GroupPrivacy = 'public' | 'private' | 'invite_only';

export interface GroupDefinition {
  id: string;
  name: string;
  description: string;
  sport: SportId | 'all';
  privacy: GroupPrivacy;
  icon: string;
  memberCount: number;
  challengeIds: string[];
  tags: string[];
}

// ── Leaderboard ───────────────────────────────────────────────

export type LeaderboardMetric =
  | 'sessions_completed'
  | 'current_streak'
  | 'improvement_percent'
  | 'challenge_points'
  | 'export_discipline';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  sport: SportId | 'all';
  value: number;
  change: number;
  isCurrentUser: boolean;
  anonymous: boolean;
}

// ── Full Community State (stored in Zustand) ──────────────────

export interface CommunityState {
  profile: CommunityProfile;
  achievementsEarned: AchievementEarned[];
  challengesActive: ChallengeActive[];
  challengesCompleted: ChallengeCompleted[];
  groupsJoined: string[];
  xpTotal: number;
  xpEvents: XPEvent[];
  lastExportAt: string | null;
  exportCount: number;
  privacy: PrivacySettings;
  activityFeed: ActivityFeedItem[];
  preferredLanguage: LanguageCode;
}

export const DEFAULT_COMMUNITY_PROFILE: CommunityProfile = {
  displayName: '',
  bio: '',
  visibility: 'private',
  hideExactMetrics: false,
  showImprovementOnly: false,
  leaderboardOptOut: false,
  isYouthAthlete: false,
  primarySports: [],
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'private',
  feedVisibility: 'private',
  leaderboardOptOut: false,
  hideExactMetrics: false,
  showImprovementOnly: false,
  allowFollowers: false,
};

export const DEFAULT_COMMUNITY_STATE: CommunityState = {
  profile: DEFAULT_COMMUNITY_PROFILE,
  achievementsEarned: [],
  challengesActive: [],
  challengesCompleted: [],
  groupsJoined: [],
  xpTotal: 0,
  xpEvents: [],
  lastExportAt: null,
  exportCount: 0,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  activityFeed: [],
  preferredLanguage: 'en',
};
