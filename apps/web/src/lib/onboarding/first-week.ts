// ============================================================
// SwingVantage — Guided First 7 Days (pure, local-first)
// ------------------------------------------------------------
// A deterministic day-by-day activation→habit path for new athletes: the few
// actions, in order, that turn a first visit into a returning user (the gate to
// Phase 2). Each day maps to a CONCRETE in-app action, its route, and the real
// signal that marks it done — so progress reflects what the athlete actually did,
// never a checkbox they tapped. The day actions also emit the same funnel events
// the activation funnel watches, so completion shows up in analytics.
//
// Pure: callers pass observed signals; this computes the plan + current day.
// No network, no AI. Surfaced on the dashboard for the first week, then retires.
// ============================================================

export interface FirstWeekSignals {
  /** Earliest activity timestamp (ISO) — anchors the day counter. */
  firstSeenAt?: string | null;
  hasProfile: boolean;
  /** Completed (measured) swing analyses. */
  analysesCount: number;
  /** Logged practice sessions. */
  sessionsCount: number;
  /** Built a Fix Stack on /fix. */
  fixStackCreated?: boolean;
  /** Started at least one drill. */
  drillStarted?: boolean;
  /** Completed an honest retest. */
  retestCompleted?: boolean;
}

export interface FirstWeekDay {
  day: number; // 1..7
  title: string;
  description: string;
  cta: { label: string; href: string };
  done: boolean;
}

export interface FirstWeekPlan {
  startedAt: string | null;
  /** 1..7 — the day to focus on (first not-done, or elapsed day). */
  currentDay: number;
  /** Past day 7, or every step done. */
  graduated: boolean;
  completedCount: number;
  totalDays: number;
  days: FirstWeekDay[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Build the 7-day plan from observed signals. */
export function buildFirstWeekPlan(signals: FirstWeekSignals, now: Date = new Date()): FirstWeekPlan {
  const {
    firstSeenAt = null,
    hasProfile,
    analysesCount,
    sessionsCount,
    fixStackCreated = false,
    drillStarted = false,
    retestCompleted = false,
  } = signals;

  const days: FirstWeekDay[] = [
    {
      day: 1,
      title: 'Analyze a real swing',
      description: 'Record or upload a clip in Motion Lab for a measured 3D breakdown — your first real read.',
      cta: { label: 'Open Motion Lab', href: '/motion-lab' },
      done: analysesCount >= 1,
    },
    {
      day: 2,
      title: 'See your top thing to fix',
      description: 'SwingVantage turns your read into the single highest-impact fix, with a feel cue.',
      cta: { label: 'Open Fix', href: '/fix' },
      done: fixStackCreated || analysesCount >= 1,
    },
    {
      day: 3,
      title: 'Try the matched drill',
      description: 'Practice the drill picked for your fault and level — a few focused minutes beats a long, unfocused session.',
      cta: { label: 'Start a drill', href: '/fix' },
      done: drillStarted || sessionsCount >= 1,
    },
    {
      day: 4,
      title: 'Log a practice session',
      description: 'Record what you worked on so your progress and trends have something to build from.',
      cta: { label: 'Log a session', href: '/sessions/log' },
      done: sessionsCount >= 1,
    },
    {
      day: 5,
      title: 'Build your profile',
      description: 'Add your sport, level and goals so reads are graded against you — not a tour pro.',
      cta: { label: 'Complete profile', href: '/profile' },
      done: hasProfile,
    },
    {
      day: 6,
      title: 'Retest to prove it worked',
      description: 'A fair before/after is the honest way to know a change stuck. Re-analyze the same swing.',
      cta: { label: 'Retest', href: '/retest' },
      done: retestCompleted || analysesCount >= 2,
    },
    {
      day: 7,
      title: 'See your path forward',
      description: 'Your Athletic Journey shows where you are and the next stage to train toward.',
      cta: { label: 'Open Journey', href: '/journey' },
      done: sessionsCount >= 2 || analysesCount >= 2,
    },
  ];

  const completedCount = days.filter((d) => d.done).length;

  // Elapsed day from first-seen (1-based), capped at 8 (>7 = graduated window).
  let elapsedDay = 1;
  if (firstSeenAt) {
    const start = new Date(firstSeenAt).getTime();
    if (Number.isFinite(start)) {
      elapsedDay = Math.floor((now.getTime() - start) / DAY_MS) + 1;
    }
  }

  const firstNotDone = days.find((d) => !d.done)?.day;
  const allDone = completedCount === days.length;
  const graduated = allDone || elapsedDay > 7;

  // Focus the earliest unfinished step, but never behind where time has carried them.
  const currentDay = allDone
    ? 7
    : Math.min(7, Math.max(firstNotDone ?? 1, Math.min(elapsedDay, firstNotDone ?? elapsedDay)));

  return {
    startedAt: firstSeenAt,
    currentDay,
    graduated,
    completedCount,
    totalDays: days.length,
    days,
  };
}
