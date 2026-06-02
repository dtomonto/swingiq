// ============================================================
// SwingIQ — "One Fix" Framing Layer
// ------------------------------------------------------------
// The emotional, progress-focused language SwingIQ uses to turn a
// one-time analyzer into a personal improvement companion:
//   Upload → one priority fix → drill → log → retest → see change.
//
// This is a CENTRALIZED copy module (no copy scattered across
// components) and a thin reframing helper that sits on top of the
// existing deterministic agent engine. It does NOT invent new data
// or make claims — it only relabels and re-frames what the
// `resume` (Welcome Back) workflow already computed.
//
// Framework-agnostic (no React) so it can be reused by any card,
// the onboarding flow, or future translations. English is the
// source of truth; the structure is translation-ready.
// ============================================================

import type { ResumeState, ActionIntent } from '@/lib/agents/types';

// ── CTA labels (action-oriented, never exaggerated) ───────────
export const FIX_CTA = {
  findMyOneFix: 'Find My One Fix',
  startMyFreeSwingCheck: 'Start My Free Swing Check',
  buildMy7DayPlan: 'Build My 7-Day Plan',
  startMy7DayFix: 'Start My 7-Day Fix',
  showMeWhatToFix: 'Show Me What To Fix',
  proveTheFixWorked: 'Prove the Fix Worked',
  saveMyProgress: 'Save My Progress',
  continueMyFix: 'Continue My Fix',
  continueMySwingJourney: 'Continue My Swing Journey',
  createMyCoachSummary: 'Create My Coach Summary',
  startASwingStreak: 'Start a Swing Streak',
  joinA7DayChallenge: 'Join a 7-Day Challenge',
  rebuildMyPlan: 'Rebuild My Plan',
  showMeWhatChanged: 'Show Me What Changed',
  comebackSession: 'Comeback Session — One Drill',
} as const;

// ── Structural labels for the "One Fix Today" pattern ─────────
export const FIX_FRAMING = {
  eyebrow: "Today's Fix",
  focusLabel: 'Current focus',
  whatToDoLabel: 'What to do today',
  howToKnowLabel: "How you'll know it worked",
  whenToRetestLabel: 'When to retest',
} as const;

// Map an engine action intent to emotionally compelling copy.
// Falls back to the engine's own label when there's no better word
// (so we never lose accuracy for the sake of flavor).
const INTENT_LABELS: Partial<Record<ActionIntent, string>> = {
  continue_plan: FIX_CTA.continueMyFix,
  create_plan: FIX_CTA.buildMy7DayPlan,
  upload_session: FIX_CTA.proveTheFixWorked,
  run_diagnosis: FIX_CTA.showMeWhatToFix,
  review_session: FIX_CTA.showMeWhatChanged,
  view_progress: FIX_CTA.showMeWhatChanged,
  generate_report: FIX_CTA.createMyCoachSummary,
  share_coach: FIX_CTA.createMyCoachSummary,
  restart: FIX_CTA.comebackSession,
};

export function frameActionLabel(intent: ActionIntent, fallback: string): string {
  return INTENT_LABELS[intent] ?? fallback;
}

// Supportive comeback messaging — never shame, pressure, or fake
// urgency. Returns null when the user has been active recently.
export function comebackLine(daysSinceLastActivity: number | null): string | null {
  if (daysSinceLastActivity == null || daysSinceLastActivity < 7) return null;
  if (daysSinceLastActivity < 21) {
    return 'Your progress is paused, not lost. One short session restarts your rhythm.';
  }
  return 'No need to start over — continue from your last fix. One drill, no judgment.';
}

// ── The "Today's Fix" view model ──────────────────────────────
// A presentation-ready object built purely from the resume state.
export interface TodaysFixCta {
  label: string;
  href: string;
  helperText?: string;
}

export interface TodaysFixView {
  eyebrow: string;
  /** The single thing to focus on (last/ current top priority). */
  priority: string | null;
  whatToDoToday: string;
  howToKnowItWorked: string;
  whenToRetest: string;
  /** Primary action — "Continue". */
  primary: TodaysFixCta;
  /** Retest path — "Prove the Fix Worked" (omitted if not applicable). */
  retest: TodaysFixCta | null;
  /** Rebuild the plan (omitted if not applicable or same as primary). */
  rebuild: TodaysFixCta | null;
  /** Supportive comeback line for returning users (or null). */
  comeback: string | null;
}

/**
 * Reframe the deterministic resume state as a "Today's Fix".
 * Reuses the engine's own routes and helper text — only the
 * labels and surrounding language change.
 */
export function buildTodaysFix(resume: ResumeState): TodaysFixView {
  const nba = resume.nextBestAction;
  const primary: TodaysFixCta = {
    label: frameActionLabel(nba.intent, nba.label),
    href: nba.href,
    helperText: nba.helperText,
  };

  const retestOpt = resume.options.find(
    (o) => (o.intent === 'upload_session' || o.intent === 'run_diagnosis') && o.href !== primary.href,
  );
  const rebuildOpt = resume.options.find(
    (o) => (o.intent === 'create_plan' || o.intent === 'continue_plan') && o.href !== primary.href,
  );

  const whenToRetest =
    resume.practicePlanStatus === 'in_progress'
      ? 'After your next short practice session, retest to compare.'
      : 'Once you’ve done a drill or two, retest to see what changed.';

  return {
    eyebrow: FIX_FRAMING.eyebrow,
    priority: resume.lastFocus ?? resume.lastGoal ?? null,
    whatToDoToday: nba.helperText ?? primary.label,
    howToKnowItWorked:
      'Re-run your swing check and compare it to your last result — look for your focus area improving.',
    whenToRetest,
    primary,
    retest: retestOpt ? { label: FIX_CTA.proveTheFixWorked, href: retestOpt.href } : null,
    rebuild: rebuildOpt ? { label: FIX_CTA.rebuildMyPlan, href: rebuildOpt.href } : null,
    comeback: comebackLine(resume.daysSinceLastActivity),
  };
}
