// ============================================================
// SwingVantage — Marketing localization integration guard
//
// Runs against the REAL committed dictionaries + manifest. This is the
// CI honesty gate: if someone edits English without re-blessing, the
// "everything shipped is current" test fails — which is exactly the
// signal that a localized page would have gone stale.
// ============================================================

import { currentLocalesFor, LOCALIZABLE_PATHS } from './expose';
import { MARKETING_LOCALES, EN_FLAT, flatDict } from './dict';
import { CHROME_KEYS, keysForPath } from './registry';

describe('marketing localization exposure (real data)', () => {
  it('exposes localized pages in Spanish', () => {
    expect(currentLocalesFor('/')).toContain('es');
    expect(currentLocalesFor('/how-it-works')).toContain('es');
  });

  it('does not expose unregistered pages in any locale', () => {
    // Not registered as localizable → must never get a /es URL or hreflang.
    expect(currentLocalesFor('/pricing')).toEqual([]);
    expect(currentLocalesFor('/totally-unknown')).toEqual([]);
  });

  it('every registered page is fully current in every shipped locale (honesty gate)', () => {
    // If this fails, English changed without `npm run i18n:bless` — and the
    // affected page would silently fall back to English for that locale.
    for (const path of LOCALIZABLE_PATHS) {
      expect(currentLocalesFor(path)).toEqual(MARKETING_LOCALES);
    }
  });

  it('has at least one localizable page and one shipped locale', () => {
    expect(LOCALIZABLE_PATHS.length).toBeGreaterThan(0);
    expect(MARKETING_LOCALES.length).toBeGreaterThan(0);
    expect(CHROME_KEYS.length).toBeGreaterThan(0);
  });
});

describe('dictionary integrity', () => {
  it('chrome keys exist in the English source', () => {
    for (const key of CHROME_KEYS) {
      expect(typeof EN_FLAT[key]).toBe('string');
      expect(EN_FLAT[key].length).toBeGreaterThan(0);
    }
  });

  it('every shipped locale translates every key a localizable page needs', () => {
    for (const locale of MARKETING_LOCALES) {
      const translated = flatDict(locale);
      for (const path of LOCALIZABLE_PATHS) {
        for (const key of keysForPath(path)) {
          expect(typeof translated[key]).toBe('string');
        }
      }
    }
  });
});
