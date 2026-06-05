// ============================================================
// SwingIQ — Capability Detection (keyless-first)
//
// Single source of truth for which OPTIONAL integrations are
// configured. SwingIQ is designed to work fully without any of
// these — every feature has a local, keyless mode. Providing a
// key simply unlocks the corresponding upgrade (real auth, real
// AI, OCR, email delivery, paid tiers).
//
// SECURITY: never expose secret values to the client. The helpers
// that read server-only env vars must only be called server-side;
// the client-safe surface is `isSupabaseConfigured` and the boolean
// summary returned by the /api/capabilities route.
// ============================================================

/**
 * True only when a value is set to a real, non-placeholder value.
 * Treats the documented .env.example placeholders ("your-...",
 * "change-me-...", "none", empty) as "not configured" so a copied
 * but unedited .env.local never produces a false positive.
 */
export function isConfigured(value: string | undefined | null): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v === '' || v === 'none') return false;
  if (v.startsWith('your-') || v.startsWith('change-me')) return false;
  return true;
}

// ── Client-safe (NEXT_PUBLIC_*) ─────────────────────────────
// Safe to evaluate in the browser; only references public env vars.

export const isSupabaseConfigured: boolean =
  isConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  isConfigured(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Ads — Phase 2 of the monetization strategy (first revenue from the free
 * audience; see docs/MONETIZATION_STRATEGY.md). Keyless-first: with no
 * ad-network id set, SwingIQ renders ZERO ads (the clean free experience).
 * Ads only appear once a network is configured — mirroring how Stripe stays
 * a waitlist until keys exist. Client-safe (only references NEXT_PUBLIC_* vars).
 * Keep any rendered ads non-personalized / contextual for youth-safety.
 */
export const isAdsConfigured: boolean =
  isConfigured(process.env.NEXT_PUBLIC_ADS_PROVIDER) &&
  isConfigured(process.env.NEXT_PUBLIC_ADS_CLIENT_ID);

// ── Server-only capability checks ───────────────────────────
// Call these from Server Components, Route Handlers, or Server
// Actions only — they read secret env vars.

export function isAiCoachConfigured(): boolean {
  const provider = process.env.AI_PROVIDER;
  if (!isConfigured(provider)) return false;
  if (provider === 'openai') return isConfigured(process.env.OPENAI_API_KEY);
  if (provider === 'anthropic') return isConfigured(process.env.ANTHROPIC_API_KEY);
  return false;
}

export function isAiVisionConfigured(): boolean {
  const provider = process.env.AI_VISION_PROVIDER;
  if (!isConfigured(provider)) return false;
  if (provider === 'anthropic') return isConfigured(process.env.ANTHROPIC_API_KEY);
  if (provider === 'openai') return isConfigured(process.env.OPENAI_API_KEY);
  if (provider === 'google') return isConfigured(process.env.GOOGLE_AI_API_KEY);
  return false;
}

/**
 * OCR auto-extraction for image/table import. To keep this "just works",
 * it reuses ANY vision-capable provider key already configured for the
 * product: an explicit OCR_PROVIDER first, then the AI-vision provider,
 * then the AI-coach provider. Manual review remains the keyless default
 * and every extraction still requires user confirmation before saving.
 */
export type OcrProviderId = 'anthropic' | 'openai' | 'google';

export interface ResolvedOcrProvider {
  provider: OcrProviderId;
  apiKey: string;
  model: string;
}

/** Map a raw env value (incl. aliases) onto a canonical provider id. */
function normalizeProvider(raw: string | undefined): OcrProviderId | null {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'anthropic' || v === 'claude') return 'anthropic';
  if (v === 'openai') return 'openai';
  if (v === 'google' || v === 'gemini') return 'google';
  return null;
}

function apiKeyFor(provider: OcrProviderId): string | undefined {
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY;
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  return process.env.GOOGLE_AI_API_KEY;
}

function defaultModelFor(provider: OcrProviderId): string {
  if (provider === 'anthropic') return 'claude-sonnet-4-6';
  if (provider === 'openai') return 'gpt-4o';
  return 'gemini-1.5-flash';
}

/**
 * Resolve the provider OCR should use, or null when nothing is configured.
 * Tries OCR_PROVIDER, then AI_VISION_PROVIDER, then AI_PROVIDER, returning
 * the first whose matching API key is really set. SERVER-ONLY (reads secrets).
 */
export function resolveOcrProvider(): ResolvedOcrProvider | null {
  const candidates = [
    process.env.OCR_PROVIDER,
    process.env.AI_VISION_PROVIDER,
    process.env.AI_PROVIDER,
  ];
  for (const raw of candidates) {
    const provider = normalizeProvider(raw);
    if (!provider) continue;
    const apiKey = apiKeyFor(provider);
    if (!isConfigured(apiKey)) continue;
    const model =
      (isConfigured(process.env.OCR_MODEL) && process.env.OCR_MODEL!) ||
      (isConfigured(process.env.AI_VISION_MODEL) && process.env.AI_VISION_MODEL!) ||
      defaultModelFor(provider);
    return { provider, apiKey: apiKey!.trim(), model };
  }
  return null;
}

export function isOcrConfigured(): boolean {
  return resolveOcrProvider() !== null;
}

/**
 * Email lead capture (Resend / ConvertKit / Mailchimp / webhook).
 * Mirrors lib/email/capture.ts `configuredProvider()`. Keyless default:
 * honest no-op (the API reports persisted:false).
 */
export function isEmailConfigured(): boolean {
  if (isConfigured(process.env.RESEND_API_KEY) && isConfigured(process.env.RESEND_AUDIENCE_ID)) return true;
  if (isConfigured(process.env.CONVERTKIT_API_KEY) && isConfigured(process.env.CONVERTKIT_FORM_ID)) return true;
  if (
    isConfigured(process.env.MAILCHIMP_API_KEY) &&
    isConfigured(process.env.MAILCHIMP_LIST_ID) &&
    isConfigured(process.env.MAILCHIMP_SERVER_PREFIX)
  ) {
    return true;
  }
  if (isConfigured(process.env.EMAIL_CAPTURE_WEBHOOK_URL)) return true;
  return false;
}

/** Paid tiers via Stripe. Keyless default: waitlist capture, no charges. */
export function isStripeConfigured(): boolean {
  return (
    isConfigured(process.env.STRIPE_SECRET_KEY) &&
    isConfigured(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}

/**
 * Boolean-only capability summary, safe to send to the browser.
 * Used by GET /api/capabilities so client UIs can show honest
 * "active" vs "coming soon / add a key" states without ever
 * receiving a secret.
 */
export interface CapabilitySummary {
  /** Real accounts + cloud sync (else: local device-only profile). */
  auth: boolean;
  /** Real AI coaching responses (else: data-grounded placeholders). */
  aiCoach: boolean;
  /** Real AI swing-video vision (else: honest "not configured"). */
  aiVision: boolean;
  /** OCR auto-extraction (else: manual review). */
  ocr: boolean;
  /** Transactional email delivery (else: local capture only). */
  email: boolean;
  /** Live paid checkout (else: waitlist). */
  billing: boolean;
  /** Ads enabled (Phase 2; else: clean ad-free free experience). */
  ads: boolean;
}

export function getServerCapabilities(): CapabilitySummary {
  return {
    auth: isSupabaseConfigured,
    aiCoach: isAiCoachConfigured(),
    aiVision: isAiVisionConfigured(),
    ocr: isOcrConfigured(),
    email: isEmailConfigured(),
    billing: isStripeConfigured(),
    ads: isAdsConfigured,
  };
}
