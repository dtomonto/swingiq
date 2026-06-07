// ============================================================
// SwingVantage — i18n upkeep core tests
// Guards the honesty gate: stale/missing/untracked translations
// must never count as "current" (and therefore never get exposed).
// ============================================================

import { hashString } from './hash';
import { statusFor, detectDrift, currentLocalesForKeys, type DriftInput } from './detect';
import { emptyManifest, type TranslationManifest } from './manifest';

const EN = {
  'marketingNav.howItWorks': 'How It Works',
  'marketingNav.pricing': 'Pricing',
};

function manifestWith(srcHash: string): TranslationManifest {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    keys: {
      'marketingNav.howItWorks': {
        locales: { es: { srcHash, translatedAt: '2026-06-06T00:00:00.000Z', source: 'human' } },
      },
    },
  };
}

describe('hashString', () => {
  it('is deterministic and CRLF-insensitive', () => {
    expect(hashString('How It Works')).toBe(hashString('How It Works'));
    expect(hashString('a\r\nb')).toBe(hashString('a\nb'));
  });
  it('changes when content changes', () => {
    expect(hashString('How It Works')).not.toBe(hashString('How it works'));
  });
  // Pinned values lock the algorithm so the CLI's ported copy
  // (scripts/i18n/upkeep.mjs) stays byte-identical. If these change, the CLI
  // copy must change too or every translation will read as stale.
  it('matches pinned reference hashes (CLI parity contract)', () => {
    expect(hashString('SwingVantage')).toBe('7da40161');
    expect(hashString('How It Works')).toBe('d6f7d110');
    expect(hashString('Pricing')).toBe('b4d17ded');
  });
});

describe('statusFor', () => {
  const base: Omit<DriftInput, 'manifest'> = {
    english: EN,
    translations: { es: { 'marketingNav.howItWorks': 'Cómo Funciona' } },
  };

  it('returns current when srcHash matches live English', () => {
    const input: DriftInput = { ...base, manifest: manifestWith(hashString(EN['marketingNav.howItWorks'])) };
    expect(statusFor('marketingNav.howItWorks', 'es', input)).toBe('current');
  });

  it('returns stale when English changed since the translation was blessed', () => {
    const input: DriftInput = { ...base, manifest: manifestWith('deadbeef') };
    expect(statusFor('marketingNav.howItWorks', 'es', input)).toBe('stale');
  });

  it('treats an untracked translation as stale (never trusted)', () => {
    const input: DriftInput = { ...base, manifest: emptyManifest() };
    expect(statusFor('marketingNav.howItWorks', 'es', input)).toBe('stale');
  });

  it('returns missing when no translation exists', () => {
    const input: DriftInput = {
      english: EN,
      translations: { es: {} },
      manifest: manifestWith(hashString(EN['marketingNav.howItWorks'])),
    };
    expect(statusFor('marketingNav.pricing', 'es', input)).toBe('missing');
  });
});

describe('currentLocalesForKeys (exposure gate)', () => {
  it('excludes a locale unless EVERY page key is current', () => {
    // howItWorks is current, but pricing has no translation → page not exposed.
    const input: DriftInput = {
      english: EN,
      translations: { es: { 'marketingNav.howItWorks': 'Cómo Funciona' } },
      manifest: manifestWith(hashString(EN['marketingNav.howItWorks'])),
    };
    expect(
      currentLocalesForKeys(['marketingNav.howItWorks', 'marketingNav.pricing'], input, ['es']),
    ).toEqual([]);
    // Just the current key → exposed.
    expect(currentLocalesForKeys(['marketingNav.howItWorks'], input, ['es'])).toEqual(['es']);
  });

  it('never exposes a locale for an empty key set', () => {
    const input: DriftInput = { english: EN, translations: {}, manifest: emptyManifest() };
    expect(currentLocalesForKeys([], input, ['es'])).toEqual([]);
  });
});

describe('detectDrift', () => {
  it('counts current / stale / missing across keys', () => {
    const input: DriftInput = {
      english: EN,
      translations: { es: { 'marketingNav.howItWorks': 'Cómo Funciona' } },
      manifest: manifestWith(hashString(EN['marketingNav.howItWorks'])),
    };
    const report = detectDrift(input, ['es']);
    expect(report.currentCount).toBe(1); // howItWorks
    expect(report.missingCount).toBe(1); // pricing
    expect(report.staleCount).toBe(0);
  });
});
