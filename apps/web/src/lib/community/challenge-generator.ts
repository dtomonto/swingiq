// ============================================================
// SwingVantage Community — per-sport challenge generator
// ------------------------------------------------------------
// Each sport is a standalone product, so each sport gets its OWN full journey:
// feature families (swing analysis, diagnosis→drill, consistency, progress, …),
// each LAYERED into a top-level milestone (tier 1) plus sub-challenges (tier 2)
// that go deeper inside that same feature. A single-sport athlete (e.g. softball
// only) can complete enough of THEIR sport's founding-tagged challenges to earn
// the Founding Member badge — we never push a second sport.
//
// Generated from templates × the 7 sports, so the library scales: ~36 per sport
// → 250+ system-wide, with ~20 per sport flagged `founding`. Progress is grounded
// in real logged activity (sport-filtered video analyses, sessions, diagnoses,
// exports) — never fabricated.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { ChallengeContext, ChallengeDefinition, ChallengeType, ChallengeDifficulty } from './types';

interface SportMeta {
  id: SportId;
  label: string;
  icon: string;
}

/** Every sport ships its own journey. Order is display order. */
export const JOURNEY_SPORTS: SportMeta[] = [
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'pickleball', label: 'Pickleball', icon: '🏓' },
  { id: 'padel', label: 'Padel', icon: '🎾' },
  { id: 'baseball', label: 'Baseball', icon: '⚾' },
  { id: 'softball_slow', label: 'Slow-Pitch Softball', icon: '🥎' },
  { id: 'softball_fast', label: 'Fastpitch Softball', icon: '🥎' },
];

// ── Real-signal helpers (sport-filtered; never fabricated) ──
const pct = (n: number, target: number): number => Math.min(100, Math.round((n / Math.max(1, target)) * 100));
const vids = (ctx: ChallengeContext, sport: SportId): number =>
  ctx.videoAnalyses.filter((v) => v.sport === sport).length;
const sessionsFor = (ctx: ChallengeContext, sport: SportId): number =>
  ctx.sessions.filter((s) => (s as { sport?: string }).sport === sport).length;
const diagnoses = (ctx: ChallengeContext, sport: SportId): number =>
  ctx.sessions.filter((s) => (s as { sport?: string }).sport === sport && (s.diagnoses?.length ?? 0) > 0).length;
const activity = (ctx: ChallengeContext, sport: SportId): number => vids(ctx, sport) + sessionsFor(ctx, sport);

type Progress = (ctx: ChallengeContext, sport: SportId) => number;

interface StepTemplate {
  key: string;
  title: (label: string) => string;
  description: (label: string) => string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  durationDays: number;
  rewardXP: number;
  icon: string;
  founding: boolean;
  progress: Progress;
}

interface FeatureFamily {
  feature: string;
  /** steps[0] is the tier-1 milestone; the rest are tier-2 sub-challenges. */
  steps: StepTemplate[];
}

// Helper to build a step concisely.
const step = (
  key: string,
  title: (l: string) => string,
  description: (l: string) => string,
  progress: Progress,
  opts: Partial<Pick<StepTemplate, 'type' | 'difficulty' | 'durationDays' | 'rewardXP' | 'icon' | 'founding'>> = {},
): StepTemplate => ({
  key,
  title,
  description,
  progress,
  type: opts.type ?? 'skill',
  difficulty: opts.difficulty ?? 'beginner',
  durationDays: opts.durationDays ?? 30,
  rewardXP: opts.rewardXP ?? 100,
  icon: opts.icon ?? '🎯',
  founding: opts.founding ?? false,
});

