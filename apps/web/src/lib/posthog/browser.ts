// ============================================================
// PostHog — browser SDK initialization (CLIENT-ONLY)
// ------------------------------------------------------------
// The ONLY module that imports `posthog-js`. Replaces the legacy inline
// `array.js` CDN snippet with the real SDK so we get typed identify/reset,
// feature flags, and a SAFE-BY-DEFAULT session-replay configuration.
//
// Loading is gated upstream by consent + env (see ConsentGatedAnalytics →
// PostHogProvider); this module only runs once init() is actually called.
// posthog-js sets `window.posthog`, so the existing multiplexed `track()` in
// lib/analytics.ts keeps working unchanged.
//
// Privacy posture (see docs/POSTHOG_AUDIT_2026-06.md §I):
//   • person_profiles: 'identified_only' — no person profile for anonymous
//     visitors; identify() (post-login) stitches their prior anonymous events.
//   • Session replay is DISABLED by default and, if ever enabled in the project,
//     masks all inputs. Never enable replay on upload / admin / auth surfaces
//     without the scoped masking plan.
// ============================================================

import posthog from 'posthog-js';

let initialized = false;

const POSTHOG_DEFAULT_HOST = 'https://us.i.posthog.com';

/**
 * Initialize the PostHog browser SDK once. Idempotent and SSR-safe: a no-op on
 * the server, when already initialized, or when no public key is configured.
 */
export function initPostHog(): void {
  if (initialized || typeof window === 'undefined') return;

  const key = (process.env.NEXT_PUBLIC_POSTHOG_KEY || '').trim();
  if (!key) return;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || '').trim() || POSTHOG_DEFAULT_HOST;

  initialized = true;

  posthog.init(key, {
    api_host: host,
    // Only create a person profile once a user is identified — privacy-friendly
    // and avoids billing for anonymous-only visitors. Anonymous events are still
    // captured and back-filled to the person on identify().
    person_profiles: 'identified_only',
    // Capture clicks/submits only — never input values (autocapture never sends
    // field contents). Keeps autocapture useful without DOM noise.
    autocapture: { dom_event_allowlist: ['click', 'submit'] },
    // Session replay OFF by default. The masking config below is a safety net so
    // that if replay is enabled in the PostHog project it never records raw input
    // contents. Scoped per-surface enablement is a separate, deliberate step.
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
    // Extra courtesy on top of our own consent gate.
    respect_dnt: true,
  });
}

/** Whether the SDK has been initialized in this session (test/debug aid). */
export function isPostHogInitialized(): boolean {
  return initialized;
}
