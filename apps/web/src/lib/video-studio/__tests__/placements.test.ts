import { seedPlacements, mergePlacements, resolvePlacement } from '../placements';
import { TUTORIAL_PLACEMENTS } from '@/lib/tutorial/placements';
import type { StudioPlacement } from '../types';
import { sampleAsset } from './_factories';

function studioPlacement(over: Partial<StudioPlacement> = {}): StudioPlacement {
  return {
    id: 'custom',
    assetId: 'a1',
    surfaceId: 'home-hero',
    page: '/',
    zone: 'zone',
    display: 'inline',
    trigger: 'click-to-play',
    audience: 'all',
    sport: 'all',
    device: 'all',
    priority: 50,
    cta: 'See it',
    captionsRequired: true,
    journeyStage: 'discover',
    enabled: true,
    source: 'studio',
    ...over,
  };
}

describe('seedPlacements', () => {
  it('mirrors the tutorial placement map (read-only seeds)', () => {
    const seeds = seedPlacements();
    expect(seeds.length).toBe(TUTORIAL_PLACEMENTS.length);
    expect(seeds.every((p) => p.source === 'tutorial')).toBe(true);
  });
});

describe('mergePlacements', () => {
  it('lets studio entries override seeds by id', () => {
    const override = studioPlacement({ id: TUTORIAL_PLACEMENTS[0].id, cta: 'NEW' });
    const merged = mergePlacements([override]);
    const hit = merged.find((p) => p.id === TUTORIAL_PLACEMENTS[0].id);
    expect(hit?.source).toBe('studio');
    expect(hit?.cta).toBe('NEW');
  });
});

describe('resolvePlacement', () => {
  const asset = sampleAsset({ id: 'a1', published: true });

  it('serves a published, assigned asset', () => {
    const r = resolvePlacement('custom', { studio: [studioPlacement()], assets: { a1: asset } });
    expect(r?.asset?.id).toBe('a1');
    expect(r?.fallback).toBe(false);
  });

  it('falls back when the asset is a draft', () => {
    const r = resolvePlacement('custom', { studio: [studioPlacement()], assets: { a1: sampleAsset({ id: 'a1', published: false }) } });
    expect(r?.fallback).toBe(true);
    expect(r?.asset).toBeUndefined();
  });

  it('falls back when the placement is disabled', () => {
    const r = resolvePlacement('custom', { studio: [studioPlacement({ enabled: false })], assets: { a1: asset } });
    expect(r?.fallback).toBe(true);
  });

  it('respects sport gating', () => {
    const r = resolvePlacement('custom', { studio: [studioPlacement({ sport: 'golf' })], assets: { a1: asset }, sport: 'tennis' });
    expect(r?.fallback).toBe(true);
  });

  it('falls back (no asset) for an un-assigned tutorial seed', () => {
    const r = resolvePlacement('home-hero');
    expect(r?.fallback).toBe(true);
  });

  it('returns undefined for an unknown placement', () => {
    expect(resolvePlacement('does-not-exist')).toBeUndefined();
  });
});
