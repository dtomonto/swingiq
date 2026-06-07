import { runScheduledPublish } from '../schedule-runner';

describe('runScheduledPublish', () => {
  it('no-ops cleanly when persistence/autopublish are off (keyless-first)', async () => {
    // No Supabase env in tests → persistence unavailable → safe no-op.
    const r = await runScheduledPublish();
    expect(r.ran).toBe(false);
    expect(r.reason).toBeTruthy();
    expect(r.due).toBe(0);
    expect(r.published).toBe(0);
    expect(r.failed).toBe(0);
    expect(r.results).toEqual([]);
  });
});
