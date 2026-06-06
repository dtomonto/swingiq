// ============================================================
// SwingVantage — community analytics projection tests
// ============================================================

import { badgeUnlockRows, challengeProgressRows } from '../communityAnalyticsSync';
import { DEFAULT_COMMUNITY_STATE } from '@/store';
import type { CommunityState } from '@/lib/community/types';

const UID = '11111111-1111-1111-1111-111111111111';

function community(over: Partial<CommunityState>): CommunityState {
  return { ...DEFAULT_COMMUNITY_STATE, ...over };
}

describe('badgeUnlockRows', () => {
  it('emits one row per earned badge, id = <user>:<badge>', () => {
    const c = community({
      achievementsEarned: [
        { id: 'first_session', earnedAt: '2026-06-01T00:00:00.000Z' },
        { id: 'streak_7', earnedAt: '2026-06-05T00:00:00.000Z' },
      ],
    });
    const rows = badgeUnlockRows(c, UID);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: `${UID}:first_session`, user_id: UID, badge_id: 'first_session' });
    expect(rows[1].earned_at).toBe('2026-06-05T00:00:00.000Z');
  });

  it('is empty for a fresh community', () => {
    expect(badgeUnlockRows(DEFAULT_COMMUNITY_STATE, UID)).toEqual([]);
  });
});

describe('challengeProgressRows', () => {
  it('marks active challenges active', () => {
    const c = community({
      challengesActive: [{ id: 'june_consistency', joinedAt: '2026-06-01T00:00:00.000Z', progress: 40, expiresAt: null }],
    });
    const rows = challengeProgressRows(c, UID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: `${UID}:june_consistency`, challenge_id: 'june_consistency', status: 'active', progress: 40,
    });
  });

  it('completed overrides active for the same challenge (one row, joined_at kept)', () => {
    const c = community({
      challengesActive: [{ id: 'june_consistency', joinedAt: '2026-06-01T00:00:00.000Z', progress: 80, expiresAt: null }],
      challengesCompleted: [{ id: 'june_consistency', completedAt: '2026-06-07T00:00:00.000Z', xpEarned: 150 }],
    });
    const rows = challengeProgressRows(c, UID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      challenge_id: 'june_consistency',
      status: 'completed',
      joined_at: '2026-06-01T00:00:00.000Z',
      completed_at: '2026-06-07T00:00:00.000Z',
      xp_earned: 150,
      progress: 100,
    });
  });

  it('handles a completed challenge with no prior active record', () => {
    const c = community({
      challengesCompleted: [{ id: 'solo_win', completedAt: '2026-06-07T00:00:00.000Z', xpEarned: 50 }],
    });
    const rows = challengeProgressRows(c, UID);
    expect(rows[0]).toMatchObject({ status: 'completed', joined_at: null, challenge_id: 'solo_win' });
  });
});
