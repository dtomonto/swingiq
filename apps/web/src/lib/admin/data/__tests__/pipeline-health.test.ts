// Mock the server-only deps so importing the module stays node-clean (the
// pure function under test needs neither).
jest.mock('@/lib/supabase-admin', () => ({ createSupabaseAdminClient: () => null }));
jest.mock('@/lib/admin/context', () => ({ requireAdmin: async () => ({ ok: false }) }));

import { computeUserPipelineHealth } from '../pipeline-health';

describe('computeUserPipelineHealth (per-user data-linkage)', () => {
  it('is healthy when every session with shots is diagnosed', () => {
    const h = computeUserPipelineHealth(
      [
        { shot_count: 12, swing_score: 80 },
        { shot_count: 5, swing_score: 70 },
      ],
      [{ id: 'a' }],
    );
    expect(h.sessions).toEqual({ total: 2, scored: 2, empty: 0, unscored: 0 });
    expect(h.analyses.total).toBe(1);
    expect(h.gaps).toEqual([]);
    expect(h.status).toBe('healthy');
  });

  it('flags empty sessions and shots-without-diagnosis as gaps', () => {
    const h = computeUserPipelineHealth(
      [
        { shot_count: 0, swing_score: null }, // empty (recorded, no shots)
        { shot_count: 8, swing_score: null }, // has shots but no diagnosis
        { shot_count: 8, swing_score: 75 }, // fully linked
      ],
      [],
    );
    expect(h.sessions).toEqual({ total: 3, scored: 1, empty: 1, unscored: 1 });
    expect(h.status).toBe('attention');
    expect(h.gaps).toHaveLength(2);
    expect(h.gaps[0]).toMatch(/empty session/);
    expect(h.gaps[1]).toMatch(/no diagnosis/);
  });

  it('handles an account with no data', () => {
    const h = computeUserPipelineHealth([], []);
    expect(h.status).toBe('healthy');
    expect(h.sessions.total).toBe(0);
    expect(h.gaps).toEqual([]);
  });
});
