// Runs in the repo's default `node` test env (no jsdom). Minimal window mock
// with a Map-backed localStorage + EventTarget, mirroring control.test.ts.
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeAll(() => {
  const target = new EventTarget();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = Object.assign(target, { localStorage: new MemStorage() });
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).window;
});

import {
  upsertExperiment,
  removeExperiment,
  setExperimentStatus,
  readExperiments,
  activeRunningExperiment,
  setSegmentDefault,
  readSegmentDefaults,
  getThemeAnonId,
  segmentForUsageCategory,
  EXPERIMENTS_CHANGE_EVENT,
  type ThemeExperimentConfig,
} from '../experiments';
import { bucketVariant } from '../resolve';

function mkExp(over: Partial<ThemeExperimentConfig> = {}): ThemeExperimentConfig {
  return {
    id: over.id ?? 'exp-1',
    name: over.name ?? 'Test',
    status: over.status ?? 'draft',
    createdAt: '2026-06-10T00:00:00Z',
    variants: over.variants ?? [
      { themeId: 'standard', weight: 50 },
      { themeId: 'dark-performance', weight: 50 },
    ],
    ...over,
  };
}

describe('theme-lab/experiments', () => {
  beforeEach(() => window.localStorage.clear());

  it('upserts, lists, updates and removes experiments + broadcasts', () => {
    const handler = jest.fn();
    window.addEventListener(EXPERIMENTS_CHANGE_EVENT, handler);

    upsertExperiment(mkExp({ id: 'a', name: 'A' }));
    upsertExperiment(mkExp({ id: 'b', name: 'B' }));
    expect(readExperiments().map((e) => e.id)).toEqual(['a', 'b']);

    upsertExperiment(mkExp({ id: 'a', name: 'A-renamed' }));
    expect(readExperiments().find((e) => e.id === 'a')!.name).toBe('A-renamed');
    expect(readExperiments()).toHaveLength(2); // upsert, not duplicate

    removeExperiment('a');
    expect(readExperiments().map((e) => e.id)).toEqual(['b']);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(EXPERIMENTS_CHANGE_EVENT, handler);
  });

  it('activeRunningExperiment returns only a running, positively-weighted test', () => {
    expect(activeRunningExperiment([])).toBeNull();
    upsertExperiment(mkExp({ id: 'draft', status: 'draft' }));
    expect(activeRunningExperiment()).toBeNull(); // draft → not live

    setExperimentStatus('draft', 'running');
    const live = activeRunningExperiment();
    expect(live).toEqual({ id: 'draft', variants: expect.any(Array) });
  });

  it('ignores a running experiment whose variants are all zero-weight', () => {
    upsertExperiment(
      mkExp({ id: 'z', status: 'running', variants: [{ themeId: 'standard', weight: 0 }] }),
    );
    expect(activeRunningExperiment()).toBeNull();
  });

  it('a live experiment buckets deterministically via resolve.bucketVariant', () => {
    upsertExperiment(mkExp({ id: 'run', status: 'running' }));
    const live = activeRunningExperiment()!;
    const a = bucketVariant('user-9', live);
    const b = bucketVariant('user-9', live);
    expect(a).toBe(b);
    expect(['standard', 'dark-performance']).toContain(a);
  });

  it('segment defaults round-trip and can be cleared', () => {
    setSegmentDefault('coaches', 'coach-mode');
    expect(readSegmentDefaults().coaches).toBe('coach-mode');
    setSegmentDefault('coaches', null);
    expect(readSegmentDefaults().coaches).toBeUndefined();
  });

  it('getThemeAnonId is stable across calls', () => {
    const a = getThemeAnonId();
    const b = getThemeAnonId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('maps usage categories to segments', () => {
    expect(segmentForUsageCategory('coach')).toBe('coaches');
    expect(segmentForUsageCategory('parent_guardian')).toBe('parents');
    expect(segmentForUsageCategory('minor_13_17')).toBe('juniors');
    expect(segmentForUsageCategory(null)).toBeNull();
  });
});
