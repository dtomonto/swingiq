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
    // Capture pageviews on initial load AND on App-Router client navigations
    // (history pushState/replaceState) — without this, SPA route changes would
    // be undercounted ($pageview only on hard loads). (P1.6)
    capture_pageview: 'history_change',
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

  // Tag every event with the build environment so PostHog can exclude
  // dev/preview/internal traffic from product metrics (filter `environment`
  // in the PostHog UI). (P1.6)
  posthog.register({ environment: process.env.NODE_ENV || 'production' });

  // Route client-side exceptions into PostHog error tracking via the existing
  // provider-agnostic observability reporter, so each error correlates with the
  // user's events, identity, and (if ever enabled) replay. (audit §J)
  registerPostHogErrorSink();
}

interface SinkWindow extends Window {
  __svCaptureException?: (error: unknown, context?: Record<string, unknown>) => void;
}

/**
 * Install PostHog as the observability sink (`window.__svCaptureException`),
 * which lib/observability/report.ts forwards every reported error to. Does not
 * clobber a sink another provider (e.g. Sentry) already registered.
 */
function registerPostHogErrorSink(): void {
  if (typeof window === 'undefined') return;
  const w = window as SinkWindow;
  if (typeof w.__svCaptureException === 'function') return;
  w.__svCaptureException = (error, context) => {
    try {
      posthog.captureException(error, context);
    } catch {
      /* never throw from the error sink */
    }
  };
}

/** Whether the SDK has been initialized in this session (test/debug aid). */
export function isPostHogInitialized(): boolean {
  return initialized;
}
