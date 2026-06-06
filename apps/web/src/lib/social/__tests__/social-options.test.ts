import { sanitizeOptions } from '../options';
import { DEFAULT_PLATFORMS } from '../platforms';
import { DEFAULT_OPTIONS } from '../types';

describe('sanitizeOptions', () => {
  it('fills safe defaults from empty input', () => {
    const o = sanitizeOptions({});
    expect(o.platforms).toEqual(DEFAULT_PLATFORMS);
    expect(o.brandVoice).toBe(DEFAULT_OPTIONS.brandVoice);
    expect(o.objective).toBe(DEFAULT_OPTIONS.objective);
    expect(o.automationMode).toBe('semi_automatic');
    expect(o.audience).toBeUndefined();
  });

  it('keeps valid platforms, drops bogus ones, dedupes', () => {
    const o = sanitizeOptions({ platforms: ['linkedin', 'linkedin', 'nonsense', 'x'] });
    expect(o.platforms).toEqual(['linkedin', 'x']);
  });

  it('falls back to defaults for invalid enums', () => {
    const o = sanitizeOptions({ brandVoice: 'spicy', objective: 'world_domination' });
    expect(o.brandVoice).toBe(DEFAULT_OPTIONS.brandVoice);
    expect(o.objective).toBe(DEFAULT_OPTIONS.objective);
  });

  it('keeps a valid audience and ignores an invalid one', () => {
    expect(sanitizeOptions({ audience: 'coaches' }).audience).toBe('coaches');
    expect(sanitizeOptions({ audience: 'aliens' }).audience).toBeUndefined();
  });

  it('never lets automation reach fully_automatic (no auto-publish)', () => {
    expect(sanitizeOptions({ automationMode: 'fully_automatic' }).automationMode).toBe(
      'semi_automatic',
    );
    expect(sanitizeOptions({ automationMode: 'manual' }).automationMode).toBe('manual');
  });

  it('slugifies the campaign', () => {
    expect(sanitizeOptions({ campaign: 'Spring Launch 2026!' }).campaign).toBe('spring_launch_2026');
  });
});
