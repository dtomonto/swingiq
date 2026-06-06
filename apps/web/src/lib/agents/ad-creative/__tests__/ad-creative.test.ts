// ============================================================
// SwingVantage — Agent: Ad-Creative — Unit Tests
// ============================================================

import { generateAdCreatives, buildProofLine, adUtmUrl } from '../engine';
import { validateAdRewrite, allowedNumbersFor } from '../compliance';
import type { AdGenerationOptions, AdProof } from '../types';

const proof: AdProof = { metricLabel: 'swing score', before: 62, after: 78, timeframe: 'in 3 weeks' };

const baseOpts = (o: Partial<AdGenerationOptions> = {}): AdGenerationOptions => ({
  platforms: ['meta', 'google_search'],
  objective: 'signups',
  sport: 'golf',
  landingPath: '/start',
  origin: 'https://swingvantage.com',
  campaign: 'q3-launch',
  ...o,
});

describe('generateAdCreatives', () => {
  it('produces one creative per platform within each platform’s limits', () => {
    const res = generateAdCreatives(baseOpts());
    expect(res.creatives).toHaveLength(2);

    const meta = res.creatives.find((c) => c.platform === 'meta')!;
    expect(meta.headlines.length).toBeGreaterThan(0);
    expect(meta.headlines.length).toBeLessThanOrEqual(3);
    meta.headlines.forEach((h) => expect(h.length).toBeLessThanOrEqual(40));
    meta.primaryTexts.forEach((p) => expect(p.length).toBeLessThanOrEqual(125));
    meta.descriptions.forEach((d) => expect(d.length).toBeLessThanOrEqual(30));

    const google = res.creatives.find((c) => c.platform === 'google_search')!;
    expect(google.primaryTexts).toHaveLength(0); // google has no "primary" field
    google.headlines.forEach((h) => expect(h.length).toBeLessThanOrEqual(30));
  });

  it('grounds copy in real proof numbers when supplied', () => {
    const res = generateAdCreatives(baseOpts({ proof }));
    const meta = res.creatives.find((c) => c.platform === 'meta')!;
    const allText = [...meta.headlines, ...meta.primaryTexts].join(' | ');
    expect(allText).toContain('62');
    expect(allText).toContain('78');
  });

  it('is compliance-clean by construction', () => {
    const res = generateAdCreatives(baseOpts({ proof }));
    expect(res.compliance.clean).toBe(true);
    expect(res.compliance.issues).toHaveLength(0);
  });

  it('warns honestly when no proof is supplied', () => {
    const res = generateAdCreatives(baseOpts({ proof: null }));
    expect(res.warnings.join(' ')).toMatch(/no proof/i);
  });

  it('builds tracked UTM links', () => {
    const url = adUtmUrl(baseOpts(), 'meta');
    expect(url).toContain('https://swingvantage.com/start?');
    expect(url).toContain('utm_source=meta');
    expect(url).toContain('utm_medium=paid');
    expect(url).toContain('utm_campaign=q3-launch');
  });

  it('falls back to meta when no platforms are given', () => {
    const res = generateAdCreatives(baseOpts({ platforms: [] }));
    expect(res.creatives).toHaveLength(1);
    expect(res.creatives[0].platform).toBe('meta');
  });
});

describe('buildProofLine', () => {
  it('returns a grounded sentence when numbers are present', () => {
    expect(buildProofLine(proof)).toBe('Swing score: 62 → 78 in 3 weeks.');
  });
  it('returns null with no proof', () => {
    expect(buildProofLine(null)).toBeNull();
  });
});

describe('compliance validation', () => {
  it('collects allowed numbers from proof + timeframe', () => {
    const allowed = allowedNumbersFor(proof);
    expect(allowed.has('62')).toBe(true);
    expect(allowed.has('78')).toBe(true);
    expect(allowed.has('3')).toBe(true);
  });

  it('rejects a rewrite that invents a number or guarantees', () => {
    const r = validateAdRewrite('Guaranteed 90 mph in a week!', proof);
    expect(r.ok).toBe(false);
    expect(r.violations.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts a clean rephrase that stays within the proof', () => {
    expect(validateAdRewrite('Swing score 62 to 78 — free to start.', proof).ok).toBe(true);
    expect(validateAdRewrite('Find one clear fix for your swing. Free to start.', proof).ok).toBe(true);
  });
});
