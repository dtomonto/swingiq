// ============================================================
// SwingIQ Community — Achievement System
// Badge definitions and progress calculation.
// ============================================================

import type { AchievementDefinition, AchievementContext, AchievementEarned } from './types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Data Protection ────────────────────────────────────────
  {
    id: 'first_backup',
    name: 'First Backup',
    description: 'Export your first SwingIQ data file.',
    category: 'data_protection',
    sport: 'all',
    xpReward: 50,
    icon: '💾',
    maxProgress: 1,
    getProgress: (ctx) => ctx.exportCount >= 1 ? 1 : 0,
    isEarned: (ctx) => ctx.exportCount >= 1,
  },
  {
    id: 'progress_protector',
    name: 'Progress Protector',
    description: 'Export data after completing 10 saved sessions.',
    category: 'data_protection',
    sport: 'all',
    xpReward: 100,
    icon: '🛡️',
    maxProgress: 10,
    getProgress: (ctx) => Math.min(ctx.sessions.length, 10),
    isEarned: (ctx) => ctx.exportCount >= 1 && ctx.sessions.length >= 10,
  },
  {
    id: 'backup_discipline',
    name: 'Backup Discipline',
    description: 'Export your data at least once per month for 3 consecutive months.',
    category: 'data_protection',
    sport: 'all',
    xpReward: 200,
    icon: '🔒',
    maxProgress: 3,
    getProgress: (ctx) => Math.min(Math.floor(ctx.exportCount / 1), 3),
    isEarned: (ctx) => ctx.exportCount >= 3,
  },
  {
    id: 'data_steward',
    name: 'Data Steward',
    description: 'Maintain 50 saved sessions with at least 5 exports.',
    category: 'data_protection',
    sport: 'all',
    xpReward: 500,
    icon: '🏛️',
    maxProgress: 50,
    getProgress: (ctx) => Math.min(ctx.sessions.length, 50),
    isEarned: (ctx) => ctx.sessions.length >= 50 && ctx.exportCount >= 5,
  },
  {
    id: 'portable_athlete',
    name: 'Portable Athlete',
    description: 'Successfully export a backup file.',
    category: 'data_protection',
    sport: 'all',
    xpReward: 75,
    icon: '📱',
    maxProgress: 1,
    getProgress: (ctx) => ctx.exportCount >= 1 ? 1 : 0,
    isEarned: (ctx) => ctx.exportCount >= 1,
  },

  // ── Consistency ─────────────────────────────────────────────
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your very first session.',
    category: 'consistency',
    sport: 'all',
    xpReward: 25,
    icon: '🌱',
    maxProgress: 1,
    getProgress: (ctx) => Math.min(ctx.sessions.length + ctx.videoAnalyses.length, 1),
    isEarned: (ctx) => ctx.sessions.length + ctx.videoAnalyses.length >= 1,
  },
  {
    id: 'five_sessions',
    name: 'Getting Started',
    description: 'Complete 5 sessions.',
    category: 'consistency',
    sport: 'all',
    xpReward: 50,
    icon: '🎯',
    maxProgress: 5,
    getProgress: (ctx) => Math.min(ctx.sessions.length + ctx.videoAnalyses.length, 5),
    isEarned: (ctx) => ctx.sessions.length + ctx.videoAnalyses.length >= 5,
  },
  {
    id: 'ten_sessions',
    name: 'Building Momentum',
    description: 'Complete 10 sessions.',
    category: 'consistency',
    sport: 'all',
    xpReward: 100,
    icon: '🔥',
    maxProgress: 10,
    getProgress: (ctx) => Math.min(ctx.sessions.length + ctx.videoAnalyses.length, 10),
    isEarned: (ctx) => ctx.sessions.length + ctx.videoAnalyses.length >= 10,
  },
  {
    id: 'twenty_five_sessions',
    name: 'Committed Athlete',
    description: 'Complete 25 sessions.',
    category: 'consistency',
    sport: 'all',
    xpReward: 250,
    icon: '💪',
    maxProgress: 25,
    getProgress: (ctx) => Math.min(ctx.sessions.length + ctx.videoAnalyses.length, 25),
    isEarned: (ctx) => ctx.sessions.length + ctx.videoAnalyses.length >= 25,
  },
  {
    id: 'fifty_sessions',
    name: 'Dedicated Performer',
    description: 'Complete 50 sessions.',
    category: 'consistency',
    sport: 'all',
    xpReward: 500,
    icon: '🏅',
    maxProgress: 50,
    getProgress: (ctx) => Math.min(ctx.sessions.length + ctx.videoAnalyses.length, 50),
    isEarned: (ctx) => ctx.sessions.length + ctx.videoAnalyses.length >= 50,
  },
  {
    id: 'three_day_streak',
    name: 'On a Roll',
    description: 'Maintain a 3-day practice streak.',
    category: 'consistency',
    sport: 'all',
    xpReward: 30,
    icon: '⚡',
    maxProgress: 3,
    getProgress: (ctx) => Math.min(ctx.training.streak_days, 3),
    isEarned: (ctx) => ctx.training.streak_days >= 3,
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day practice streak.',
    category: 'consistency',
    sport: 'all',
    xpReward: 100,
    icon: '🌟',
    maxProgress: 7,
    getProgress: (ctx) => Math.min(ctx.training.streak_days, 7),
    isEarned: (ctx) => ctx.training.streak_days >= 7,
  },
  {
    id: 'fourteen_day_streak',
    name: 'Two-Week Grind',
    description: 'Maintain a 14-day practice streak.',
    category: 'consistency',
    sport: 'all',
    xpReward: 200,
    icon: '🏆',
    maxProgress: 14,
    getProgress: (ctx) => Math.min(ctx.training.streak_days, 14),
    isEarned: (ctx) => ctx.training.streak_days >= 14,
  },

  // ── Improvement ─────────────────────────────────────────────
  {
    id: 'improvement_starter',
    name: 'Improvement Starter',
    description: 'Complete at least 2 sessions for the same sport.',
    category: 'improvement',
    sport: 'all',
    xpReward: 50,
    icon: '📈',
    maxProgress: 2,
    getProgress: (ctx) => {
      const sportCounts: Record<string, number> = {};
      ctx.sessions.forEach(s => { sportCounts[s.sport] = (sportCounts[s.sport] ?? 0) + 1; });
      return Math.min(Math.max(...Object.values(sportCounts), 0), 2);
    },
    isEarned: (ctx) => {
      const sportCounts: Record<string, number> = {};
      ctx.sessions.forEach(s => { sportCounts[s.sport] = (sportCounts[s.sport] ?? 0) + 1; });
      return Object.values(sportCounts).some(c => c >= 2);
    },
  },

  // ── Diagnostics ─────────────────────────────────────────────
  {
    id: 'first_diagnosis',
    name: 'Self-Aware Athlete',
    description: 'Complete your first swing diagnostic.',
    category: 'diagnostics',
    sport: 'all',
    xpReward: 75,
    icon: '🔍',
    maxProgress: 1,
    getProgress: (ctx) => {
      const hasDiag = ctx.sessions.some(s => s.diagnoses.length > 0) || ctx.videoAnalyses.some(v => !!v.primary_issue);
      return hasDiag ? 1 : 0;
    },
    isEarned: (ctx) => {
      return ctx.sessions.some(s => s.diagnoses.length > 0) || ctx.videoAnalyses.some(v => !!v.primary_issue);
    },
  },
  {
    id: 'drill_starter',
    name: 'Drill Starter',
    description: 'Complete your first training drill.',
    category: 'coachability',
    sport: 'all',
    xpReward: 50,
    icon: '🎽',
    maxProgress: 1,
    getProgress: (ctx) => Object.keys(ctx.training.drills_completed).length >= 1 ? 1 : 0,
    isEarned: (ctx) => Object.keys(ctx.training.drills_completed).length >= 1,
  },
  {
    id: 'ten_drills',
    name: 'Drill Addict',
    description: 'Complete 10 different training drills.',
    category: 'coachability',
    sport: 'all',
    xpReward: 150,
    icon: '🏋️',
    maxProgress: 10,
    getProgress: (ctx) => Math.min(Object.keys(ctx.training.drills_completed).length, 10),
    isEarned: (ctx) => Object.keys(ctx.training.drills_completed).length >= 10,
  },

  // ── Challenges ──────────────────────────────────────────────
  {
    id: 'first_challenge',
    name: 'Challenge Accepted',
    description: 'Complete your first challenge.',
    category: 'challenges',
    sport: 'all',
    xpReward: 100,
    icon: '⚔️',
    maxProgress: 1,
    getProgress: (ctx) => Math.min(ctx.challengesCompleted.length, 1),
    isEarned: (ctx) => ctx.challengesCompleted.length >= 1,
  },
  {
    id: 'five_challenges',
    name: 'Challenge Veteran',
    description: 'Complete 5 challenges.',
    category: 'challenges',
    sport: 'all',
    xpReward: 300,
    icon: '🎖️',
    maxProgress: 5,
    getProgress: (ctx) => Math.min(ctx.challengesCompleted.length, 5),
    isEarned: (ctx) => ctx.challengesCompleted.length >= 5,
  },

  // ── Multi-sport ─────────────────────────────────────────────
  {
    id: 'multi_sport',
    name: 'Multi-Sport Athlete',
    description: 'Complete sessions in 2 or more different sports.',
    category: 'sport_mastery',
    sport: 'all',
    xpReward: 150,
    icon: '🏟️',
    maxProgress: 2,
    getProgress: (ctx) => {
      const sports = new Set(ctx.sessions.map(s => s.sport));
      ctx.videoAnalyses.forEach(v => sports.add(v.sport));
      return Math.min(sports.size, 2);
    },
    isEarned: (ctx) => {
      const sports = new Set(ctx.sessions.map(s => s.sport));
      ctx.videoAnalyses.forEach(v => sports.add(v.sport));
      return sports.size >= 2;
    },
  },

  // ── Golf-specific ────────────────────────────────────────────
  {
    id: 'golf_five_sessions',
    name: 'Fairway Finder',
    description: 'Complete 5 golf sessions.',
    category: 'sport_mastery',
    sport: 'golf',
    xpReward: 75,
    icon: '⛳',
    maxProgress: 5,
    getProgress: (ctx) => Math.min(ctx.sessions.filter(s => s.sport === 'golf').length, 5),
    isEarned: (ctx) => ctx.sessions.filter(s => s.sport === 'golf').length >= 5,
  },

  // ── Tennis-specific ──────────────────────────────────────────
  {
    id: 'tennis_five_sessions',
    name: 'Rally Builder',
    description: 'Complete 5 tennis sessions.',
    category: 'sport_mastery',
    sport: 'tennis',
    xpReward: 75,
    icon: '🎾',
    maxProgress: 5,
    getProgress: (ctx) => Math.min(ctx.videoAnalyses.filter(v => v.sport === 'tennis').length, 5),
    isEarned: (ctx) => ctx.videoAnalyses.filter(v => v.sport === 'tennis').length >= 5,
  },

  // ── Baseball-specific ────────────────────────────────────────
  {
    id: 'baseball_five_sessions',
    name: 'Line Drive Builder',
    description: 'Complete 5 baseball sessions.',
    category: 'sport_mastery',
    sport: 'baseball',
    xpReward: 75,
    icon: '⚾',
    maxProgress: 5,
    getProgress: (ctx) => Math.min(ctx.videoAnalyses.filter(v => v.sport === 'baseball').length, 5),
    isEarned: (ctx) => ctx.videoAnalyses.filter(v => v.sport === 'baseball').length >= 5,
  },
];

export function computeAchievementProgress(
  achievement: AchievementDefinition,
  ctx: AchievementContext
): { progress: number; percent: number; isEarned: boolean } {
  const progress = achievement.getProgress(ctx);
  const isEarned = achievement.isEarned(ctx);
  const percent = Math.round((progress / achievement.maxProgress) * 100);
  return { progress, percent, isEarned };
}

export function syncEarnedAchievements(
  ctx: AchievementContext,
  currentEarned: AchievementEarned[]
): { newEarned: AchievementEarned[]; xpGained: number } {
  const alreadyEarnedIds = new Set(currentEarned.map(a => a.id));
  const newEarned: AchievementEarned[] = [];
  let xpGained = 0;

  for (const achievement of ACHIEVEMENTS) {
    if (!alreadyEarnedIds.has(achievement.id) && achievement.isEarned(ctx)) {
      newEarned.push({ id: achievement.id, earnedAt: new Date().toISOString() });
      xpGained += achievement.xpReward;
    }
  }

  return { newEarned, xpGained };
}

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}
