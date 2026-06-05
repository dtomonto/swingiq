// ============================================================
// SwingVantage — "One Fix" Framing Layer
// ------------------------------------------------------------
// The emotional, progress-focused language SwingVantage uses to turn a
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
import type { LanguageCode } from '@/lib/i18n';
import { FIX_STRINGS_EN, resolveFixStrings, type FixStrings } from './fixFramingI18n';

export type { FixStrings };
export { resolveFixStrings } from './fixFramingI18n';

// ── CTA labels (action-oriented, never exaggerated) ───────────
// English constants kept for non-localized callers (e.g. the
// dashboard "Show Me What To Fix" button). For localized copy use
// resolveFixStrings(language) / buildTodaysFix(resume, language).
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

// Map an engine action intent to the emotionally compelling copy
// key. Falls back to the engine's own label when there's no better
// word (so we never lose accuracy for the sake of flavor).
const INTENT_KEYS: Partial<Record<ActionIntent, keyof FixStrings>> = {
  continue_plan: 'continueMyFix',
  create_plan: 'buildMy7DayPlan',
  upload_session: 'proveTheFixWorked',
  run_diagnosis: 'showMeWhatToFix',
  review_session: 'showMeWhatChanged',
  view_progress: 'showMeWhatChanged',
  generate_report: 'createMyCoachSummary',
  share_coach: 'createMyCoachSummary',
  restart: 'comebackSession',
};

export function frameActionLabel(
  intent: ActionIntent,
  fallback: string,
  strings: FixStrings = FIX_STRINGS_EN,
): string {
  const key = INTENT_KEYS[intent];
  return key ? strings[key] : fallback;
}

// Supportive comeback messaging — never shame, pressure, or fake
// urgency. Returns null when the user has been active recently.
export function comebackLine(
  daysSinceLastActivity: number | null,
  strings: FixStrings = FIX_STRINGS_EN,
): string | null {
  if (daysSinceLastActivity == null || daysSinceLastActivity < 7) return null;
  return daysSinceLastActivity < 21 ? strings.comebackPaused : strings.comebackStartOver;
}

// ── The "Today's Fix" view model ──────────────────────────────
// A presentation-ready object built purely from the resume state.
export interface TodaysFixCta {
  label: string;
  href: string;
  helperText?: string;
}

export interface TodaysFixView {
  /** Localized "Today's Fix" eyebrow. */
  eyebrow: string;
  /** Localized structural labels for the "One Fix Today" block. */
  focusLabel: string;
  whatToDoLabel: string;
  howToKnowLabel: string;
  whenToRetestLabel: string;
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
 * Reframe the deterministic resume state as a "Today's Fix" in the
 * user's coaching language (English fallback for any missing copy).
 * Reuses the engine's own routes and helper text — only the labels
 * and surrounding language change; no new facts are invented.
 */
export function buildTodaysFix(resume: ResumeState, lang?: LanguageCode | null): TodaysFixView {
  const s = resolveFixStrings(lang);
  const nba = resume.nextBestAction;
  const primary: TodaysFixCta = {
    label: frameActionLabel(nba.intent, nba.label, s),
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
    resume.practicePlanStatus === 'in_progress' ? s.whenToRetestInProgress : s.whenToRetestDefault;

  return {
    eyebrow: s.eyebrow,
    focusLabel: s.focusLabel,
    whatToDoLabel: s.whatToDoLabel,
    howToKnowLabel: s.howToKnowLabel,
    whenToRetestLabel: s.whenToRetestLabel,
    priority: resume.lastFocus ?? resume.lastGoal ?? null,
    whatToDoToday: nba.helperText ?? primary.label,
    howToKnowItWorked: s.howToKnowItWorked,
    whenToRetest,
    primary,
    retest: retestOpt ? { label: s.proveTheFixWorked, href: retestOpt.href } : null,
    rebuild: rebuildOpt ? { label: s.rebuildMyPlan, href: rebuildOpt.href } : null,
    comeback: comebackLine(resume.daysSinceLastActivity, s),
  };
}
