// ============================================================
// Founding banner — pure presentation logic (no React)
// ------------------------------------------------------------
// The copy + CTA for each banner state, and the route-hiding rule,
// extracted as pure functions so every state is unit-testable in the
// node test environment without rendering React. The .tsx component is
// a thin shell over this.
// ============================================================

import { FOUNDING_REQUIRED_SESSIONS, formatMemberNumber } from '@/lib/central-intelligence';

export type FoundingBannerState =
  | 'logged_out'
  | 'profile_incomplete'
  | 'sessions_needed'
  | 'qualified'
  | 'full';

export interface FoundingBannerContent {
  message: string;
  /** Extra context shown on ≥sm screens only (kept off mobile to stay slim). */
  detail?: string;
  cta: { label: string; href: string } | null;
}

export interface FoundingBannerOpts {
  profilePercent: number;
  validSessions: number;
  memberNumber: number | null;
}

/** Routes where the campaign bar would be noise rather than signal. */
export const FOUNDING_BANNER_HIDDEN_PREFIXES = [
  '/admin', '/login', '/signup', '/forgot-password', '/reset-password', '/auth',
];

export function isFoundingBannerHidden(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FOUNDING_BANNER_HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Minimum real qualified-member count before we surface a numeric "X / 1,000"
 * counter publicly. Below this, a bare "— / 1,000" (or "0 / 1,000") reads as
 * *negative* proof — it advertises a lack of traction to cold visitors. Until
 * the campaign has visible momentum we frame it as an achievement to earn
 * ("Join the Founding 1,000") rather than a tally to judge.
 */
export const FOUNDING_COUNTER_MIN_TO_SHOW = 25;

/** Whether the numeric counter has enough real members to motivate rather than deter. */
export function shouldShowFoundingCount(
  qualified: number | null | undefined,
  minToShow: number = FOUNDING_COUNTER_MIN_TO_SHOW,
): boolean {
  return typeof qualified === 'number' && Number.isFinite(qualified) && qualified >= minToShow;
}

export function buildFoundingBannerContent(
  state: FoundingBannerState,
  opts: FoundingBannerOpts,
): FoundingBannerContent {
  switch (state) {
    case 'qualified':
      return {
        message: opts.memberNumber != null
          ? `🏛️ You're Founding Member ${formatMemberNumber(opts.memberNumber)}!`
          : `🏛️ You qualified — claiming your Founding Member number…`,
        detail: 'Thank you for being one of the first. Your spot is locked in.',
        cta: { label: 'View your badge', href: '/profile' },
      };
    case 'sessions_needed':
      return {
        message: `Profile complete · ${opts.validSessions}/${FOUNDING_REQUIRED_SESSIONS} sessions`,
        detail: `Record ${Math.max(0, FOUNDING_REQUIRED_SESSIONS - opts.validSessions)} more valid session(s) to claim Founding Member status.`,
        cta: { label: 'Record a session', href: '/sessions' },
      };
    case 'profile_incomplete':
      return {
        message: `Your progress: Profile ${opts.profilePercent}% · ${opts.validSessions}/${FOUNDING_REQUIRED_SESSIONS} sessions`,
        detail: 'Complete your profile + record 10 sessions to qualify.',
        cta: { label: 'Complete profile', href: '/profile' },
      };
    case 'full':
      return {
        message: 'All 1,000 Founding Member spots are claimed.',
        detail: 'Thank you to our founding community — more is coming.',
        cta: null,
      };
    case 'logged_out':
    default:
      return {
        message: 'Claim your place in the first 1,000.',
        detail: 'Create your account, complete your profile, and record 10 sessions to qualify.',
        cta: { label: 'Get started', href: '/signup' },
      };
  }
}
