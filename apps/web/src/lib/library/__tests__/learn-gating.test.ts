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

  it('keeps the originally-published videos public (stable anchors)', () => {
    const ids = new Set(getLearnItems().map((i) => i.id));
    // Seed-default public; these are the always-live anchors of the rollout.
    expect(ids.has('swing-path')).toBe(true);
    expect(ids.has('launch-monitor-workflow')).toBe(true);
  });

  it('rolls out gradually — some training videos stay in-app only', () => {
    const trainingTotal = getLibraryItems().filter((i) => i.source === 'training').length;
    const trainingPublic = getLearnItems().filter((i) => i.source === 'training').length;
    expect(trainingPublic).toBeGreaterThan(0);
    expect(trainingPublic).toBeLessThan(trainingTotal); // not everything published yet
  });

  it('invariant: a training video is on /learn iff isTrainingPublic(id) (overrides win)', () => {
    const learnIds = new Set(getLearnItems().map((i) => i.id));
    for (const i of getLibraryItems().filter((x) => x.source === 'training')) {
      expect(learnIds.has(i.id)).toBe(isTrainingPublic(i.id));
    }
  });

  it('an admin override publishes a video whose seed default is private', () => {
    // The rollout is driven by the overrides file deviating from seed defaults:
    // some on-/learn videos default to private but are published via override.
    const overriddenPublic = getLearnItems().filter(
      (i) => i.source === 'training' && !trainingPublishDefault(i.id),
    );
    expect(overriddenPublic.length).toBeGreaterThan(0);
    expect(overriddenPublic.every((i) => isTrainingPublic(i.id))).toBe(true);
  });
});
