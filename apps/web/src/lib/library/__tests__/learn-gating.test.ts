// Public /learn exposure gate: every item shows in-app (getLibraryItems),
// but only `public` items are listed publicly (getLearnItems) so new training
// videos can be rolled out to search gradually.
import { getLibraryItems, getLearnItems } from '../index';

describe('getLearnItems (public /learn gate)', () => {
  it('returns only publicly-listed items', () => {
    const learn = getLearnItems();
    expect(learn.length).toBeGreaterThan(0);
    expect(learn.every((i) => i.public)).toBe(true);
  });

  it('is a subset of the full in-app library', () => {
    const all = getLibraryItems();
    const learn = getLearnItems();
    expect(learn.length).toBeLessThanOrEqual(all.length);
    const allIds = new Set(all.map((i) => i.id));
    expect(learn.every((i) => allIds.has(i.id))).toBe(true);
  });

  it('keeps the originally-published training videos public', () => {
    const ids = new Set(getLearnItems().map((i) => i.id));
    expect(ids.has('swing-path')).toBe(true);
    expect(ids.has('launch-monitor-workflow')).toBe(true);
  });

  it('keeps newly-added training videos in-app only until flipped public', () => {
    const all = getLibraryItems();
    const learnIds = new Set(getLearnItems().map((i) => i.id));
    // These are recorded + visible in /library, but not yet on /learn.
    for (const id of ['drill-library-tour', 'coaching-and-parents', 'film-study-motion-lab']) {
      expect(all.some((i) => i.id === id)).toBe(true);
      expect(learnIds.has(id)).toBe(false);
    }
  });
});
