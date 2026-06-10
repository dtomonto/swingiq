import type { SportId } from '@swingiq/core';
import {
  SPORT_BRANDS,
  getSportBrand,
  sportAccentStyle,
  motifStyle,
  type SportMotif,
} from '../registry';

const ALL_SPORTS = Object.keys(SPORT_BRANDS) as SportId[];

describe('sport-brand registry', () => {
  it('covers every SportId with non-empty brand metadata', () => {
    expect(ALL_SPORTS.length).toBe(7);
    for (const sport of ALL_SPORTS) {
      const b = SPORT_BRANDS[sport];
      expect(b.tokenSlug).toMatch(/^[a-z-]+$/);
      expect(b.emoji.length).toBeGreaterThan(0);
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.tagline.length).toBeGreaterThan(0);
    }
  });

  it('maps underscore SportIds to hyphenated CSS token slugs', () => {
    expect(SPORT_BRANDS.softball_slow.tokenSlug).toBe('softball-slow');
    expect(SPORT_BRANDS.softball_fast.tokenSlug).toBe('softball-fast');
    // slugs never contain underscores (CSS tokens use hyphens)
    for (const sport of ALL_SPORTS) {
      expect(SPORT_BRANDS[sport].tokenSlug).not.toContain('_');
    }
  });

  it('getSportBrand falls back to golf for unknown ids', () => {
    expect(getSportBrand('nope' as SportId)).toBe(SPORT_BRANDS.golf);
    expect(getSportBrand('tennis')).toBe(SPORT_BRANDS.tennis);
  });

  it('sportAccentStyle references the existing AA-validated tokens', () => {
    const style = sportAccentStyle('golf') as Record<string, string>;
    expect(style['--sport-accent']).toBe('var(--color-sport-golf)');
    expect(style['--sport-accent-foreground']).toBe('var(--color-sport-golf-foreground)');

    const fast = sportAccentStyle('softball_fast') as Record<string, string>;
    expect(fast['--sport-accent']).toBe('var(--color-sport-softball-fast)');
  });

  it('motifStyle always tints from the in-scope --sport-accent (no hardcoded colors)', () => {
    const motifs: SportMotif[] = ['arc', 'grid', 'dots', 'diamond'];
    for (const m of motifs) {
      const s = motifStyle(m) as Record<string, string>;
      const serialized = JSON.stringify(s);
      expect(serialized).toContain('var(--sport-accent)');
      // never paints an opaque/raw color that could fail behind text
      expect(serialized).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });
});
