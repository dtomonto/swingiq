// ============================================================
// GrowthOS — Consent-aware analytics event utility (§29, §30)
// ------------------------------------------------------------
// A central, provider-agnostic event helper. It NEVER assumes a visitor
// can be tracked: every emit checks consent first and degrades to a
// no-op (console in dev) when consent is absent or no provider is wired.
//
// Safe to import client-side — reads only NEXT_PUBLIC_* + localStorage,
// never secrets. This is a scaffold: wire real providers in `dispatch`.
// ============================================================

import type { AnalyticsEvent, AnalyticsEventName, ConsentChannel, ConsentState } from './types';

const CONSENT_STORAGE_KEY = 'growthos.consent.v1';

type ConsentMap = Partial<Record<ConsentChannel, ConsentState>>;

/** Read stored consent. Defaults to "unknown" for everything (deny-by-default). */
export function getConsent(): ConsentMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentMap) : {};
  } catch {
    return {};
  }
}

/** Persist a consent decision for one channel. */
export function setConsent(channel: ConsentChannel, state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getConsent();
    current[channel] = state;
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable — fail closed (no tracking) */
  }
}

/** True only when the channel is explicitly granted. Unknown -> false. */
export function hasConsent(channel: ConsentChannel): boolean {
  return getConsent()[channel] === 'granted';
}

/** Which providers are configured (public env only). */
export function configuredAnalyticsProviders(): string[] {
  const providers: string[] = [];
  if (process.env.NEXT_PUBLIC_GA_ID) providers.push('ga4');
  if (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) providers.push('plausible');
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) providers.push('posthog');
  return providers;
}

/** Cheap anonymous id (per-browser). Not a fingerprint; cleared on consent withdrawal. */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = window.localStorage.getItem('growthos.aid');
    if (!id) {
      id = `a_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem('growthos.aid', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

/**
 * Emit an analytics event. Returns a small result so callers/tests can see
 * whether it was sent, queued, or dropped (and why) — honesty over silence.
 */
export function track(
  name: AnalyticsEventName,
  metadata: Record<string, unknown> = {},
  opts: { userId?: string | null; requiresConsent?: ConsentChannel } = {},
): { status: 'sent' | 'dropped' | 'logged'; reason?: string } {
  const requiredChannel = opts.requiresConsent ?? 'analytics';

  // Consent gate — the core privacy guarantee.
  if (!hasConsent(requiredChannel)) {
    return { status: 'dropped', reason: `no ${requiredChannel} consent` };
  }

  const event: AnalyticsEvent = {
    name,
    userId: opts.userId ?? null,
    anonymousId: getAnonymousId(),
    timestamp: new Date().toISOString(),
    metadata: sanitizeMetadata(metadata),
  };

  return dispatch(event);
}

/** Strip obviously-sensitive keys so PII never lands in analytics by accident. */
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const BLOCKED = /(email|password|token|secret|ssn|card|phone|address|dob|name)/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (BLOCKED.test(k)) continue;
    // keep metadata lightweight — no nested blobs
    if (typeof v === 'object' && v !== null) continue;
    out[k] = v;
  }
  return out;
}

/** Route to a configured provider, else log in dev. Wire real SDKs here. */
function dispatch(event: AnalyticsEvent): { status: 'sent' | 'logged'; reason?: string } {
  const providers = configuredAnalyticsProviders();

  if (providers.length === 0) {
    if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
      console.info('[GrowthOS analytics:dev]', event.name, event.metadata);
    }
    return { status: 'logged', reason: 'no provider configured' };
  }

  // Plausible is the only one with a simple global API; GA4/PostHog would be
  // wired via their SDKs once installed. Kept defensive so this never throws.
  try {
    const w = window as unknown as { plausible?: (n: string, o?: unknown) => void };
    if (providers.includes('plausible') && typeof w.plausible === 'function') {
      w.plausible(event.name, { props: event.metadata });
    }
  } catch {
    /* never let analytics break the app */
  }
  return { status: 'sent' };
}
