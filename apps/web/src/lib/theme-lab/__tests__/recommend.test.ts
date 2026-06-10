import { recommendTheme, recommendForSport } from '../recommend';
import { THEME_LAB_REGISTRY, type ThemeLabEntry } from '../registry';

describe('theme-lab/recommend', () => {
  it('maps each sport group to a fitting theme', () => {
    expect(recommendForSport('golf').themeId).toBe('heritage-club');
    expect(recommendForSport('tennis').themeId).toBe('field-court');
    expect(recommendForSport('padel').themeId).toBe('field-court');
    expect(recommendForSport('baseball').themeId).toBe('field-court');
    expect(recommendForSport('softball_fast').themeId).toBe('field-court');
  });

  it('suggests the sport-fit theme when the user is on the default', () => {
    const rec = recommendTheme({ sport: 'golf', currentThemeId: 'dark-performance' });
    expect(rec).toEqual({ themeId: 'heritage-club', reason: expect.any(String) });
  });

  it('returns null when the best fit is already active', () => {
    expect(recommendTheme({ sport: 'golf', currentThemeId: 'heritage-club' })).toBeNull();
  });

  it('suggests the dark default for a dark-leaning user with no known sport', () => {
    expect(recommendTheme({ prefersDark: true, currentThemeId: 'standard' })).toEqual({
      themeId: 'dark-performance',
      reason: expect.any(String),
    });
  });

  it('returns null when there are no usable signals', () => {
    expect(recommendTheme({ currentThemeId: 'standard' })).toBeNull();
  });

  it('does not suggest a retired theme', () => {
    const reg: ThemeLabEntry[] = THEME_LAB_REGISTRY.map((e) =>
      e.themeId === 'heritage-club' ? { ...e, status: 'retired' } : e,
    );
    expect(recommendTheme({ sport: 'golf', currentThemeId: 'dark-performance', registry: reg })).toBeNull();
  });

  it('does not suggest an admin-only theme', () => {
    const reg: ThemeLabEntry[] = THEME_LAB_REGISTRY.map((e) =>
      e.themeId === 'field-court' ? { ...e, visibility: 'admin' } : e,
    );
    expect(recommendTheme({ sport: 'tennis', currentThemeId: 'dark-performance', registry: reg })).toBeNull();
  });
});
