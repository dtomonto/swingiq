// ============================================================
// AI gateway — pure helpers (intelligence Sprint 3 foundation)
// ============================================================

import { resolveProvider, selectModel, shouldRetry } from './gateway';

const env = (o: Record<string, string | undefined>) => o as unknown as NodeJS.ProcessEnv;
const KEY = 'sk-real-key-value';

describe('resolveProvider', () => {
  it('uses Anthropic by default when its key is set', () => {
    expect(resolveProvider(env({ ANTHROPIC_API_KEY: KEY }))).toBe('anthropic');
  });
  it('returns none when the preferred provider has no key', () => {
    expect(resolveProvider(env({ AI_PROVIDER: 'anthropic' }))).toBe('none');
    expect(resolveProvider(env({ AI_PROVIDER: 'openai' }))).toBe('none');
  });
  it('honors AI_PROVIDER=openai with an OpenAI key', () => {
    expect(resolveProvider(env({ AI_PROVIDER: 'openai', OPENAI_API_KEY: KEY }))).toBe('openai');
  });
  it('respects an explicit none', () => {
    expect(resolveProvider(env({ AI_PROVIDER: 'none', ANTHROPIC_API_KEY: KEY }))).toBe('none');
  });
  it('treats placeholder keys as not configured', () => {
    expect(resolveProvider(env({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'your-key-here' }))).toBe('none');
  });
  it('falls back to whichever key exists for an unknown provider value', () => {
    expect(resolveProvider(env({ AI_PROVIDER: 'mystery', OPENAI_API_KEY: KEY }))).toBe('openai');
  });
});

describe('selectModel — tiering (#4)', () => {
  it('maps Anthropic tiers to current model ids', () => {
    expect(selectModel('anthropic', 'fast', env({}))).toBe('claude-haiku-4-5');
    expect(selectModel('anthropic', 'balanced', env({}))).toBe('claude-sonnet-4-6');
    expect(selectModel('anthropic', 'powerful', env({}))).toBe('claude-opus-4-8');
  });
  it('maps OpenAI tiers', () => {
    expect(selectModel('openai', 'fast', env({}))).toBe('gpt-4o-mini');
    expect(selectModel('openai', 'powerful', env({}))).toBe('gpt-4o');
  });
  it('defaults to the fast tier', () => {
    expect(selectModel('anthropic', undefined, env({}))).toBe('claude-haiku-4-5');
  });
  it('honors ANTHROPIC_MODEL as a fast-tier override (back-compat) but not other tiers', () => {
    expect(selectModel('anthropic', 'fast', env({ ANTHROPIC_MODEL: 'claude-custom' }))).toBe('claude-custom');
    expect(selectModel('anthropic', 'balanced', env({ ANTHROPIC_MODEL: 'claude-custom' }))).toBe('claude-sonnet-4-6');
  });
});

describe('shouldRetry', () => {
  it('retries 429 and 5xx, not 4xx/2xx', () => {
    expect(shouldRetry(429)).toBe(true);
    expect(shouldRetry(500)).toBe(true);
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(400)).toBe(false);
    expect(shouldRetry(401)).toBe(false);
    expect(shouldRetry(200)).toBe(false);
  });
});
