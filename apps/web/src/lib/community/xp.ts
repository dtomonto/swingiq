// ============================================================
// SwingVantage Community — XP / Points System
// Awards XP for real training actions. Anti-gaming protected.
// ============================================================

import type { XPEvent, XPEventType } from './types';

export const XP_VALUES: Record<XPEventType, number> = {
  session_complete: 30,
  session_save: 10,
  diagnostic_complete: 20,
  drill_complete: 10,
  challenge_join: 5,
  challenge_complete: 100,
  metric_improvement: 25,
  personal_best: 75,
  streak_maintained: 15,
  export_data: 20,
  import_restore: 30,
  achievement_unlock: 0, // XP comes from the achievement itself
  group_join: 10,
};

export function createXPEvent(
  type: XPEventType,
  description: string,
  overrideXP?: number
): XPEvent {
  return {
    type,
    xp: overrideXP ?? XP_VALUES[type],
    at: new Date().toISOString(),
    description,
  };
}

// Anti-gaming: limit export XP to max 3 per day to prevent farming
export function canAwardExportXP(recentEvents: XPEvent[]): boolean {
  const today = new Date().toDateString();
  const todayExports = recentEvents.filter(
    e => e.type === 'export_data' && new Date(e.at).toDateString() === today
  );
  return todayExports.length < 3;
}

// Anti-gaming: don't award session XP for sessions imported within 10 minutes of each other
export function canAwardSessionXP(recentEvents: XPEvent[], sessionCreatedAt: string): boolean {
  const sessionTime = new Date(sessionCreatedAt).getTime();
  const recentSessionEvents = recentEvents.filter(e => e.type === 'session_complete');
  return !recentSessionEvents.some(e => {
    const diff = Math.abs(new Date(e.at).getTime() - sessionTime);
    return diff < 10 * 60 * 1000; // 10 minutes
  });
}

export function calculateLevelFromXP(xp: number): { level: number; progressToNext: number; xpForNext: number } {
  // Level thresholds: exponential growth
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
    } else {
      const xpInLevel = xp - thresholds[i - 1];
      const xpNeeded = thresholds[i] - thresholds[i - 1];
      return {
        level,
        progressToNext: Math.round((xpInLevel / xpNeeded) * 100),
        xpForNext: thresholds[i] - xp,
      };
    }
  }
  // Max level
  return { level, progressToNext: 100, xpForNext: 0 };
}

export function getLevelTitle(level: number): string {
  const titles = [
    '', 'Rookie', 'Beginner', 'Developing', 'Improving',
    'Consistent', 'Skilled', 'Advanced', 'Expert', 'Master', 'Legend',
  ];
  return titles[Math.min(level, titles.length - 1)] ?? 'Legend';
}
