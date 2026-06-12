// P1 — feature-flag resolution bridge.
// isFlagEnabled() must stay local-first (operator override wins) while letting a
// same-key PostHog flag drive the rollout when no override is set, and falling
// back to the registry default when PostHog is absent/unresolved. This proves
// the bridge is non-breaking: with no PostHog flag, behavior == registry default.

import { isFlagEnabled, useFeatureFlags } from '../stores/feature-flags';
import { FLAG_DEFS } from '../flags';

// A flag that defaults ON and one that defaults OFF, taken from the real registry.
const ON_BY_DEFAULT = FLAG_DEFS.find((f) => f.defaultEnabled)!.key;
const OFF_BY_DEFAULT = FLAG_DEFS.find((f) => !f.defaultEnabled)!.key;

type W = { posthog?: { isFeatureEnabled?: (k: string) => boolean | undefined } };
const realWindow = (global as { window?: unknown }).window;

function setPosthogFlags(map: Record<string, boolean>) {
  (global as { window?: unknown }).window = {
    posthog: { isFeatureEnabled: (k: string) => (k in map ? map[k] : undefined) },
  } as W;
}

afterEach(() => {
  (global as { window?: unknown }).window = realWindow;
  useFeatureFlags.getState().resetAll();
});

describe('isFlagEnabled — local-first PostHog bridge (P1)', () => {
  it('returns the registry default when there is no override and no PostHog flag', () => {
    (global as { window?: unknown }).window = {}; // PostHog absent
    expect(isFlagEnabled(ON_BY_DEFAULT)).toBe(true);
    expect(isFlagEnabled(OFF_BY_DEFAULT)).toBe(false);
  });

  it('lets a same-key PostHog flag drive the value when no override is set', () => {
    setPosthogFlags({ [ON_BY_DEFAULT]: false, [OFF_BY_DEFAULT]: true });
    expect(isFlagEnabled(ON_BY_DEFAULT)).toBe(false); // PostHog turned a default-on flag off
    expect(isFlagEnabled(OFF_BY_DEFAULT)).toBe(true); // PostHog rolled a default-off flag on
  });

  it('falls back to the default when PostHog has not resolved the flag', () => {
    setPosthogFlags({}); // loaded but flag unknown -> undefined
    expect(isFlagEnabled(ON_BY_DEFAULT)).toBe(true);
    expect(isFlagEnabled(OFF_BY_DEFAULT)).toBe(false);
  });

  it('operator override ALWAYS wins, even over an opposing PostHog flag (kill-switch)', () => {
    setPosthogFlags({ [ON_BY_DEFAULT]: true, [OFF_BY_DEFAULT]: false });
    useFeatureFlags.getState().setFlag(ON_BY_DEFAULT, { enabled: false }, 'test'); // force OFF
    useFeatureFlags.getState().setFlag(OFF_BY_DEFAULT, { enabled: true }, 'test'); // force ON
    expect(isFlagEnabled(ON_BY_DEFAULT)).toBe(false);
    expect(isFlagEnabled(OFF_BY_DEFAULT)).toBe(true);
  });

  it('returns false for an unknown flag key', () => {
    expect(isFlagEnabled('does-not-exist')).toBe(false);
  });
});
