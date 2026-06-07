// ============================================================
// SwingVantage — "Returning user" detection (device-local)
//
// Powers the homepage shortcut: a visitor who has used SwingVantage
// on this device before is sent straight to /login (or /dashboard if
// they still have an active session) instead of the marketing splash.
//
// Why a durable flag and not just the session?
//   • Cloud (Supabase) mode — the live mode — CLEARS its auth token from
//     localStorage on sign-out. So after a returning user logs out there
//     is no session signal left to recognize them by. We therefore set a
//     durable flag the first time they ever authenticate and never clear
//     it on sign-out: signing out doesn't make you a new person.
//   • Local (keyless) mode — the presence of any account on the device is
//     itself proof they've been here.
//
// Crawlers/SEO are unaffected: this is read only in the browser, so search
// engines (no localStorage) always receive the full server-rendered home.
// ============================================================

import { localAccountCount } from './localAuth';

/** Durable "this device has authenticated before" marker. */
const RETURNING_KEY = 'swingiq.returning.v1';

/**
 * Record that this device has a known user. Called on every successful
 * sign-in / sign-up (both auth backends). Never cleared on sign-out.
 */
export function markReturningUser(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RETURNING_KEY, '1');
  } catch {
    // localStorage may be unavailable (private mode, disabled). The feature
    // simply degrades to "show the marketing home" — never a hard failure.
  }
}

/**
 * True when this device has been used by a SwingVantage account before.
 * Combines three independent signals so it stays correct across both auth
 * backends and recognizes users who pre-date this flag:
 *   1. the durable flag we set on authentication;
 *   2. any local (keyless) account stored on the device;
 *   3. a lingering Supabase auth token (e.g. an expired-but-not-signed-out
 *      cloud session).
 */
export function isReturningUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ls = window.localStorage;
    if (ls.getItem(RETURNING_KEY) === '1') return true;
    if (localAccountCount() > 0) return true;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
  } catch {
    // Treat any storage error as "new visitor" — fail open to the marketing home.
  }
  return false;
}
