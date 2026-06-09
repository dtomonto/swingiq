// ============================================================
// Cookie / analytics consent — single source of truth (isomorphic)
// ------------------------------------------------------------
// One tiny, dependency-free store for the visitor's cookie choice, shared by
// the cookie banner (writes it) and every cookie-setting integration (reads
// it). Persisted in localStorage under `swingiq_cookie_consent`.
//
// Model: ONE umbrella decision covers every item in the consent registry, so
// the visitor accepts (or declines) them all in a single click — the best UX,
// and ethically sound because the registry is enumerated transparently and
// declining is exactly as easy as accepting.
//
//   • 'accepted'  — opted in; all cookie-setting analytics may load.
//   • 'declined'  — opted out; none may load.
//   • null        — no choice yet; default to NOT loading (opt-in, not opt-out).
//
// Essential app functionality never depends on this — declining only suppresses
// the optional, cookie-setting analytics below. Plausible is intentionally NOT
// in the registry: it is cookieless, so it needs no consent. All functions are
// SSR-safe (no-op / null on the server).
// ============================================================

export const CONSENT_KEY = 'swingiq_cookie_consent';

/** Custom event fired in-tab whenever the choice changes (for live updates). */
const CONSENT_EVENT = 'swingiq-consent-change';

export type ConsentDecision = 'accepted' | 'declined';

/** One integration that sets cookies / records and therefore needs opt-in. */
export interface ConsentItem {
  id: string;
  label: string;
  /** Plain-English "what it does + that it sets cookies". */
  description: string;
  /** True only when the integration is actually configured (env set). */
  provisioned: boolean;
}

const present = (v: string | undefined): boolean => Boolean(v && v.trim());

/**
 * The registry of everything that requires consent. `provisioned` reflects
 * whether the integration is actually configured — only provisioned items
 * really need consent (and drive whether the banner shows). NEXT_PUBLIC_* vars
 * are inlined at build time, so this is correct in the browser.
 */
export function consentItems(): ConsentItem[] {
  return [
    {
      id: 'clarity',
      label: 'Microsoft Clarity',
      description: 'Heatmaps & session replay to see how the product is used. Sets cookies.',
      provisioned: present(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID),
    },
    {
      id: 'ga4',
      label: 'Google Analytics',
      description: 'Aggregate traffic and audience analytics. Sets cookies.',
      provisioned: present(process.env.NEXT_PUBLIC_GA_ID),
    },
    {
      id: 'posthog',
      label: 'PostHog',
      description: 'Product analytics and funnels. Sets cookies.',
      provisioned: present(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    },
  ];
}

/** Only the items that are actually live, i.e. that genuinely need consent now. */
export function provisionedConsentItems(): ConsentItem[] {
  return consentItems().filter((i) => i.provisioned);
}

/**
 * Whether consent is required at all. False when no cookie-setting integration
 * is configured — in which case the banner never shows (no pointless friction).
 */
export function consentRequired(): boolean {
  return provisionedConsentItems().length > 0;
}

/** The current stored choice, or null when the visitor hasn't chosen yet. */
export function getConsent(): ConsentDecision | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

/**
 * True only when the visitor has explicitly accepted. Absent or declined
 * consent both return false — cookie-setting analytics stay off by default.
 */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted';
}

/** Record the visitor's choice and notify subscribers (this tab + others). */
export function setConsent(value: ConsentDecision): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage unavailable — choice simply isn't persisted */
  }
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    /* no-op */
  }
}

/** Accept every consent item at once (one umbrella decision). */
export function acceptAll(): void {
  setConsent('accepted');
}

/** Decline every consent item at once. */
export function declineAll(): void {
  setConsent('declined');
}

/** Clear the stored choice so the banner re-prompts (withdraw / change mind). */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* no-op */
  }
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    /* no-op */
  }
}

/**
 * Subscribe to consent changes. Fires on same-tab updates (custom event) and
 * cross-tab updates (storage event). Returns an unsubscribe function. Designed
 * for React's useSyncExternalStore.
 */
export function subscribeConsent(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
