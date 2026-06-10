import {
  resolveThemeForUser,
  hashString,
  bucketVariant,
  isWithinSeasonalWindow,
  type ThemeExperiment,
} from '../resolve';
import { THEME_LAB_REGISTRY, type ThemeLabEntry } from '../registry';
import { DEFAULT_THEME_ID } from '@/lib/theme/themes';

// A registry where everything is active, plus a retired theme + a seasonal one,
// so each tier can be exercised independently of the shipped registry.
function testRegistry(): ThemeLabEntry[] {
  const base = THEME_LAB_REGISTRY.map((e) => ({ ...e }));
  // Mark one as retired to test the active-only guard.
  const heritage = base.find((e) => e.themeId === 'heritage-club');
  if (heritage) heritage.status = 'retired';
  // Turn arcade-practice into a seasonal theme with a fixed window.
  const arcade = base.find((e) => e.themeId === 'arcade-practice');
  if (arcade) {
    arcade.labCategory = 'seasonal';
    arcade.seasonal = { start: '12-15', end: '01-05' };
  }
  return base;
}

describe('theme-lab/resolve — hashString', () => {
  it('is deterministic and 32-bit unsigned', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
    expect(hashString('x')).toBeGreaterThanOrEqual(0);
    expect(hashString('a-very-long-string-of-text')).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('theme-lab/resolve — isWithinSeasonalWindow', () => {
  it('handles a normal (non-wrapping) window', () => {
    expect(isWithinSeasonalWindow('07-04', '06-01', '08-31')).toBe(true);
    expect(isWithinSeasonalWindow('05-31', '06-01', '08-31')).toBe(false);
    expect(isWithinSeasonalWindow('06-01', '06-01', '08-31')).toBe(true); // inclusive start
    expect(isWithinSeasonalWindow('08-31', '06-01', '08-31')).toBe(true); // inclusive end
  });

  it('handles a year-wrapping window (Dec → Jan)', () => {
    expect(isWithinSeasonalWindow('12-25', '12-15', '01-05')).toBe(true);
    expect(isWithinSeasonalWindow('01-01', '12-15', '01-05')).toBe(true);
    expect(isWithinSeasonalWindow('06-01', '12-15', '01-05')).toBe(false);
    expect(isWithinSeasonalWindow('01-06', '12-15', '01-05')).toBe(false);
  });
});

describe('theme-lab/resolve — bucketVariant', () => {
  const exp: ThemeExperiment = {
    id: 'exp-1',
    variants: [
      { themeId: 'standard', weight: 50 },
      { themeId: 'dark-performance', weight: 50 },
    ],
  };

  it('is deterministic per (experiment, userId)', () => {
    const a = bucketVariant('user-123', exp);
    const b = bucketVariant('user-123', exp);
    expect(a).toBe(b);
  });

  it('returns one of the declared variants', () => {
    const picked = bucketVariant('whoever', exp);
    expect(['standard', 'dark-performance']).toContain(picked);
  });

  it('returns null when all weights are zero', () => {
    expect(
      bucketVariant('user', { id: 'z', variants: [{ themeId: 'standard', weight: 0 }] }),
    ).toBeNull();
  });

  it('respects weight skew (0-weight variant is never chosen)', () => {
    const skew: ThemeExperiment = {
      id: 'skew',
      variants: [
        { themeId: 'standard', weight: 100 },
        { themeId: 'coach-mode', weight: 0 },
      ],
    };
    for (let i = 0; i < 50; i++) {
      expect(bucketVariant(`u${i}`, skew)).toBe('standard');
    }
  });
});

describe('theme-lab/resolve — resolveThemeForUser hierarchy', () => {
  const reg = testRegistry();

  it('1. forced-override wins over everything', () => {
    const r = resolveThemeForUser({
      registry: reg,
      forcedThemeId: 'coach-mode',
      assignedThemeId: 'standard',
      userPreferenceThemeId: 'field-court',
      userId: 'u1',
      experiment: { id: 'e', variants: [{ themeId: 'standard', weight: 100 }] },
    });
    expect(r).toEqual({ themeId: 'coach-mode', source: 'forced-override' });
  });

  it('forced-override is skipped when retired → falls through', () => {
    const r = resolveThemeForUser({
      registry: reg,
      forcedThemeId: 'heritage-club', // retired in testRegistry
      assignedThemeId: 'standard',
    });
    expect(r).toEqual({ themeId: 'standard', source: 'user-assignment' });
  });

  it('2. user-assignment beats experiment + preference', () => {
    const r = resolveThemeForUser({
      registry: reg,
      assignedThemeId: 'field-court',
      userPreferenceThemeId: 'standard',
      userId: 'u1',
      experiment: { id: 'e', variants: [{ themeId: 'standard', weight: 100 }] },
    });
    expect(r).toEqual({ themeId: 'field-court', source: 'user-assignment' });
  });

  it('3. experiment buckets deterministically and beats preference', () => {
    const input = {
      registry: reg,
      userId: 'stable-user',
      userPreferenceThemeId: 'standard' as const,
      experiment: {
        id: 'big-test',
        variants: [
          { themeId: 'coach-mode' as const, weight: 50 },
          { themeId: 'field-court' as const, weight: 50 },
        ],
      },
    };
    const r1 = resolveThemeForUser(input);
    const r2 = resolveThemeForUser(input);
    expect(r1.source).toBe('experiment');
    expect(r1.themeId).toBe(r2.themeId); // deterministic
    expect(['coach-mode', 'field-court']).toContain(r1.themeId);
  });

  it('experiment that buckets to a retired theme falls through to preference', () => {
    const r = resolveThemeForUser({
      registry: reg,
      userId: 'u1',
      userPreferenceThemeId: 'field-court',
      experiment: { id: 'e', variants: [{ themeId: 'heritage-club', weight: 100 }] }, // retired
    });
    expect(r).toEqual({ themeId: 'field-court', source: 'user-preference' });
  });

  it('4. user-preference when no override/assignment/experiment', () => {
    const r = resolveThemeForUser({ registry: reg, userPreferenceThemeId: 'field-court' });
    expect(r).toEqual({ themeId: 'field-court', source: 'user-preference' });
  });

  it('5. segment-default below preference', () => {
    const r = resolveThemeForUser({ registry: reg, segmentDefaultThemeId: 'coach-mode' });
    expect(r).toEqual({ themeId: 'coach-mode', source: 'segment-default' });
  });

  it('6. seasonal only when opted-in AND within window', () => {
    const inWindow = new Date('2026-12-25T12:00:00Z');
    const optedIn = resolveThemeForUser({ registry: reg, allowSeasonal: true, now: inWindow });
    expect(optedIn).toEqual({ themeId: 'arcade-practice', source: 'seasonal' });

    // Opted in but outside the window → global default.
    const summer = new Date('2026-07-04T12:00:00Z');
    const outOfWindow = resolveThemeForUser({ registry: reg, allowSeasonal: true, now: summer });
    expect(outOfWindow.source).toBe('global-default');

    // In window but NOT opted in → global default.
    const notOptedIn = resolveThemeForUser({ registry: reg, allowSeasonal: false, now: inWindow });
    expect(notOptedIn.source).toBe('global-default');
  });

  it('7. global-default when nothing else applies', () => {
    const r = resolveThemeForUser({ registry: reg });
    expect(r).toEqual({ themeId: DEFAULT_THEME_ID, source: 'global-default' });
  });

  it('8. fallback to first active theme when the default is retired', () => {
    const noDefault = reg.map((e) =>
      e.themeId === DEFAULT_THEME_ID ? { ...e, status: 'retired' as const } : e,
    );
    const r = resolveThemeForUser({ registry: noDefault });
    expect(r.source).toBe('fallback');
    const firstActive = noDefault.find((e) => e.status === 'active');
    expect(r.themeId).toBe(firstActive!.themeId);
  });

  it('uses the shipped registry by default (all themes active → global-default)', () => {
    const r = resolveThemeForUser({});
    expect(r).toEqual({ themeId: DEFAULT_THEME_ID, source: 'global-default' });
  });

  it('Christmas Swing Lab auto-applies for opted-in users in December (real registry)', () => {
    const dec = new Date('2026-12-20T12:00:00Z');
    expect(resolveThemeForUser({ allowSeasonal: true, now: dec })).toEqual({
      themeId: 'christmas-swing-lab',
      source: 'seasonal',
    });
    // Outside the window → the brand default.
    const july = new Date('2026-07-20T12:00:00Z');
    expect(resolveThemeForUser({ allowSeasonal: true, now: july }).source).toBe('global-default');
    // Opted out, even in December → the brand default.
    expect(resolveThemeForUser({ allowSeasonal: false, now: dec }).source).toBe('global-default');
  });
});
