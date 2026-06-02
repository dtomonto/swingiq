import {
  getIntegrationStatus,
  isIntegrationConfigured,
  configuredCount,
  emailConfigured,
  aiConfigured,
  stripeConfigured,
  ocrConfigured,
  analyticsConfigured,
  type Env,
} from './integrations';

describe('integration status', () => {
  const empty: Env = {};

  test('nothing is configured with an empty env', () => {
    const { configured, total } = configuredCount(empty);
    expect(configured).toBe(0);
    expect(total).toBeGreaterThan(0);
    expect(getIntegrationStatus(empty).every((s) => !s.configured)).toBe(true);
  });

  test('supabase needs both public url and anon key', () => {
    expect(isIntegrationConfigured('supabase', { NEXT_PUBLIC_SUPABASE_URL: 'u' })).toBe(false);
    expect(
      isIntegrationConfigured('supabase', {
        NEXT_PUBLIC_SUPABASE_URL: 'u',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k',
      }),
    ).toBe(true);
  });

  test('AI turns on vision + coach with any provider key', () => {
    const env: Env = { OPENAI_API_KEY: 'sk-test' };
    expect(aiConfigured(env)).toBe(true);
    expect(isIntegrationConfigured('aiVision', env)).toBe(true);
    expect(isIntegrationConfigured('aiCoach', env)).toBe(true);
  });

  test('email recognizes any one provider combo', () => {
    expect(emailConfigured({ RESEND_API_KEY: 'r', RESEND_AUDIENCE_ID: 'a' })).toBe(true);
    expect(emailConfigured({ EMAIL_CAPTURE_WEBHOOK_URL: 'https://x' })).toBe(true);
    expect(emailConfigured({ RESEND_API_KEY: 'r' })).toBe(false); // audience missing
  });

  test('stripe needs both secret + publishable keys', () => {
    expect(stripeConfigured({ STRIPE_SECRET_KEY: 'sk' })).toBe(false);
    expect(
      stripeConfigured({ STRIPE_SECRET_KEY: 'sk', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk' }),
    ).toBe(true);
  });

  test('ocr defaults to OpenAI but supports Google Cloud Vision', () => {
    expect(ocrConfigured({ OPENAI_API_KEY: 'sk' })).toBe(true);
    expect(ocrConfigured({ OCR_PROVIDER: 'google' })).toBe(false);
    expect(ocrConfigured({ OCR_PROVIDER: 'google', GOOGLE_CLOUD_VISION_API_KEY: 'k' })).toBe(true);
  });

  test('analytics recognizes any provider', () => {
    expect(analyticsConfigured({ NEXT_PUBLIC_GA_ID: 'G-1' })).toBe(true);
    expect(analyticsConfigured({})).toBe(false);
  });

  test('blank-string env vars do not count as configured', () => {
    expect(isIntegrationConfigured('supabase', {
      NEXT_PUBLIC_SUPABASE_URL: '   ',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    })).toBe(false);
  });
});
