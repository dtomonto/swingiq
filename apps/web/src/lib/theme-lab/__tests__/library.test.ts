// node env + Map-backed window (no jsdom), mirroring control.test.ts.
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
  getLibraryCatalog,
  readDrafts,
  upsertDraft,
  addDrafts,
  removeDraft,
  setDraftStatus,
  libraryStats,
  THEME_LIBRARY_CHANGE_EVENT,
  type LibraryTheme,
} from '../library';
import { generateThemeVariants } from '../generate';
import { THEME_LAB_REGISTRY } from '../registry';
import { parseHslTriple } from '../color';
import { getTheme } from '@/lib/theme/themes';

describe('theme-lab/library', () => {
  beforeEach(() => window.localStorage.clear());

  it('catalog includes every published theme as a live row', () => {
    const cat = getLibraryCatalog();
    expect(cat.length).toBe(THEME_LAB_REGISTRY.length);
    expect(cat.every((t) => t.source === 'published')).toBe(true);
    const xmas = cat.find((t) => t.id === 'christmas-swing-lab');
    expect(xmas?.status).toBe('live'); // seasonal but active
    expect(cat.find((t) => t.id === 'dark-performance')?.swatches).toBeDefined();
  });

  it('a retired registry theme shows as retired in the catalog', () => {
    const reg = THEME_LAB_REGISTRY.map((e) =>
      e.themeId === 'heritage-club' ? { ...e, status: 'retired' as const } : e,
    );
    const cat = getLibraryCatalog(reg, []);
    expect(cat.find((t) => t.id === 'heritage-club')?.status).toBe('retired');
  });

  it('drafts round-trip and broadcast', () => {
    const handler = jest.fn();
    window.addEventListener(THEME_LIBRARY_CHANGE_EVENT, handler);
    const draft: LibraryTheme = {
      id: 'draft-1',
      name: 'My Draft',
      source: 'draft',
      status: 'draft',
      category: 'dark',
      swatches: getTheme('dark-performance').swatches,
      version: 1,
      createdAt: 'x',
    };
    upsertDraft(draft);
    expect(readDrafts()).toHaveLength(1);
    expect(handler).toHaveBeenCalled();
    setDraftStatus('draft-1', 'retired');
    expect(readDrafts()[0].status).toBe('retired');
    removeDraft('draft-1');
    expect(readDrafts()).toHaveLength(0);
    window.removeEventListener(THEME_LIBRARY_CHANGE_EVENT, handler);
  });

  it('drafts appear in the catalog after the published themes', () => {
    upsertDraft({
      id: 'draft-2',
      name: 'D2',
      source: 'generated',
      status: 'draft',
      category: 'light',
      swatches: getTheme('standard').swatches,
      version: 1,
      createdAt: 'x',
    });
    const cat = getLibraryCatalog();
    expect(cat).toHaveLength(THEME_LAB_REGISTRY.length + 1);
    expect(cat[cat.length - 1].id).toBe('draft-2');
  });

  it('a draft cannot shadow a published id', () => {
    upsertDraft({
      id: 'standard', // collides with a published id
      name: 'fake',
      source: 'draft',
      status: 'draft',
      category: 'light',
      swatches: getTheme('standard').swatches,
      version: 1,
      createdAt: 'x',
    });
    const cat = getLibraryCatalog();
    expect(cat.filter((t) => t.id === 'standard')).toHaveLength(1);
    expect(cat.find((t) => t.id === 'standard')?.source).toBe('published');
  });

  it('libraryStats rolls up the catalog', () => {
    const stats = libraryStats();
    expect(stats.total).toBe(THEME_LAB_REGISTRY.length);
    expect(stats.published).toBe(THEME_LAB_REGISTRY.length);
    expect(stats.live).toBeGreaterThanOrEqual(7);
  });
});

describe('theme-lab/generate', () => {
  beforeEach(() => window.localStorage.clear());

  it('generates the requested count of deterministic draft variants', () => {
    const a = generateThemeVariants('dark-performance', { count: 3, stepDegrees: 40 });
    const b = generateThemeVariants('dark-performance', { count: 3, stepDegrees: 40 });
    expect(a).toHaveLength(3);
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id)); // deterministic
    expect(a.every((t) => t.source === 'generated' && t.status === 'draft')).toBe(true);
    expect(a.every((t) => t.baseThemeId === 'dark-performance')).toBe(true);
  });

  it('rotates hue only — preserving each swatch S and L (so contrast holds)', () => {
    const [variant] = generateThemeVariants('dark-performance', { count: 1, stepDegrees: 40 });
    const baseP = parseHslTriple(getTheme('dark-performance').swatches.primary)!;
    const genP = parseHslTriple(variant.swatches.primary)!;
    expect(genP.s).toBe(baseP.s);
    expect(genP.l).toBe(baseP.l);
    expect(genP.h).toBe((baseP.h + 40) % 360);
  });

  it('clamps count to a sane range', () => {
    expect(generateThemeVariants('standard', { count: 99 }).length).toBeLessThanOrEqual(12);
    expect(generateThemeVariants('standard', { count: 0 }).length).toBeGreaterThanOrEqual(1);
  });

  it('addDrafts is idempotent for the same generated ids', () => {
    const variants = generateThemeVariants('standard', { count: 3 });
    addDrafts(variants);
    addDrafts(variants); // re-run
    expect(readDrafts()).toHaveLength(3); // no duplicates
  });
});
