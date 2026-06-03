// ============================================================
// SwingIQ — Integration Status (single source of truth)
// ------------------------------------------------------------
// Reports which optional integrations are configured, based purely on
// environment variables. Used to drive HONEST UI ("connect this to
// enable X") and to power the owner setup checklist — nothing here
// fakes a connection.
//
// NOTE: secrets (STRIPE_SECRET_KEY, RESEND_API_KEY, etc.) are only
// readable server-side. Call this from server components / route
// handlers. `getClientIntegrationStatus` is the browser-safe subset
// (NEXT_PUBLIC_* only).
// ============================================================

export type IntegrationId =
  | 'supabase'
  | 'aiVision'
  | 'aiCoach'
  | 'email'
  | 'stripe'
  | 'ocr'
  | 'analytics';

export type IntegrationCategory = 'core' | 'growth' | 'monetization';

export interface IntegrationStatus {
  id: IntegrationId;
  label: string;
  configured: boolean;
  /** Env vars that turn this integration on (for the checklist). */
  requiredEnv: string[];
  /** Plain-English description of what it unlocks. */
  note: string;
  category: IntegrationCategory;
}

export type Env = Record<string, string | undefined>;

function has(env: Env, ...keys: string[]): boolean {
  return keys.every((k) => Boolean(env[k] && String(env[k]).trim()));
}

function hasAny(env: Env, ...keys: string[]): boolean {
  return keys.some((k) => Boolean(env[k] && String(env[k]).trim()));
}

/** True if any supported email provider is fully configured. */
export function emailConfigured(env: Env): boolean {
  return (
    has(env, 'RESEND_API_KEY', 'RESEND_AUDIENCE_ID') ||
    has(env, 'CONVERTKIT_API_KEY', 'CONVERTKIT_FORM_ID') ||
    has(env, 'MAILCHIMP_API_KEY', 'MAILCHIMP_LIST_ID', 'MAILCHIMP_SERVER_PREFIX') ||
    has(env, 'EMAIL_CAPTURE_WEBHOOK_URL')
  );
}

/** True if an AI provider key is present (vision + coach share these). */
export function aiConfigured(env: Env): boolean {
  return hasAny(env, 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_AI_API_KEY');
}

/** True if Stripe is configured for checkout. */
export function stripeConfigured(env: Env): boolean {
  return has(env, 'STRIPE_SECRET_KEY') && has(env, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

/** True if an OCR backend is configured (OpenAI Vision or Google Cloud Vision). */
export function ocrConfigured(env: Env): boolean {
  const provider = (env.OCR_PROVIDER ?? '').trim().toLowerCase();
  if (provider === 'google') return has(env, 'GOOGLE_CLOUD_VISION_API_KEY');
  // Default/`openai`: reuse the OpenAI key.
  return has(env, 'OPENAI_API_KEY');
}

/** True if any analytics provider is configured. */
export function analyticsConfigured(env: Env): boolean {
  return hasAny(
    env,
    'NEXT_PUBLIC_GA_ID',
    'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
    'NEXT_PUBLIC_POSTHOG_KEY',
  );
}

/** Full status list. Pass an explicit env for testing; defaults to process.env. */
export function getIntegrationStatus(env: Env = process.env): IntegrationStatus[] {
  return [
    {
      id: 'supabase',
      label: 'Supabase (accounts + cloud data)',
      configured: has(env, 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      requiredEnv: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
      note: 'Sign-in, saved sessions, and cloud sync across devices.',
      category: 'core',
    },
    {
      id: 'aiVision',
      label: 'AI video vision',
      configured: aiConfigured(env),
      requiredEnv: ['AI_VISION_PROVIDER', 'OPENAI_API_KEY | ANTHROPIC_API_KEY | GOOGLE_AI_API_KEY'],
      note: 'Real AI review of uploaded swing frames.',
      category: 'core',
    },
    {
      id: 'aiCoach',
      label: 'AI Coach chat',
      configured: aiConfigured(env),
      requiredEnv: ['AI_PROVIDER', 'OPENAI_API_KEY | ANTHROPIC_API_KEY | GOOGLE_AI_API_KEY'],
      note: 'Conversational coaching grounded in the athlete’s data.',
      category: 'core',
    },
    {
      id: 'ocr',
      label: 'OCR launch-monitor import',
      configured: ocrConfigured(env),
      requiredEnv: ['OCR_PROVIDER', 'OPENAI_API_KEY | GOOGLE_CLOUD_VISION_API_KEY'],
      note: 'Read numbers from a photo of a launch-monitor screen.',
      category: 'core',
    },
    {
      id: 'email',
      label: 'Email capture / notifications',
      configured: emailConfigured(env),
      requiredEnv: [
        'RESEND_API_KEY + RESEND_AUDIENCE_ID',
        '(or) CONVERTKIT_API_KEY + CONVERTKIT_FORM_ID',
        '(or) MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID + MAILCHIMP_SERVER_PREFIX',
        '(or) EMAIL_CAPTURE_WEBHOOK_URL',
      ],
      note: 'Save leads and send lifecycle emails.',
      category: 'growth',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      configured: analyticsConfigured(env),
      requiredEnv: ['NEXT_PUBLIC_GA_ID | NEXT_PUBLIC_PLAUSIBLE_DOMAIN | NEXT_PUBLIC_POSTHOG_KEY'],
      note: 'Usage measurement (otherwise events log to the console only).',
      category: 'growth',
    },
    {
      id: 'stripe',
      label: 'Stripe billing',
      configured: stripeConfigured(env),
      requiredEnv: [
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRICE_PRO | STRIPE_PRICE_TEAM',
      ],
      note: 'Paid Pro/Team tiers (checkout, billing portal, webhooks).',
      category: 'monetization',
    },
  ];
}

/** True/false for a single integration. */
export function isIntegrationConfigured(id: IntegrationId, env: Env = process.env): boolean {
  return getIntegrationStatus(env).find((s) => s.id === id)?.configured ?? false;
}

/** Count of configured integrations — handy for an admin badge. */
export function configuredCount(env: Env = process.env): { configured: number; total: number } {
  const all = getIntegrationStatus(env);
  return { configured: all.filter((s) => s.configured).length, total: all.length };
}
