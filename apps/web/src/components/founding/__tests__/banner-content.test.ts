// ============================================================
// Founding banner — content + hide-rule tests (all states render)
// ============================================================

import {
  buildFoundingBannerContent,
  isFoundingBannerHidden,
  shouldShowFoundingCount,
  FOUNDING_COUNTER_MIN_TO_SHOW,
} from '../banner-content';
import { FOUNDING_REQUIRED_SESSIONS } from '@/lib/central-intelligence';

const opts = (over: Partial<{ profilePercent: number; validSessions: number; memberNumber: number | null }> = {}) => ({
  profilePercent: 50,
  validSessions: 4,
  memberNumber: null,
  ...over,
});

describe('founding banner content', () => {
  it('logged-out state shows the campaign pitch + sign-up CTA', () => {
    const c = buildFoundingBannerContent('logged_out', opts());
    expect(c.message).toMatch(/first 1,000/i);
    expect(c.cta?.href).toBe('/signup');
  });

  it('profile-incomplete state shows percent + sessions + profile CTA', () => {
    const c = buildFoundingBannerContent('profile_incomplete', opts({ profilePercent: 60, validSessions: 2 }));
    expect(c.message).toContain('60%');
    expect(c.message).toContain(`2/${FOUNDING_REQUIRED_SESSIONS}`);
    expect(c.cta?.href).toBe('/profile');
  });

  it('sessions-needed state shows remaining sessions + record CTA', () => {
    const c = buildFoundingBannerContent('sessions_needed', opts({ validSessions: 6 }));
    expect(c.message).toContain(`6/${FOUNDING_REQUIRED_SESSIONS}`);
    expect(c.detail).toContain('4'); // 10 - 6 remaining
    expect(c.cta?.href).toBe('/sessions');
  });

  it('qualified state shows the member number when assigned', () => {
    const c = buildFoundingBannerContent('qualified', opts({ memberNumber: 42 }));
    expect(c.message).toContain('#042');
    expect(c.cta?.href).toBe('/profile');
  });

  it('qualified state shows a claiming message before the number resolves', () => {
    const c = buildFoundingBannerContent('qualified', opts({ memberNumber: null }));
    expect(c.message).toMatch(/claiming/i);
  });

  it('full state shows the all-claimed message and no CTA', () => {
    const c = buildFoundingBannerContent('full', opts());
    expect(c.message).toMatch(/claimed/i);
    expect(c.cta).toBeNull();
  });
});

describe('founding numeric counter visibility (no negative proof)', () => {
  it('hides the count when unknown (null/undefined) — avoids "— / 1,000"', () => {
    expect(shouldShowFoundingCount(null)).toBe(false);
    expect(shouldShowFoundingCount(undefined)).toBe(false);
  });
  it('hides the count for a small, deterring number of members', () => {
    expect(shouldShowFoundingCount(0)).toBe(false);
    expect(shouldShowFoundingCount(FOUNDING_COUNTER_MIN_TO_SHOW - 1)).toBe(false);
  });
  it('shows the count once it reads as real momentum', () => {
    expect(shouldShowFoundingCount(FOUNDING_COUNTER_MIN_TO_SHOW)).toBe(true);
    expect(shouldShowFoundingCount(500)).toBe(true);
  });
  it('respects a custom threshold', () => {
    expect(shouldShowFoundingCount(5, 5)).toBe(true);
    expect(shouldShowFoundingCount(4, 5)).toBe(false);
  });
});

describe('founding banner hide rule', () => {
  it('hides on admin + auth routes', () => {
    for (const p of ['/admin', '/admin/central-intelligence', '/login', '/signup', '/reset-password']) {
      expect(isFoundingBannerHidden(p)).toBe(true);
    }
  });
  it('shows on public + app routes', () => {
    for (const p of ['/', '/dashboard', '/profile', '/sessions', '/sports/golf']) {
      expect(isFoundingBannerHidden(p)).toBe(false);
    }
  });
  it('is safe with a null pathname', () => {
    expect(isFoundingBannerHidden(null)).toBe(false);
  });
});
