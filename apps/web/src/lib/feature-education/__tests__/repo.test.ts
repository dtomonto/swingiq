import { __setInMemoryRepoForTests } from '../repo';
import { makeFeature, makeAsset } from './_factories';
import { makeVersion } from '../workflow';
import { makeFeeAudit, type DriftFinding } from '../types';

describe('in-memory repo', () => {
  it('starts empty under the test seam (no snapshot seed)', async () => {
    const repo = __setInMemoryRepoForTests();
    expect(await repo.listFeatures()).toEqual([]);
    expect(repo.isPersistent()).toBe(false);
  });

  it('upserts + reads features and assets', async () => {
    const repo = __setInMemoryRepoForTests();
    const f = makeFeature();
    await repo.upsertFeatures([f]);
    expect(await repo.getFeature(f.id)).toEqual(f);
    expect(await repo.listFeatures()).toHaveLength(1);

    const a = makeAsset({ featureId: f.id });
    await repo.saveAsset(a);
    expect(await repo.listAssetsForFeature(f.id)).toHaveLength(1);
    expect(await repo.getAsset(a.id)).toEqual(a);
  });

  it('keeps version history newest-first', async () => {
    const repo = __setInMemoryRepoForTests();
    const a = makeAsset();
    await repo.saveVersion(makeVersion({ ...a, version: 1 }, 'v1', 'admin', new Date()));
    await repo.saveVersion(makeVersion({ ...a, version: 2 }, 'v2', 'admin', new Date()));
    const versions = await repo.listVersions(a.id);
    expect(versions.map((v) => v.version)).toEqual([2, 1]);
  });

  it('stores + clears drift and appends audit', async () => {
    const repo = __setInMemoryRepoForTests();
    const drift: DriftFinding = {
      id: 'd1', featureId: 'feat_test', kind: 'stale-age', detail: 'old', proposedAction: 'review', severity: 'low', createdAt: new Date().toISOString(),
    };
    await repo.saveDrift([drift]);
    expect(await repo.listDrift()).toHaveLength(1);
    await repo.clearDrift();
    expect(await repo.listDrift()).toHaveLength(0);

    await repo.appendAudit(makeFeeAudit('scan', 'registry', 'scanned'));
    expect(await repo.listAudit()).toHaveLength(1);
  });
});