const FEATURE_FAMILIES: FeatureFamily[] = [
  // 1) Getting started (founding)
  {
    feature: 'getting-started',
    steps: [
      step('begin', (l) => `Start your ${l} journey`, (l) => `Take your first action in SwingVantage for ${l}.`,
        (c, s) => pct(activity(c, s), 1), { type: 'beginner', founding: true, icon: '🚀', rewardXP: 50 }),
      step('first-swing', (l) => `Analyze your first ${l} swing`, (l) => `Record or upload one ${l} swing and review it.`,
        (c, s) => pct(vids(c, s), 1), { type: 'skill', founding: true, icon: '🎥', rewardXP: 100 }),
      step('first-session', (l) => `Log your first ${l} session`, (l) => `Save your first ${l} practice session.`,
        (c, s) => pct(sessionsFor(c, s), 1), { type: 'consistency', founding: true, icon: '📋', rewardXP: 100 }),
      step('first-diagnosis', (l) => `Get your first ${l} diagnosis`, (l) => `Run a ${l} analysis that returns a diagnosis.`,
        (c, s) => pct(diagnoses(c, s), 1), { type: 'skill', founding: true, icon: '🔎', rewardXP: 120 }),
    ],
  },
  // 2) Swing analysis (founding)
  {
    feature: 'swing-analysis',
    steps: [
      step('master', (l) => `Master ${l} swing analysis`, (l) => `Use the swing analysis tool on a ${l} swing.`,
        (c, s) => pct(vids(c, s), 1), { founding: true, icon: '🎬', rewardXP: 100 }),
      step('analyze-3', (l) => `Analyze 3 ${l} swings`, (l) => `Build a baseline with three ${l} swing analyses.`,
        (c, s) => pct(vids(c, s), 3), { founding: true, icon: '🎬', rewardXP: 150 }),
      step('analyze-10', (l) => `Analyze 10 ${l} swings`, (l) => `Go deep — ten ${l} swing analyses logged.`,
        (c, s) => pct(vids(c, s), 10), { difficulty: 'advanced', founding: true, icon: '🏆', rewardXP: 300 }),
      step('compare', (l) => `Compare two ${l} swings`, (l) => `Compare two ${l} analyses to see what changed.`,
        (c, s) => pct(vids(c, s), 2), { founding: true, icon: '🆚', rewardXP: 150 }),
    ],
  },
  // 3) Diagnosis → drills (founding)
  {
    feature: 'diagnosis-drills',
    steps: [
      step('diagnose', (l) => `Fix a ${l} fault`, (l) => `Get a ${l} diagnosis and a prescribed drill.`,
        (c, s) => pct(diagnoses(c, s), 1), { type: 'improvement', founding: true, icon: '🛠️', rewardXP: 120 }),
      step('work-drill', (l) => `Work a prescribed ${l} drill`, (l) => `Practice the drill from your ${l} diagnosis.`,
        (c, s) => pct(sessionsFor(c, s), 2), { type: 'improvement', founding: true, icon: '🔁', rewardXP: 150 }),
      step('retest', (l) => `Retest a ${l} fix`, (l) => `Re-analyze your ${l} swing after working the drill.`,
        (c, s) => pct(vids(c, s), 4), { type: 'improvement', founding: true, icon: '✅', rewardXP: 180 }),
      step('three-faults', (l) => `Address 3 ${l} diagnoses`, (l) => `Diagnose and work three different ${l} faults.`,
        (c, s) => pct(diagnoses(c, s), 3), { type: 'improvement', difficulty: 'intermediate', founding: true, icon: '🧩', rewardXP: 250 }),
    ],
  },
  // 4) Consistency (founding)
  {
    feature: 'consistency',
    steps: [
      step('routine', (l) => `Build a ${l} routine`, (l) => `Log three ${l} sessions to start a habit.`,
        (c, s) => pct(sessionsFor(c, s), 3), { type: 'consistency', founding: true, icon: '📆', rewardXP: 120 }),
      step('five', (l) => `Log 5 ${l} sessions`, (l) => `Five ${l} sessions in the books.`,
        (c, s) => pct(sessionsFor(c, s), 5), { type: 'consistency', founding: true, icon: '📆', rewardXP: 180 }),
      step('ten', (l) => `Log 10 ${l} sessions`, (l) => `Ten ${l} sessions — real consistency.`,
        (c, s) => pct(sessionsFor(c, s), 10), { type: 'consistency', difficulty: 'advanced', founding: true, icon: '🔥', rewardXP: 300 }),
      step('mix', (l) => `Round out your ${l} work`, (l) => `Combine ${l} video analysis with logged sessions.`,
        (c, s) => pct(activity(c, s), 7), { type: 'consistency', founding: true, icon: '⚖️', rewardXP: 200 }),
    ],
  },
  // 5) Progress & timeline (founding)
  {
    feature: 'progress',
    steps: [
      step('track', (l) => `Track your ${l} progress`, (l) => `Build enough ${l} history to see a trend.`,
        (c, s) => pct(activity(c, s), 2), { type: 'improvement', founding: true, icon: '📈', rewardXP: 100 }),
      step('timeline', (l) => `Build a ${l} timeline`, (l) => `Accumulate five ${l} events on your timeline.`,
        (c, s) => pct(activity(c, s), 5), { type: 'improvement', founding: true, icon: '🗺️', rewardXP: 180 }),
      step('personal-best', (l) => `Set a ${l} personal best`, (l) => `Log enough ${l} analyses to register a best.`,
        (c, s) => pct(vids(c, s), 3), { type: 'personal_best', founding: true, icon: '🥇', rewardXP: 200 }),
      step('month', (l) => `Complete a ${l} month`, (l) => `A full month of ${l} progress — twelve actions.`,
        (c, s) => pct(activity(c, s), 12), { type: 'improvement', difficulty: 'advanced', founding: true, icon: '📅', rewardXP: 300 }),
    ],
  },
  // 6) Practice planning
  {
    feature: 'practice-plan',
    steps: [
      step('plan', (l) => `Plan your ${l} practice`, (l) => `Generate a ${l} practice plan to follow.`,
        (c, s) => pct(activity(c, s), 1), { type: 'skill', icon: '📝', rewardXP: 90 }),
      step('follow', (l) => `Complete a planned ${l} session`, (l) => `Run a session from your ${l} plan.`,
        (c, s) => pct(sessionsFor(c, s), 2), { type: 'skill', icon: '✅', rewardXP: 120 }),
      step('week', (l) => `Run a full ${l} practice week`, (l) => `Four planned ${l} sessions in a week.`,
        (c, s) => pct(sessionsFor(c, s), 4), { type: 'consistency', difficulty: 'intermediate', icon: '🗓️', rewardXP: 200 }),
      step('refine', (l) => `Refine your ${l} plan`, (l) => `Use ${l} results to adjust your next plan.`,
        (c, s) => pct(activity(c, s), 6), { type: 'improvement', icon: '🔧', rewardXP: 180 }),
    ],
  },
  // 7) Mental performance
  {
    feature: 'mental',
    steps: [
      step('focus', (l) => `Train ${l} focus`, (l) => `Start a mental-performance routine for ${l}.`,
        (c, s) => pct(activity(c, s), 1), { type: 'skill', icon: '🧠', rewardXP: 90 }),
      step('routine', (l) => `Run a ${l} mental routine`, (l) => `Complete a pre-performance reset for ${l}.`,
        (c, s) => pct(activity(c, s), 3), { type: 'skill', icon: '🧘', rewardXP: 130 }),
      step('pressure', (l) => `Practice ${l} under pressure`, (l) => `Build a composure habit across ${l} sessions.`,
        (c, s) => pct(activity(c, s), 6), { type: 'skill', difficulty: 'intermediate', icon: '💪', rewardXP: 180 }),
    ],
  },
  // 8) Equipment
  {
    feature: 'equipment',
    steps: [
      step('gear', (l) => `Dial in your ${l} gear`, (l) => `Set up your ${l} equipment in SwingVantage.`,
        (c, s) => pct(activity(c, s), 1), { type: 'skill', icon: '🎒', rewardXP: 90 }),
      step('log', (l) => `Log ${l} gear in a session`, (l) => `Tie your ${l} equipment to real sessions.`,
        (c, s) => pct(sessionsFor(c, s), 2), { type: 'skill', icon: '🏷️', rewardXP: 120 }),
      step('optimize', (l) => `Optimize your ${l} setup`, (l) => `Use ${l} results to tune your equipment.`,
        (c, s) => pct(vids(c, s), 2), { type: 'improvement', icon: '⚙️', rewardXP: 150 }),
    ],
  },
  // 9) Motion Lab (deep analysis)
  {
    feature: 'motion-lab',
    steps: [
      step('lab', (l) => `Go deep with ${l} Motion Lab`, (l) => `Run a Motion Lab analysis on a ${l} swing.`,
        (c, s) => pct(vids(c, s), 1), { type: 'skill', icon: '🔬', rewardXP: 120 }),
      step('kinetic', (l) => `Review your ${l} kinetic chain`, (l) => `Study the sequencing in your ${l} motion.`,
        (c, s) => pct(vids(c, s), 2), { type: 'skill', difficulty: 'intermediate', icon: '🧬', rewardXP: 160 }),
      step('three-d', (l) => `Study a ${l} 3D capture`, (l) => `Explore a ${l} swing in 3D Motion Lab.`,
        (c, s) => pct(vids(c, s), 3), { type: 'skill', difficulty: 'advanced', icon: '🎛️', rewardXP: 220 }),
    ],
  },
  // 10) Data mastery
  {
    feature: 'data-mastery',
    steps: [
      step('protect', (l) => `Protect your ${l} data`, (l) => `Export a backup of your ${l} progress.`,
        (c) => pct(c.exportCount, 1), { type: 'data', icon: '💾', rewardXP: 100 }),
      step('milestone', (l) => `Bank a ${l} milestone`, (l) => `Reach a ${l} milestone and back it up.`,
        (c, s) => Math.round(0.6 * pct(activity(c, s), 3) + 0.4 * pct(c.exportCount, 1)), { type: 'data', icon: '🏁', rewardXP: 160 }),
      step('habit', (l) => `Make ${l} backups a habit`, (l) => `Export your ${l} data more than once.`,
        (c) => pct(c.exportCount, 2), { type: 'data', difficulty: 'intermediate', icon: '🛡️', rewardXP: 180 }),
    ],
  },
];

