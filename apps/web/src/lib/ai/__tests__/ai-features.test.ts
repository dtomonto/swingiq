import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  USER_AI_FEATURES,
  userAiDefaultEnabled,
  isAiFeatureEnabled,
  setAiFeatureEnabled,
  clearAiFeatureOverride,
  setAllUserAiEnabled,
  clearAllFeatureOverrides,
  getAiFeatureSnapshot,
  __test__,
} from '../ai-features';

beforeEach(() => {
  __test__.reset();
  delete process.env.AI_USER_FEATURES_DEFAULT;
});

describe('userAiDefaultEnabled (env baseline)', () => {
  it('defaults to ON when unset (no behavior change unless opted in)', () => {
    expect(userAiDefaultEnabled({})).toBe(true);
  });
  it('reads OFF variants', () => {
    for (const v of ['off', 'false', '0', 'no', 'disabled', 'OFF']) {
      expect(userAiDefaultEnabled({ AI_USER_FEATURES_DEFAULT: v })).toBe(false);
    }
  });
  it('reads ON for anything else', () => {
    expect(userAiDefaultEnabled({ AI_USER_FEATURES_DEFAULT: 'on' })).toBe(true);
    expect(userAiDefaultEnabled({ AI_USER_FEATURES_DEFAULT: 'true' })).toBe(true);
  });
});

describe('isAiFeatureEnabled', () => {
  it('follows the baseline when no override is set', async () => {
    expect(await isAiFeatureEnabled('ai-coach')).toBe(true); // unset env → on
    process.env.AI_USER_FEATURES_DEFAULT = 'off';
    expect(await isAiFeatureEnabled('ai-coach')).toBe(false);
  });

  it('a per-feature override beats the baseline (re-enable one while default is off)', async () => {
    process.env.AI_USER_FEATURES_DEFAULT = 'off';
    expect(await isAiFeatureEnabled('video-analysis')).toBe(false);
    await setAiFeatureEnabled('video-analysis', true);
    expect(await isAiFeatureEnabled('video-analysis')).toBe(true);
    // other features still follow the off baseline
    expect(await isAiFeatureEnabled('ai-coach')).toBe(false);
  });

  it('unknown ids default to the baseline (a typo never silently disables AI)', async () => {
    expect(await isAiFeatureEnabled('does-not-exist')).toBe(true);
  });

  it('setAiFeatureEnabled rejects unknown ids', async () => {
    await expect(setAiFeatureEnabled('nope', false)).rejects.toThrow(/unknown_feature/);
  });
});

describe('master + reset', () => {
  it('setAllUserAiEnabled(false) turns every feature off', async () => {
    await setAllUserAiEnabled(false);
    for (const f of USER_AI_FEATURES) expect(await isAiFeatureEnabled(f.id)).toBe(false);
    const snap = await getAiFeatureSnapshot();
    expect(snap.enabledCount).toBe(0);
    expect(snap.features.every((f) => f.overridden)).toBe(true);
  });

  it('clearAiFeatureOverride reverts one feature to the baseline', async () => {
    process.env.AI_USER_FEATURES_DEFAULT = 'off';
    await setAiFeatureEnabled('ai-coach', true);
    expect(await isAiFeatureEnabled('ai-coach')).toBe(true);
    await clearAiFeatureOverride('ai-coach');
    expect(await isAiFeatureEnabled('ai-coach')).toBe(false); // back to off baseline
  });

  it('clearAllFeatureOverrides drops all overrides', async () => {
    await setAllUserAiEnabled(false);
    await clearAllFeatureOverrides();
    const snap = await getAiFeatureSnapshot();
    expect(snap.features.every((f) => !f.overridden)).toBe(true);
    expect(snap.enabledCount).toBe(USER_AI_FEATURES.length); // baseline on
  });
});

describe('getAiFeatureSnapshot', () => {
  it('exposes every catalog feature with state + counts', async () => {
    const snap = await getAiFeatureSnapshot();
    expect(snap.features).toHaveLength(USER_AI_FEATURES.length);
    expect(snap.features[0]).toHaveProperty('routes');
    expect(snap.defaultEnabled).toBe(true);
    expect(snap.source).toBe('memory'); // no Upstash in tests
  });
});

describe('sanitize', () => {
  it('keeps only known feature ids with boolean values', () => {
    const cleaned = __test__.sanitize({ 'ai-coach': false, 'bogus': true, 'video-analysis': 'yes' });
    expect(cleaned).toEqual({ 'ai-coach': false });
  });
});
