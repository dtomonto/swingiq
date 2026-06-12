import { describe, it, expect } from '@jest/globals';
import { loadAIConfig } from '../model-config';
import { providerPayloadPolicy, sanitizeForTrace, retentionWindowDays, uploadConsent } from '../retention';

describe('retention / privacy policy', () => {
  it('defaults: redact on, store-raw off (§16)', () => {
    const p = providerPayloadPolicy(loadAIConfig({}));
    expect(p.redact).toBe(true);
    expect(p.storeRaw).toBe(false);
  });

  it('sanitizeForTrace keeps nothing by default', () => {
    expect(sanitizeForTrace({ secret: 1 }, loadAIConfig({}))).toBeNull();
  });

  it('sanitizeForTrace keeps the payload only with redact off AND store-raw on', () => {
    const cfg = loadAIConfig({ AI_REDACT_PROVIDER_PAYLOADS: 'false', AI_STORE_RAW_PROVIDER_RESPONSES: 'true' });
    expect(sanitizeForTrace({ a: 1 }, cfg)).toEqual({ a: 1 });
  });

  it('redact wins even if store-raw is on', () => {
    const cfg = loadAIConfig({ AI_REDACT_PROVIDER_PAYLOADS: 'true', AI_STORE_RAW_PROVIDER_RESPONSES: 'true' });
    expect(sanitizeForTrace({ a: 1 }, cfg)).toBeNull();
  });

  it('cloud upload always requires consent, with a plain-English notice', () => {
    const c = uploadConsent(loadAIConfig({}));
    expect(c.required).toBe(true);
    expect(c.notice).toMatch(/third-party AI provider/i);
    expect(c.notice).toMatch(/Motion Lab/i);
    expect(c.notice).toMatch(new RegExp(`~${retentionWindowDays(loadAIConfig({}))} days`));
  });
});
