import { validateEnv, assertEnv } from '../env';

describe('env validation (A10)', () => {
  it('treats an empty environment as valid (keyless mode)', () => {
    expect(validateEnv({}).ok).toBe(true);
    expect(validateEnv({}).issues).toHaveLength(0);
  });

  it('accepts a well-formed environment', () => {
    const res = validateEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'a'.repeat(40),
      AI_VISION_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-'.padEnd(20, 'x'),
      AI_DAILY_BUDGET_CENTS: '500',
      NEXT_PUBLIC_PLAUSIBLE_DOMAIN: 'swingvantage.com',
      SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
    });
    expect(res.ok).toBe(true);
    expect(res.issues).toHaveLength(0);
  });

  it('flags a malformed URL as an error', () => {
    const res = validateEnv({ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.path === 'NEXT_PUBLIC_SUPABASE_URL' && i.level === 'error')).toBe(true);
  });

  it('flags a non-numeric budget as an error', () => {
    const res = validateEnv({ AI_DAILY_BUDGET_CENTS: '5 dollars' });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.path === 'AI_DAILY_BUDGET_CENTS')).toBe(true);
  });

  it('rejects an unknown AI provider name', () => {
    const res = validateEnv({ AI_PROVIDER: 'wizard' });
    expect(res.ok).toBe(false);
  });

  it('warns (does not error) on a half-configured integration', () => {
    const res = validateEnv({ STRIPE_SECRET_KEY: 'sk_live_x' });
    expect(res.ok).toBe(true); // warning only
    expect(res.issues.some((i) => i.level === 'warn' && i.path === 'STRIPE_*')).toBe(true);
  });

  it('warns when an AI provider is named without its key', () => {
    const res = validateEnv({ AI_VISION_PROVIDER: 'anthropic' });
    expect(res.issues.some((i) => i.path === 'AI_VISION_PROVIDER' && i.level === 'warn')).toBe(true);
  });

  it('assertEnv does not throw by default, even with errors', () => {
    expect(() => assertEnv({ env: { NEXT_PUBLIC_SUPABASE_URL: 'bad' } })).not.toThrow();
  });

  it('assertEnv throws in strict mode when there is an error', () => {
    expect(() => assertEnv({ strict: true, env: { NEXT_PUBLIC_SUPABASE_URL: 'bad' } })).toThrow(/Invalid environment/);
  });

  it('assertEnv does not throw in strict mode when only warnings exist', () => {
    expect(() => assertEnv({ strict: true, env: { STRIPE_SECRET_KEY: 'sk_live_x' } })).not.toThrow();
  });
});
