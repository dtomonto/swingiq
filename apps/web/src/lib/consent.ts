// ============================================================
// Cookie / analytics consent — single source of truth (isomorphic)
// ------------------------------------------------------------
// One tiny, dependency-free store for the visitor's cookie choice, shared by
// the cookie banner (writes it) and any cookie-setting analytics (reads it).
// Persisted in localStorage under `swingiq_cookie_consent`.
//
// Semantics:
//   • 'accepted'  — the visitor opted in; cookie-setting analytics may load.
//   • 'declined'  — the visitor opted out; they must NOT load.
//   • null        — no choice yet; default to NOT loading (opt-in, not opt-out).
//
// Essential app functionality never depends on this — declining only suppresses
// optional, cookie-setting analytics (e.g. Microsoft Clarity). All functions
// are SSR-safe (no-op / null on the server).
// ============================================================

export const CONSENT_KEY = 'swingiq_cookie_consent';

/** Custom event fired in-tab whenever the choice changes (for live updates). */
const CONSENT_EVENT = 'swingiq-consent-change';

export type ConsentValue = 'accepted' | 'declined';

/** The current stored choice, or null when the visitor hasn't chosen yet. */
export function getConsent(): ConsentValue | null {
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
export function setConsent(value: ConsentValue): void {
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
