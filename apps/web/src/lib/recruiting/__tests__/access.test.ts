// ============================================================
// SwingVantage — Recruiting: coach-view authorization — Unit Tests
// ============================================================

import { hashPassword, type CoachViewSnapshot } from '../share';
import type { ShareLink } from '../types';
import { authorizeCoachView, COACH_VIEW_DENIAL_STATUS } from '../access';

const snap = (o: Partial<CoachViewSnapshot> = {}): CoachViewSnapshot =>
  ({ passwordProtected: false, ...o }) as CoachViewSnapshot;

const link = (o: Partial<ShareLink> = {}): ShareLink =>
  ({ active: true, revokedAt: null, expiresAt: null, ...o }) as ShareLink;

const past = new Date(Date.now() - 86_400_000).toISOString();

describe('authorizeCoachView', () => {
  it('denies + withholds when there is no snapshot', () => {
    const res = authorizeCoachView({ snapshot: null });
    expect(res.ok).toBe(false);
    expect(res.denial).toBe('not_found');
    expect(res.snapshot).toBeUndefined();
  });

  it('denies a revoked link and withholds the snapshot', () => {
    const res = authorizeCoachView({ link: link({ revokedAt: new Date().toISOString() }), snapshot: snap() });
    expect(res.ok).toBe(false);
    expect(res.denial).toBe('revoked_or_expired');
    expect(res.snapshot).toBeUndefined();
  });

  it('denies an expired link', () => {
    const res = authorizeCoachView({ link: link({ expiresAt: past }), snapshot: snap() });
    expect(res.denial).toBe('revoked_or_expired');
    expect(res.snapshot).toBeUndefined();
  });

  it('releases the snapshot for an active, non-password link', () => {
    const res = authorizeCoachView({ link: link(), snapshot: snap() });
    expect(res.ok).toBe(true);
    expect(res.snapshot).toBeDefined();
  });

  it('requires a password before releasing a protected snapshot', () => {
    const res = authorizeCoachView({
      link: link(),
      snapshot: snap({ passwordProtected: true, passwordHash: hashPassword('secret') }),
    });
    expect(res.ok).toBe(false);
    expect(res.denial).toBe('password_required');
    expect(res.snapshot).toBeUndefined();
  });

  it('rejects an incorrect password and withholds the snapshot', () => {
    const res = authorizeCoachView({
      link: link(),
      snapshot: snap({ passwordProtected: true, passwordHash: hashPassword('secret') }),
      providedPassword: 'wrong',
    });
    expect(res.ok).toBe(false);
    expect(res.denial).toBe('password_incorrect');
    expect(res.snapshot).toBeUndefined();
  });

  it('releases the snapshot only once the correct password is supplied', () => {
    const res = authorizeCoachView({
      link: link(),
      snapshot: snap({ passwordProtected: true, passwordHash: hashPassword('secret') }),
      providedPassword: 'secret',
    });
    expect(res.ok).toBe(true);
    expect(res.snapshot).toBeDefined();
  });

  it('maps every denial to a sensible HTTP status', () => {
    expect(COACH_VIEW_DENIAL_STATUS.not_found).toBe(404);
    expect(COACH_VIEW_DENIAL_STATUS.revoked_or_expired).toBe(410);
    expect(COACH_VIEW_DENIAL_STATUS.password_required).toBe(401);
    expect(COACH_VIEW_DENIAL_STATUS.password_incorrect).toBe(401);
  });
});
