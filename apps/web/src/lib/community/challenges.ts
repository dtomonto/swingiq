// ============================================================
// SwingIQ Community — Challenge System
// Challenge definitions, progress calculation, and management.
// ============================================================

import type { ChallengeDefinition, ChallengeContext, ChallengeActive } from './types';

export const CHALLENGES: ChallengeDefinition[] = [
  // ── Data Discipline Challenges ──────────────────────────────
  {
    id: 'backup_champion',
    title: 'Backup Champion',
    description: 'Export your SwingIQ data after completing 5 sessions. Protect your progress.',
    sport: 'all',
    type: 'data',
    difficulty: 'beginner',
    durationDays: 30,
    rules: [
      'Complete 5 sessions in any sport.',
      'Export a SwingIQ backup file.',
      'Both must occur within the 30-day window.',
    ],
    rewardBadgeId: 'first_backup',
    rewardXP: 150,
    icon: '💾',
    isDataChallenge: true,
    getProgress: (ctx) => {
      const sessionsDone = Math.min(ctx.sessions.length + (ctx.videoAnalyses?.length ?? 0), 5);
      const exported = ctx.exportCount >= 1 ? 1 : 0;
      return Math.round(((sessionsDone / 5) * 0.7 + exported * 0.3) * 100);
    },
  },
  {
    id: 'progress_protector_challenge',
    title: 'Progress Protector',
    description: 'Export your full database after setting a training milestone.',
    sport: 'all',
    type: 'data',
    difficulty: 'intermediate',
    durationDays: 14,
    rules: [
      'Complete at least one session with a diagnosis.',
      'Export a SwingIQ backup file.',
    ],
    rewardBadgeId: 'progress_protector',
    rewardXP: 200,
    icon: '🛡️',
    isDataChallenge: true,
    getProgress: (ctx) => {
      const hasDiag = ctx.sessions.some(s => s.diagnoses?.length > 0) ? 50 : 0;
      const exported = ctx.exportCount >= 1 ? 50 : 0;
      return hasDiag + exported;
    },
  },

  // ── Consistency Challenges ──────────────────────────────────
  {
    id: 'weekly_5_sessions',
    title: 'Weekly 5 Challenge',
    description: 'Complete 5 sessions in 7 days.',
    sport: 'all',
    type: 'consistency',
    difficulty: 'intermediate',
    durationDays: 7,
    rules: [
      'Complete 5 sessions of any sport.',
      'All sessions must be within the 7-day window.',
    ],
    rewardBadgeId: null,
    rewardXP: 200,
    icon: '📅',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const cutoff = new Date(ctx.joinedAt);
      const end = new Date(cutoff);
      end.setDate(end.getDate() + 7);
      const count = ctx.sessions.filter(s => {
        const d = new Date(s.date || s.created_at);
        return d >= cutoff && d <= end;
      }).length;
      return Math.min(Math.round((count / 5) * 100), 100);
    },
  },
  {
    id: 'golf_consistency_week',
    title: 'Golf Consistency Week',
    description: 'Complete 3 golf sessions in one week.',
    sport: 'golf',
    type: 'consistency',
    difficulty: 'beginner',
    durationDays: 7,
    rules: [
      'Complete 3 golf sessions (CSV import or session log).',
      'All sessions must be within 7 days.',
    ],
    rewardBadgeId: 'golf_five_sessions',
    rewardXP: 100,
    icon: '⛳',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const cutoff = new Date(ctx.joinedAt);
      const end = new Date(cutoff);
      end.setDate(end.getDate() + 7);
      const count = ctx.sessions.filter(s => {
        const d = new Date(s.date || s.created_at);
        return s.sport === 'golf' && d >= cutoff && d <= end;
      }).length;
      return Math.min(Math.round((count / 3) * 100), 100);
    },
  },
  {
    id: 'multi_sport_week',
    title: 'Multi-Sport Week',
    description: 'Complete sessions in 2 different sports in one week.',
    sport: 'all',
    type: 'consistency',
    difficulty: 'intermediate',
    durationDays: 7,
    rules: [
      'Complete at least one session in two different sports.',
      'All sessions must be within 7 days.',
    ],
    rewardBadgeId: 'multi_sport',
    rewardXP: 150,
    icon: '🏟️',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const cutoff = new Date(ctx.joinedAt);
      const end = new Date(cutoff);
      end.setDate(end.getDate() + 7);
      const sports = new Set(
        ctx.sessions
          .filter(s => { const d = new Date(s.date || s.created_at); return d >= cutoff && d <= end; })
          .map(s => s.sport)
      );
      return Math.min(Math.round((sports.size / 2) * 100), 100);
    },
  },

  // ── Improvement Challenges ───────────────────────────────────
  {
    id: 'diagnose_and_drill',
    title: 'Diagnose & Drill',
    description: 'Complete a diagnostic and finish at least one training drill.',
    sport: 'all',
    type: 'skill',
    difficulty: 'beginner',
    durationDays: 14,
    rules: [
      'Complete a swing diagnostic session.',
      'Complete at least one recommended training drill.',
    ],
    rewardBadgeId: 'first_diagnosis',
    rewardXP: 100,
    icon: '🎯',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const hasDiag = ctx.sessions.some(s => s.diagnoses?.length > 0) ? 50 : 0;
      const hasDrill = Object.keys(ctx.videoAnalyses ?? {}).length >= 1 ? 50 : 0;
      return hasDiag + hasDrill;
    },
  },

  // ── Beginner Challenges ──────────────────────────────────────
  {
    id: 'beginner_first_session',
    title: 'First Steps',
    description: 'Complete your very first session on SwingIQ.',
    sport: 'all',
    type: 'beginner',
    difficulty: 'beginner',
    durationDays: 30,
    rules: ['Complete any session in any sport.'],
    rewardBadgeId: 'first_session',
    rewardXP: 50,
    icon: '🌱',
    isDataChallenge: false,
    getProgress: (ctx) => {
      return ctx.sessions.length + ctx.videoAnalyses.length >= 1 ? 100 : 0;
    },
  },
  {
    id: 'setup_and_analyze',
    title: 'Setup & Analyze',
    description: 'Set up your profile and complete a session with a diagnostic.',
    sport: 'all',
    type: 'beginner',
    difficulty: 'beginner',
    durationDays: 30,
    rules: [
      'Create your athlete profile.',
      'Complete at least one session.',
      'Run a diagnostic on your session.',
    ],
    rewardBadgeId: null,
    rewardXP: 75,
    icon: '🔍',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const hasSession = ctx.sessions.length + ctx.videoAnalyses.length >= 1 ? 50 : 0;
      const hasDiag = ctx.sessions.some(s => s.diagnoses?.length > 0) ? 50 : 0;
      return hasSession + hasDiag;
    },
  },

  // ── Tennis Challenges ────────────────────────────────────────
  {
    id: 'tennis_serve_lab',
    title: 'Tennis Serve Lab',
    description: 'Complete 3 tennis video analysis sessions.',
    sport: 'tennis',
    type: 'skill',
    difficulty: 'intermediate',
    durationDays: 14,
    rules: ['Complete 3 tennis video analysis sessions.'],
    rewardBadgeId: 'tennis_five_sessions',
    rewardXP: 150,
    icon: '🎾',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const count = ctx.videoAnalyses.filter(v => v.sport === 'tennis').length;
      return Math.min(Math.round((count / 3) * 100), 100);
    },
  },

  // ── Baseball/Softball Challenges ─────────────────────────────
  {
    id: 'baseball_contact_week',
    title: 'Baseball Contact Week',
    description: 'Complete 3 baseball hitting sessions in one week.',
    sport: 'baseball',
    type: 'consistency',
    difficulty: 'beginner',
    durationDays: 7,
    rules: ['Complete 3 baseball video analysis sessions within 7 days.'],
    rewardBadgeId: 'baseball_five_sessions',
    rewardXP: 100,
    icon: '⚾',
    isDataChallenge: false,
    getProgress: (ctx) => {
      const count = ctx.videoAnalyses.filter(v => v.sport === 'baseball').length;
      return Math.min(Math.round((count / 3) * 100), 100);
    },
  },
];

export function getChallengeProgress(
  challenge: ChallengeDefinition,
  active: ChallengeActive,
  ctx: Omit<ChallengeContext, 'joinedAt'>
): number {
  return challenge.getProgress({ ...ctx, joinedAt: active.joinedAt });
}

export function isChallengeCompleted(progress: number): boolean {
  return progress >= 100;
}

export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find(c => c.id === id);
}

export function getChallengesByType(type: string): ChallengeDefinition[] {
  return CHALLENGES.filter(c => c.type === type);
}

export function getChallengesBySport(sport: string): ChallengeDefinition[] {
  return CHALLENGES.filter(c => c.sport === sport || c.sport === 'all');
}

export function getActiveChallengesWithProgress(
  activeChallenges: ChallengeActive[],
  ctx: Omit<ChallengeContext, 'joinedAt'>
): Array<{ challenge: ChallengeDefinition; active: ChallengeActive; progress: number }> {
  return activeChallenges
    .map(active => {
      const challenge = getChallengeById(active.id);
      if (!challenge) return null;
      const progress = getChallengeProgress(challenge, active, ctx);
      return { challenge, active, progress };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
