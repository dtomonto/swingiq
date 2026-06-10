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
/** sessionStorage key caching the resolved region for this session. */
const REGION_KEY = 'swingiq_region';

/** Custom event fired in-tab whenever the choice (or region) changes. */
const CONSENT_EVENT = 'swingiq-consent-change';

export type ConsentDecision = 'accepted' | 'declined';

// ── Region (geo-aware default) ────────────────────────────────
// EU/EEA/UK (and Switzerland) require prior opt-in: nothing loads until the
// visitor explicitly accepts. Everywhere else defaults to ON with an easy
// opt-out. The region is resolved once per session from the edge geo header
// via GET /api/region; until it is known we behave as 'eu' (the safe default).

export type Region = 'eu' | 'other';

/** ISO-3166 alpha-2 codes that get the strict opt-in treatment. */
const OPT_IN_COUNTRIES = new Set([
  // EU 27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA + UK + Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
]);

/** Whether a country code is in the opt-in (GDPR-style) region. */
export function isOptInCountry(code: string | null | undefined): boolean {
  return Boolean(code && OPT_IN_COUNTRIES.has(code.trim().toUpperCase()));
}

/** Map a country code to a consent region (null = unknown). */
export function regionForCountry(code: string | null | undefined): Region | null {
  if (!code || !code.trim()) return null;
  return isOptInCountry(code) ? 'eu' : 'other';
}

/** The region resolved this session, or null when not yet known. */
export function getRegion(): Region | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(REGION_KEY);
    return v === 'eu' || v === 'other' ? v : null;
  } catch {
    return null;
  }
}

/** Cache the resolved region for the session and notify subscribers. */
export function setRegion(region: Region): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(REGION_KEY, region);
  } catch {
    /* sessionStorage unavailable */
  }
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    /* no-op */
  }
}

let regionFetch: Promise<void> | null = null;
let regionSettled = false;

/**
 * Whether the region lookup has finished (success OR failure). The banner waits
 * for this so it appears once in its final mode rather than flipping from
 * opt-in to opt-out mid-resolution. An unresolved region counts as settled the
 * moment the lookup completes — it just falls back to the safe opt-in default.
 */
export function isRegionSettled(): boolean {
  return regionSettled || getRegion() !== null;
}

/**
 * Resolve the region once per session from /api/region (idempotent). A known
 * region short-circuits; an in-flight fetch is reused. An 'unknown' result
 * (no geo header) leaves the region null so the safe opt-in default stands.
 */
export function ensureRegion(): void {
  if (typeof window === 'undefined' || getRegion() !== null || regionFetch) return;
  const settle = () => {
    regionSettled = true;
    try {
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {
      /* no-op */
    }
  };
  regionFetch = fetch('/api/region', { cache: 'no-store' })
    .then((r) => r.json())
    .then((j: { region?: string }) => {
      if (j.region === 'eu' || j.region === 'other') setRegion(j.region);
    })
    .catch(() => {
      /* network error — stay on the safe opt-in default */
    })
    .finally(settle);
}

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
 * Whether cookie-setting analytics may run, given the region:
 *   • 'other'        — default ON: runs unless the visitor explicitly declined.
 *   • 'eu' / unknown — strict opt-in: runs only after an explicit accept.
 * The unknown (null) case deliberately uses the safe opt-in branch, so nothing
 * loads before the region is resolved.
 */
export function hasAnalyticsConsent(): boolean {
  if (getRegion() === 'other') return getConsent() !== 'declined';
  return getConsent() === 'accepted';
}

/**
 * How the banner should present, or null when it should not show yet:
 *   • 'optin'  — EU/unknown: explicit Accept all / Decline, nothing pre-checked.
 *   • 'optout' — elsewhere: a pre-checked "Accept all" the visitor can untick.
 */
export function bannerMode(): 'optin' | 'optout' {
  return getRegion() === 'other' ? 'optout' : 'optin';
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
