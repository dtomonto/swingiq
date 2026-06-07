import { detectDrift } from '../drift';
import { makeFeature, makeAsset } from './_factories';

describe('detectDrift', () => {
  it('flags a removed feature that still has live assets (retire)', () => {
    const f = makeFeature({ status: 'removed', category: 'removed' });
    const a = makeAsset({ featureId: f.id, status: 'published' });
    const drift = detectDrift([f], [a]);
    const finding = drift.find((d) => d.kind === 'route-removed');
    expect(finding).toBeDefined();
    expect(finding!.proposedAction).toBe('retire');
  });

  it('flags surfaces that changed since the last scan (regenerate)', () => {
    const previous = makeFeature({ fingerprint: 'old111' });
    const current = makeFeature({ fingerprint: 'new222' });
    const a = makeAsset({ featureId: current.id, status: 'published' });
    const drift = detectDrift([current], [a], { previous: [previous] });
    expect(drift.some((d) => d.kind === 'route-changed' && d.proposedAction === 'regenerate')).toBe(true);
  });

  it('flags stale assets past the freshness window', () => {
    const f = makeFeature();
    const a = makeAsset({ featureId: f.id, status: 'published', updatedAt: '2020-01-01T00:00:00.000Z' });
    const drift = detectDrift([f], [a], { now: new Date('2026-06-07T00:00:00.000Z') });
    expect(drift.some((d) => d.kind === 'stale-age')).toBe(true);
  });

  it('returns nothing when docs are in sync', () => {
    const f = makeFeature();
    const a = makeAsset({ featureId: f.id, status: 'published', updatedAt: new Date().toISOString() });
    expect(detectDrift([f], [a])).toEqual([]);
  });
});
