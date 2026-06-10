import { sportBrand, sportSlug, sportAccentVars, ALL_SPORT_BRANDS, SPORT_BRAND_ORDER } from '../registry';
import type { SportId } from '@swingiq/core';

describe('sport-brand/registry', () => {
  it('maps SportId underscores to CSS-var hyphens', () => {
    expect(sportSlug('golf')).toBe('golf');
    expect(sportSlug('softball_slow')).toBe('softball-slow');
    expect(sportSlug('softball_fast')).toBe('softball-fast');
  });

  it('derives accent vars from the per-sport tokens (invents no colors)', () => {
    const b = sportBrand('golf');
    expect(b.accentVar).toBe('--sport-golf');
    expect(b.accentColor).toBe('hsl(var(--sport-golf))');
    expect(b.accentForeground).toBe('hsl(var(--sport-golf-foreground))');
  });

  it('covers every branded sport with a unique slug', () => {
    expect(ALL_SPORT_BRANDS).toHaveLength(SPORT_BRAND_ORDER.length);
    const slugs = ALL_SPORT_BRANDS.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const b of ALL_SPORT_BRANDS) {
      expect(b.accentVar).toMatch(/^--sport-[a-z-]+$/);
    }
  });

  it('sportAccentVars scopes --sport-accent + its foreground', () => {
    const vars = sportAccentVars('baseball') as Record<string, string>;
    expect(vars['--sport-accent']).toBe('hsl(var(--sport-baseball))');
    expect(vars['--sport-accent-foreground']).toBe('hsl(var(--sport-baseball-foreground))');
  });

  it('every SPORT_BRAND_ORDER entry round-trips through sportBrand', () => {
    for (const s of SPORT_BRAND_ORDER as SportId[]) {
      expect(sportBrand(s).sport).toBe(s);
    }
  });
});
