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
  assessPublishRisk,
  createPublishDraft,
  publishRecord,
  rollbackRecord,
  readPublishRecords,
  activePublishRecords,
  removePublishRecord,
  THEME_PUBLISH_CHANGE_EVENT,
} from '../publish';
import {
  buildThemeOpsRecommendations,
  type ThemeOpsInput,
} from '../recommendations';
import type { ThemeExperimentConfig } from '../experiments';
import type { LibraryTheme } from '../library';
import { getTheme } from '@/lib/theme/themes';

describe('theme-lab/publish', () => {
  beforeEach(() => window.localStorage.clear());

  it('assesses risk by activeness then blast radius', () => {
    // not-a-real-theme → not active → high
    expect(assessPublishRisk('not-real' as never, 'segment', undefined)).toBe('high');
    // active theme, narrow scope → low
    expect(assessPublishRisk('dark-performance', 'sport', undefined)).toBe('low');
    // active theme, all → medium
    expect(assessPublishRisk('dark-performance', 'all', undefined)).toBe('medium');
    // active theme, 60% → medium; 10% → low
    expect(assessPublishRisk('dark-performance', 'percent', 60)).toBe('medium');
    expect(assessPublishRisk('dark-performance', 'percent', 10)).toBe('low');
  });

  it('draft → publish → rollback workflow + broadcast', () => {
    const handler = jest.fn();
    window.addEventListener(THEME_PUBLISH_CHANGE_EVENT, handler);
    const rec = createPublishDraft({ themeId: 'coach-mode', scope: 'segment', target: 'coaches' });
    expect(rec.status).toBe('draft');
    expect(rec.risk).toBe('low');
    expect(activePublishRecords()).toHaveLength(0);

    publishRecord(rec.id);
    expect(activePublishRecords()).toHaveLength(1);

    rollbackRecord(rec.id);
    expect(activePublishRecords()).toHaveLength(0);
    expect(readPublishRecords()[0].status).toBe('rolled-back');
    expect(handler).toHaveBeenCalled();

    removePublishRecord(rec.id);
    expect(readPublishRecords()).toHaveLength(0);
    window.removeEventListener(THEME_PUBLISH_CHANGE_EVENT, handler);
  });
});

describe('theme-lab/recommendations', () => {
  const runningExp: ThemeExperimentConfig = {
    id: 'exp-a',
    name: 'Dark vs Standard',
    status: 'running',
    createdAt: 'x',
    variants: [
      { themeId: 'dark-performance', weight: 50 },
      { themeId: 'standard', weight: 50 },
    ],
  };

  it('emits needs-data for a running experiment with no analytics', () => {
    const recs = buildThemeOpsRecommendations({ experiments: [runningExp] });
    expect(recs.some((r) => r.action === 'needs-data' && r.subject === 'exp-a')).toBe(true);
  });

  it('recommends expanding the winner once exposures + signal exist', () => {
    const input: ThemeOpsInput = {
      experiments: [runningExp],
      minExposure: 100,
      usage: {
        'dark-performance': { exposure: 500, positive: 150 }, // 30%
        standard: { exposure: 500, positive: 80 }, // 16%
      },
    };
    const recs = buildThemeOpsRecommendations(input);
    const expand = recs.find((r) => r.action === 'expand');
    expect(expand?.subject).toBe('dark-performance');
  });

  it('holds (pause) when a variant has too few exposures', () => {
    const recs = buildThemeOpsRecommendations({
      experiments: [runningExp],
      minExposure: 200,
      usage: { 'dark-performance': { exposure: 500, positive: 150 }, standard: { exposure: 10, positive: 2 } },
    });
    expect(recs.some((r) => r.action === 'pause')).toBe(true);
  });

  it('recommends rollback for a high-risk published record', () => {
    const recs = buildThemeOpsRecommendations({
      publishRecords: [
        {
          id: 'p1',
          themeId: 'dark-performance',
          scope: 'all',
          target: '',
          status: 'published',
          risk: 'high',
          createdAt: 'x',
          updatedAt: 'x',
        },
      ],
    });
    expect(recs[0].action).toBe('rollback'); // rollback sorts first
  });

  it('recommends promoting a stale library draft', () => {
    const draft: LibraryTheme = {
      id: 'gen-1',
      name: 'Gen 1',
      source: 'generated',
      status: 'draft',
      category: 'dark',
      swatches: getTheme('dark-performance').swatches,
      version: 1,
      createdAt: 'x',
    };
    const recs = buildThemeOpsRecommendations({ catalog: [draft] });
    expect(recs.some((r) => r.action === 'promote' && r.subject === 'gen-1')).toBe(true);
  });
});
