// Entity search engine. Users/analyses are service-role-backed (absent in the
// test env, so they're skipped gracefully); milestones come from the local
// registry and are always searchable.
import { searchEntities } from '../entity-search';

describe('searchEntities', () => {
  it('requires at least 2 characters', async () => {
    expect(await searchEntities('a')).toEqual([]);
    expect(await searchEntities(' ')).toEqual([]);
  });

  it('finds milestones by their verified metric (no DB needed)', async () => {
    const results = await searchEntities('milestone');
    const m = results.find((r) => r.type === 'milestone');
    expect(m).toBeDefined();
    expect(m!.label).toBeTruthy();
    expect(m!.href).toBeTruthy();
  });

  it('never throws when the service role is unavailable', async () => {
    await expect(searchEntities('sports')).resolves.toBeInstanceOf(Array);
  });

  it('returns honest, typed results only', async () => {
    const results = await searchEntities('guide');
    for (const r of results) {
      expect(['user', 'analysis', 'milestone']).toContain(r.type);
      expect(r.href.startsWith('/')).toBe(true);
    }
  });
});
