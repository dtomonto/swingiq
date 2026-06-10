// ============================================================
// Keys & Secrets — managed-key registry (PURE, client-safe)
// ------------------------------------------------------------
// One catalog of every key the dashboard can manage: what it is, which provider
// it belongs to, what it unlocks, and a format pattern used to AUTO-DETECT the
// provider when an operator pastes a value. Contains NO secret values — only
// metadata — so it imports safely on the client.
//
// Add a manageable key = add an entry here. Detection + status + UI all derive
// from this list.
// ============================================================

export type SecretCategory = 'core' | 'ai' | 'email' | 'monetization' | 'growth' | 'devops';

export interface ManagedKey {
  /** The env var name (canonical id). */
  name: string;
  label: string;
  /** Logical provider id (groups related keys). */
  provider: string;
  providerLabel: string;
  category: SecretCategory;
  /** Secret (server-only) vs public (NEXT_PUBLIC_*, safe to expose). */
  secret: boolean;
  /** Plain-English description of what setting this unlocks. */
  activates: string;
  /** Format matcher used to auto-detect this key from a pasted value. */
  detect?: RegExp;
  /** Example/placeholder shown in the input. */
  placeholder?: string;
  /** Where to obtain the key. */
  docsUrl?: string;
}

export const MANAGED_KEYS: ManagedKey[] = [
  // ── Core ──
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', provider: 'supabase', providerLabel: 'Supabase',
    category: 'core', secret: false, activates: 'Accounts, saved sessions & cloud sync',
    detect: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/i, placeholder: 'https://xxxx.supabase.co',
    docsUrl: 'https://supabase.com/dashboard',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key', provider: 'supabase', providerLabel: 'Supabase',
    category: 'core', secret: false, activates: 'Client access to Supabase (public anon key)',
    detect: /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/, placeholder: 'eyJhbGciOi...',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service-role key', provider: 'supabase', providerLabel: 'Supabase',
    category: 'core', secret: true, activates: 'Admin/server data access (bypasses RLS)',
    detect: /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/, placeholder: 'eyJhbGciOi...',
  },
  // ── AI providers ──
  {
    name: 'ANTHROPIC_API_KEY', label: 'Anthropic API key', provider: 'anthropic', providerLabel: 'Anthropic (Claude)',
    category: 'ai', secret: true, activates: 'AI swing vision + AI coach + OCR',
    detect: /^sk-ant-[\w-]{20,}$/, placeholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    name: 'OPENAI_API_KEY', label: 'OpenAI API key', provider: 'openai', providerLabel: 'OpenAI',
    category: 'ai', secret: true, activates: 'AI swing vision + AI coach + OCR',
    detect: /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/, placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'GOOGLE_AI_API_KEY', label: 'Google AI (Gemini) key', provider: 'google', providerLabel: 'Google AI',
    category: 'ai', secret: true, activates: 'AI vision/coach via Gemini',
    detect: /^AIza[0-9A-Za-z_-]{30,}$/, placeholder: 'AIza...', docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    name: 'GOOGLE_CLOUD_VISION_API_KEY', label: 'Google Cloud Vision key', provider: 'google', providerLabel: 'Google Cloud',
    category: 'ai', secret: true, activates: 'OCR launch-monitor import (Google Vision)',
    detect: /^AIza[0-9A-Za-z_-]{30,}$/, placeholder: 'AIza...',
  },
  // ── Email ──
  {
    name: 'RESEND_API_KEY', label: 'Resend API key', provider: 'resend', providerLabel: 'Resend',
    category: 'email', secret: true, activates: 'Transactional email + lead capture',
    detect: /^re_[A-Za-z0-9_]{10,}$/, placeholder: 're_...', docsUrl: 'https://resend.com/api-keys',
  },
  {
    name: 'RESEND_AUDIENCE_ID', label: 'Resend audience id', provider: 'resend', providerLabel: 'Resend',
    category: 'email', secret: false, activates: 'Resend audience for captured leads',
    detect: /^[0-9a-f-]{36}$/i, placeholder: 'xxxxxxxx-...',
  },
  {
    name: 'CONVERTKIT_API_KEY', label: 'ConvertKit API key', provider: 'convertkit', providerLabel: 'ConvertKit',
    category: 'email', secret: true, activates: 'Email capture via ConvertKit', placeholder: 'your-convertkit-key',
  },
  {
    name: 'MAILCHIMP_API_KEY', label: 'Mailchimp API key', provider: 'mailchimp', providerLabel: 'Mailchimp',
    category: 'email', secret: true, activates: 'Email capture via Mailchimp',
    detect: /^[0-9a-f]{32}-us\d{1,2}$/i, placeholder: 'xxxx-us21',
  },
  // ── Monetization (Stripe) ──
  {
    name: 'STRIPE_SECRET_KEY', label: 'Stripe secret key', provider: 'stripe', providerLabel: 'Stripe',
    category: 'monetization', secret: true, activates: 'Paid checkout + billing portal',
    detect: /^sk_(live|test)_[A-Za-z0-9]{20,}$/, placeholder: 'sk_live_...', docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe publishable key', provider: 'stripe', providerLabel: 'Stripe',
    category: 'monetization', secret: false, activates: 'Client-side Stripe checkout',
    detect: /^pk_(live|test)_[A-Za-z0-9]{20,}$/, placeholder: 'pk_live_...',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe webhook secret', provider: 'stripe', providerLabel: 'Stripe',
    category: 'monetization', secret: true, activates: 'Verified Stripe webhooks',
    detect: /^whsec_[A-Za-z0-9]{20,}$/, placeholder: 'whsec_...',
  },
  // ── Growth / analytics ──
  {
    name: 'NEXT_PUBLIC_POSTHOG_KEY', label: 'PostHog key', provider: 'posthog', providerLabel: 'PostHog',
    category: 'growth', secret: false, activates: 'Product analytics (PostHog)',
    detect: /^phc_[A-Za-z0-9]{20,}$/, placeholder: 'phc_...',
  },
  {
    name: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', label: 'Plausible domain', provider: 'plausible', providerLabel: 'Plausible',
    category: 'growth', secret: false, activates: 'Privacy-friendly analytics', placeholder: 'swingvantage.com',
  },
  {
    name: 'NEXT_PUBLIC_GA_ID', label: 'Google Analytics id', provider: 'ga', providerLabel: 'Google Analytics',
    category: 'growth', secret: false, activates: 'Google Analytics 4',
    detect: /^G-[A-Z0-9]{6,}$/, placeholder: 'G-XXXXXXX',
  },
  {
    name: 'NEXT_PUBLIC_CLARITY_PROJECT_ID', label: 'Microsoft Clarity id', provider: 'clarity', providerLabel: 'Microsoft Clarity',
    category: 'growth', secret: false, activates: 'Session replay + heatmaps (Clarity)',
    detect: /^[a-z0-9]{10}$/, placeholder: 'abc1defgh2',
  },
  // ── DevOps (PublishingOS executor + cron) ──
  {
    name: 'GITHUB_TOKEN', label: 'GitHub token', provider: 'github', providerLabel: 'GitHub',
    category: 'devops', secret: true, activates: 'PublishingOS deploy-backed PR executor',
    detect: /^(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})$/, placeholder: 'ghp_... or github_pat_...',
    docsUrl: 'https://github.com/settings/tokens',
  },
  {
    name: 'CRON_SECRET', label: 'Cron secret', provider: 'internal', providerLabel: 'Internal',
    category: 'devops', secret: true, activates: 'Authenticates scheduled (cron) jobs',
    placeholder: 'a long random string',
  },
  {
    name: 'AUDIT_ACCESS_TOKEN', label: 'External auditor token', provider: 'internal', providerLabel: 'Internal',
    category: 'devops', secret: true, activates: 'Token-gated /api/audit access',
    placeholder: 'a long random string',
  },
];

/** Look up a managed key by env var name. */
export function findManagedKey(name: string): ManagedKey | undefined {
  return MANAGED_KEYS.find((k) => k.name === name);
}

/** True when a name is in the managed catalog (the only names the API will write). */
export function isManagedKey(name: string): boolean {
  return MANAGED_KEYS.some((k) => k.name === name);
}
