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
 * OCR auto-extraction for image/table import. Reuses a vision-capable
 * provider key; manual review remains the keyless default.
 */
export function isOcrConfigured(): boolean {
  const provider = process.env.OCR_PROVIDER;
  if (!isConfigured(provider)) return false;
  if (provider === 'openai') return isConfigured(process.env.OPENAI_API_KEY);
  if (provider === 'google') return isConfigured(process.env.GOOGLE_AI_API_KEY);
  if (provider === 'anthropic') return isConfigured(process.env.ANTHROPIC_API_KEY);
  return false;
}

/** Transactional email delivery (e.g. Resend). Keyless default: no-op + local log. */
export function isEmailConfigured(): boolean {
  const provider = process.env.EMAIL_PROVIDER;
  if (!isConfigured(provider)) return false;
  if (provider === 'resend') return isConfigured(process.env.RESEND_API_KEY);
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
}

export function getServerCapabilities(): CapabilitySummary {
  return {
    auth: isSupabaseConfigured,
    aiCoach: isAiCoachConfigured(),
    aiVision: isAiVisionConfigured(),
    ocr: isOcrConfigured(),
    email: isEmailConfigured(),
    billing: isStripeConfigured(),
  };
}
