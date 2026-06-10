// ============================================================
// ConnectorOS — Cloudflare Turnstile (server verify, scaffold)
// ------------------------------------------------------------
// Bot protection for abuse-sensitive public forms (signup, contact,
// newsletter, feedback). SERVER-ONLY verification — never trust the
// client token alone.
//
// Keyless-safe: with no CLOUDFLARE_TURNSTILE_SECRET_KEY set, verify()
// returns { ok: true, skipped: true } so local development and the
// keyless product are NEVER blocked. Add the widget on the client only
// when NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is present.
// See docs/connector-os/env-vars.md.
// ============================================================

import { isConfigured } from '@/lib/capabilities';

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type Env = Record<string, string | undefined>;

export interface TurnstileResult {
  ok: boolean;
  /** True when verification was skipped because Turnstile is not configured. */
  skipped: boolean;
  /** Cloudflare error codes, when ok is false and not skipped. */
  errors?: string[];
}

/** Whether Turnstile is configured (both site + secret keys set). */
export function isTurnstileConfigured(env: Env = process.env): boolean {
  return (
    isConfigured(env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY) &&
    isConfigured(env.CLOUDFLARE_TURNSTILE_SECRET_KEY)
  );
}

/** The public site key for the client widget (safe to expose). */
export function turnstileSiteKey(env: Env = process.env): string | null {
  const k = env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  return isConfigured(k) ? k!.trim() : null;
}

/**
 * Verify a Turnstile token server-side. SERVER-ONLY (reads the secret).
 * Returns ok:true,skipped:true when unconfigured so forms still work.
 *
 * @param fetchImpl injectable fetch (tests); defaults to global fetch.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  const secret = env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!isConfigured(secret)) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false, errors: ['missing-input-response'] };

  const form = new URLSearchParams();
  form.set('secret', secret!.trim());
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  try {
    const res = await fetchImpl(VERIFY_ENDPOINT, { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return {
      ok: Boolean(data.success),
      skipped: false,
      errors: data.success ? undefined : data['error-codes'] ?? ['verification-failed'],
    };
  } catch {
    // Fail closed on a verification outage for protected forms.
    return { ok: false, skipped: false, errors: ['verification-unreachable'] };
  }
}
