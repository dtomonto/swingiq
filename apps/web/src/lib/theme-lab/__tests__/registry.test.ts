import {
  THEME_LAB_REGISTRY,
  getThemeLabEntry,
  isThemeActive,
  themesForVisibility,
  type ThemeLabEntry,
} from '../registry';
import { THEMES } from '@/lib/theme/themes';

describe('theme-lab/registry', () => {
  it('wraps every engine theme exactly once (derived from THEMES)', () => {
    expect(THEME_LAB_REGISTRY).toHaveLength(THEMES.length);
    const ids = THEME_LAB_REGISTRY.map((e) => e.themeId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of THEMES) {
      const entry = getThemeLabEntry(t.id);
      expect(entry).toBeDefined();
      expect(entry!.name).toBe(t.name);
    }
  });

  it('the shipped themes are live core themes available to everyone', () => {
    for (const e of THEME_LAB_REGISTRY) {
      expect(e.labCategory).toBe('core');
      expect(e.status).toBe('active');
      expect(e.visibility).toBe('all');
      expect(e.sportCompat).toBe('all');
      expect(e.pageCompat).toBe('all');
    }
  });

  it('isThemeActive guards unknown / inactive / null', () => {
    expect(isThemeActive('dark-performance')).toBe(true);
    expect(isThemeActive(null)).toBe(false);
    const retired: ThemeLabEntry[] = [{ ...THEME_LAB_REGISTRY[0], status: 'retired' }];
    expect(isThemeActive(retired[0].themeId, retired)).toBe(false);
  });

  it('themesForVisibility tiers correctly', () => {
    const reg: ThemeLabEntry[] = [
      { ...THEME_LAB_REGISTRY[0], themeId: 'standard', visibility: 'all', status: 'active' },
      { ...THEME_LAB_REGISTRY[0], themeId: 'arcade-practice', visibility: 'opt-in', status: 'active' },
      { ...THEME_LAB_REGISTRY[0], themeId: 'bird-print', visibility: 'admin', status: 'active' },
      { ...THEME_LAB_REGISTRY[0], themeId: 'coach-mode', visibility: 'all', status: 'retired' },
    ];
    expect(themesForVisibility('all', reg).map((e) => e.themeId)).toEqual(['standard']);
    expect(themesForVisibility('opt-in', reg).map((e) => e.themeId).sort()).toEqual(['arcade-practice', 'standard']);
    expect(themesForVisibility('admin', reg).map((e) => e.themeId).sort()).toEqual(['arcade-practice', 'bird-print', 'standard']);
  });
});
