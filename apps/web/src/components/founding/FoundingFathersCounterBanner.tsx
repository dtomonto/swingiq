'use client';

// ============================================================
// FoundingFathersCounterBanner — global top-of-page counter
// ------------------------------------------------------------
// A slim, premium, non-intrusive bar shown at the top of every public
// + app page (hidden on /admin and auth screens). Shows progress toward
// the first 1,000 Founding Members and, for signed-in users, their own
// progress + a contextual CTA.
//
// Lives in normal document flow at the very top of <body> so it never
// overlaps sticky headers or the bottom-right help dock, and simply
// scrolls away with the page. Theme-safe (bg-primary/text-primary-
// foreground is a designed AA pair across all 7 themes), keyboard +
// screen-reader friendly, and responsive (collapses to count + CTA on
// mobile). Never renders private data.
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { FOUNDING_REQUIRED_COUNT, FOUNDING_REQUIRED_SESSIONS, formatMemberNumber } from '@/lib/central-intelligence';
import { useFoundingProgress, type FoundingBannerState } from './useFoundingProgress';

/** Routes where the campaign bar would be noise rather than signal. */
const HIDDEN_PREFIXES = ['/admin', '/login', '/signup', '/forgot-password', '/reset-password', '/auth'];

interface BannerContent {
  message: string;
  /** Extra context shown on ≥sm screens only (kept off mobile to stay slim). */
  detail?: string;
  cta: { label: string; href: string } | null;
}

function buildContent(
  state: FoundingBannerState,
  opts: { profilePercent: number; validSessions: number; memberNumber: number | null },
): BannerContent {
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
        detail: `Record ${FOUNDING_REQUIRED_SESSIONS - opts.validSessions} more valid session(s) to claim Founding Member status.`,
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

export function FoundingFathersCounterBanner() {
  const pathname = usePathname();
  const { mounted, campaign, completion, user, memberNumber, bannerState } = useFoundingProgress();

  const lastTracked = useRef<string>('');
  useEffect(() => {
    if (!mounted) return;
    if (lastTracked.current === bannerState) return;
    lastTracked.current = bannerState;
    track(ANALYTICS_EVENTS.FOUNDING_BANNER_VIEWED, { banner_state: bannerState });
  }, [mounted, bannerState]);

  if (pathname && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const required = campaign?.requiredCount ?? FOUNDING_REQUIRED_COUNT;
  const qualified = campaign?.qualifiedCount;
  // Before mount/hydration, render the neutral logged-out shell so server and
  // client markup match; personalized state fills in after mount.
  const effectiveState: FoundingBannerState = mounted ? bannerState : 'logged_out';
  const content = buildContent(effectiveState, {
    profilePercent: completion.completionPercent,
    validSessions: user.validSessionCount,
    memberNumber,
  });

  const onCta = () => {
    track(ANALYTICS_EVENTS.FOUNDING_CTA_CLICKED, { banner_state: effectiveState, cta: content.cta?.label ?? '' });
  };

  return (
    <aside
      role="region"
      aria-label="Founding Members campaign progress"
      className="w-full bg-primary text-primary-foreground"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-1.5 text-xs sm:text-sm">
        {/* Count — announced to screen readers when it changes. */}
        <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap" aria-live="polite">
          <span aria-hidden="true">🏛️</span>
          <span>
            Founding Members:{' '}
            <span className="tabular-nums">{qualified ?? '—'}</span>
            <span className="opacity-80"> / {required.toLocaleString()}</span>
          </span>
        </span>

        <span className="hidden h-3 w-px bg-current opacity-30 sm:inline-block" aria-hidden="true" />

        {/* Contextual message + CTA */}
        <span className="text-center">
          <span className="font-medium">{content.message}</span>
          {content.detail && <span className="ml-1 hidden opacity-90 sm:inline">{content.detail}</span>}
        </span>

        {content.cta && (
          <Link
            href={content.cta.href}
            onClick={onCta}
            className="rounded-full bg-primary-foreground px-3 py-0.5 text-xs font-semibold text-primary underline-offset-2 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {content.cta.label}
          </Link>
        )}
      </div>
    </aside>
  );
}
