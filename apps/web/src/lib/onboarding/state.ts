// ============================================================
// SwingVantage — Onboarding State Machine (pure, durable)
// ------------------------------------------------------------
// One canonical model for "how far through setup is this athlete?".
//
// Replaces the scattered, per-prompt logic (each banner/modal used
// to decide on its own whether to show, which is why returning users
// kept getting re-asked who they are). The machine is:
//
//   new_user
//     → identity_completed        (told us who they are / usage type)
//     → sport_selected            (picked a sport / created a profile)
//     → baseline_started          (entered equipment or sport profile)
//     → first_session_imported    (has a session or video analysis)
//     → active_user               (completed a full loop — diagnosed/trained)
//
// TWO rules make it durable:
//   1. NEVER REGRESS. The live state is the FURTHEST of (a) the value
//      we persisted and (b) what the user's actual data implies. So a
//      returning user with sessions is `active_user` even on a fresh
//      device, and a transient empty render can't demote them.
//   2. DERIVE FROM DATA. Existing users (who pre-date this machine) are
//      placed correctly from their profile/sessions without any backfill.
//
// This module is framework-agnostic (no React, no store import) so it
// is trivially unit-testable and reusable by the hook, the dashboard,
// and any admin tooling.
// ============================================================

export type OnboardingStateId =
  | 'new_user'
  | 'identity_completed'
  | 'sport_selected'
  | 'baseline_started'
  | 'first_session_imported'
  | 'active_user';

/** Who the athlete told us they are. Mirrors onboarding `UserType`. */
export type OnboardingRole = 'athlete' | 'parent' | 'coach' | 'team';

/** Canonical ordering. Index === rank; later === further along. */
export const ONBOARDING_ORDER: readonly OnboardingStateId[] = [
  'new_user',
  'identity_completed',
  'sport_selected',
  'baseline_started',
  'first_session_imported',
  'active_user',
] as const;

/** Numeric rank of a state (unknown → 0, treated as new_user). */
export function rankOfState(id: OnboardingStateId): number {
  const i = ONBOARDING_ORDER.indexOf(id);
  return i === -1 ? 0 : i;
}

/** The further-along of two states (the basis of the never-regress rule). */
export function furthestState(a: OnboardingStateId, b: OnboardingStateId): OnboardingStateId {
  return rankOfState(a) >= rankOfState(b) ? a : b;
}

/** True when `state` is at least as far as `min`. */
export function isAtLeast(state: OnboardingStateId, min: OnboardingStateId): boolean {
  return rankOfState(state) >= rankOfState(min);
}

/**
 * The five boolean signals derived from real user data. Kept as plain
 * booleans (not the store shape) so this module never couples to the store
 * and the mapping is testable in isolation.
 */
export interface OnboardingSignals {
  /** Told us who they are (usage category, role, or a saved profile). */
  hasIdentity: boolean;
  /** Picked a sport / created a sport-or-golf profile. */
  hasSportSelected: boolean;
  /** Entered equipment (bag) or sport-specific profile detail. */
  hasBaseline: boolean;
  /** Has at least one session or video analysis. */
  hasSession: boolean;
  /** Has completed a full loop (a diagnosis, or started training). */
  isActive: boolean;
}

/** Map real data signals → the implied state (monotonic, top-down). */
export function deriveOnboardingState(s: OnboardingSignals): OnboardingStateId {
  if (s.isActive) return 'active_user';
  if (s.hasSession) return 'first_session_imported';
  if (s.hasBaseline) return 'baseline_started';
  if (s.hasSportSelected) return 'sport_selected';
  if (s.hasIdentity) return 'identity_completed';
  return 'new_user';
}

/**
 * The live onboarding state: the FURTHEST of the persisted value and the
 * value implied by current data. This is the single function the rest of
 * the app should call — it guarantees we never regress an athlete.
 */
export function resolveOnboardingState(args: {
  stored: OnboardingStateId;
  signals: OnboardingSignals;
}): OnboardingStateId {
  return furthestState(args.stored, deriveOnboardingState(args.signals));
}

/**
 * Has the athlete answered "who are you?" — used to stop re-asking identity.
 * Once true, the usage/identity prompt must never reappear on its own.
 */
export function hasCompletedIdentity(state: OnboardingStateId): boolean {
  return isAtLeast(state, 'identity_completed');
}

/**
 * Has the athlete finished guided setup (imported real data)? `active_user`
 * is the steady state beyond setup; `first_session_imported` is the goal of
 * onboarding itself.
 */
export function isOnboardingComplete(state: OnboardingStateId): boolean {
  return isAtLeast(state, 'first_session_imported');
}

// ── Next-step guidance (the "one action at a time" source of truth) ──

export interface OnboardingNextStep {
  /** The state this guidance is for. */
  state: OnboardingStateId;
  /** Short, plain-language headline. */
  title: string;
  /** One supportive sentence on why / what happens. */
  description: string;
  /** In-app route the CTA points to. */
  href: string;
  /** Button label. */
  cta: string;
}

/**
 * The single next action for a given onboarding state. Returns null for
 * `active_user` — past setup, the dashboard's normal next-best-action
 * (the agent layer) takes over so we don't double up.
 */
export function nextOnboardingStep(
  state: OnboardingStateId,
  opts: { sportLabel?: string; isGolf?: boolean } = {},
): OnboardingNextStep | null {
  const sport = opts.sportLabel?.toLowerCase() ?? 'your sport';
  switch (state) {
    case 'new_user':
      return {
        state,
        title: 'Welcome — let’s get you set up',
        description:
          'Answer a couple of quick questions so SwingVantage can tailor everything to you. About two minutes.',
        href: '/start',
        cta: 'Get started',
      };
    case 'identity_completed':
      return {
        state,
        title: 'Pick your sport',
        description: 'Choose what you’re working on so your drills, metrics, and coaching all fit.',
        href: '/start',
        cta: 'Choose your sport',
      };
    case 'sport_selected':
      return {
        state,
        title: opts.isGolf ? 'Set up your bag' : `Set your ${sport} baseline`,
        description: opts.isGolf
          ? 'Add your clubs (or let an import build the bag for you) so gapping and grading are accurate.'
          : 'Add your equipment and a little detail so your analysis is calibrated to you.',
        href: opts.isGolf ? '/equipment/golf' : '/profile',
        cta: opts.isGolf ? 'Build my bag' : 'Set my baseline',
      };
    case 'baseline_started':
      return {
        state,
        title: 'Import your first session',
        description:
          'Bring in launch-monitor or session data — or upload a swing video — to get your first real diagnosis.',
        href: '/sessions/import',
        cta: 'Import data',
      };
    case 'first_session_imported':
      return {
        state,
        title: 'See your #1 fix',
        description: 'Your data is in. Run the analysis to find the single thing to work on first.',
        href: '/diagnose',
        cta: 'Show my top fix',
      };
    case 'active_user':
      return null;
  }
}