/** Generate every per-sport, layered challenge from the templates. */
export function generateSportChallenges(): ChallengeDefinition[] {
  const out: ChallengeDefinition[] = [];
  for (const sport of JOURNEY_SPORTS) {
    for (const family of FEATURE_FAMILIES) {
      const parentKey = family.steps[0]?.key;
      family.steps.forEach((stp, i) => {
        const id = `${sport.id}__${family.feature}__${stp.key}`;
        out.push({
          id,
          title: `${sport.label}: ${stp.title(sport.label)}`,
          description: stp.description(sport.label),
          sport: sport.id,
          type: stp.type,
          difficulty: stp.difficulty,
          durationDays: stp.durationDays,
          rules: [stp.description(sport.label)],
          rewardBadgeId: null,
          rewardXP: stp.rewardXP,
          icon: stp.icon,
          isDataChallenge: stp.type === 'data',
          getProgress: (ctx) => stp.progress(ctx, sport.id),
          feature: family.feature,
          tier: i === 0 ? 1 : 2,
          parentId: i === 0 ? null : `${sport.id}__${family.feature}__${parentKey}`,
          founding: stp.founding,
        });
      });
    }
  }
  return out;
}

/** The founding-journey pool, optionally scoped to a single sport. */
export function foundingJourneyChallenges(sport?: SportId): ChallengeDefinition[] {
  return generateSportChallenges().filter((c) => c.founding && (!sport || c.sport === sport));
}

/** How many founding challenges a sport offers (each sport is self-sufficient). */
export function foundingChallengeCountForSport(sport: SportId): number {
  return foundingJourneyChallenges(sport).length;
}
