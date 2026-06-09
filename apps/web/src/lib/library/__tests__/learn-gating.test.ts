// Public /learn exposure gate: every item shows in-app (getLibraryItems),
// but only `public` items are listed publicly (getLearnItems) so new training
// videos can be rolled out to search gradually.
import { getLibraryItems, getLearnItems } from '../index';
import { isTrainingPublic, trainingPublishDefault } from '../training-videos';

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

  it('keeps the originally-published + week-1 training videos public', () => {
    const ids = new Set(getLearnItems().map((i) => i.id));
    expect(ids.has('swing-path')).toBe(true);
    expect(ids.has('launch-monitor-workflow')).toBe(true);
    // Week-1 of the gradual rollout (flipped public:true).
    expect(ids.has('drill-library-tour')).toBe(true);
    expect(ids.has('coaching-and-parents')).toBe(true);
    expect(ids.has('film-study-motion-lab')).toBe(true);
  });

  it('keeps not-yet-flipped training videos in-app only until published', () => {
    const all = getLibraryItems();
    const learnIds = new Set(getLearnItems().map((i) => i.id));
    // Recorded + visible in /library, but still private (public:false).
    for (const id of ['slice-fix-drills', 'compare-to-a-reference', 'tennis-topspin-drills']) {
      expect(all.some((i) => i.id === id)).toBe(true);
      expect(learnIds.has(id)).toBe(false);
    }
  });

  it('resolves publish state from the admin overrides file, falling back to seed defaults', () => {
    // With an empty overrides file, effective state equals the seed default and
    // matches what getLearnItems exposes — the admin toggle only writes deviations.
    expect(isTrainingPublic('swing-path')).toBe(true);
    expect(trainingPublishDefault('swing-path')).toBe(true);
    expect(isTrainingPublic('slice-fix-drills')).toBe(false);
    expect(trainingPublishDefault('slice-fix-drills')).toBe(false);

    const learnIds = new Set(getLearnItems().map((i) => i.id));
    for (const i of getLibraryItems().filter((x) => x.source === 'training')) {
      expect(learnIds.has(i.id)).toBe(isTrainingPublic(i.id));
    }
  });
});
