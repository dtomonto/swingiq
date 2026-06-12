// ============================================================
// SwingVantage — Analytics Abstraction Layer
//
// Provider resolution (graceful fallback, no hard dependency):
//   1. GA4 — active when NEXT_PUBLIC_GA_ID is set AND gtag is loaded
//      (see components/analytics/Analytics.tsx).
//   2. Plausible — used if window.plausible exists.
//   3. PostHog — used if window.posthog exists.
//   4. Microsoft Clarity — used if window.clarity exists.
//   5. Console — development fallback so events are always visible.
//
// Nothing here throws if a provider is missing; events are simply
// logged in development and dropped in production until a provider
// is configured.
// ============================================================

import { ANALYTICS_EVENTS } from '@swingiq/core';
import type { AnalyticsEventName } from '@swingiq/core';

type Props = Record<string, unknown>;

interface WindowWithProviders extends Window {
  gtag?: (command: string, ...args: unknown[]) => void;
  plausible?: (event: string, options?: { props?: Props }) => void;
  posthog?: {
    capture: (event: string, props?: Props) => void;
    identify?: (id: string, props?: Props) => void;
    reset?: (resetDeviceId?: boolean) => void;
    isFeatureEnabled?: (key: string) => boolean | undefined;
    captureException?: (error: unknown, props?: Props) => void;
  };
  clarity?: (command: string, ...args: unknown[]) => void;
}

/** The GA4 measurement ID, if configured. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

/** Whether a GA4 provider is configured at build time. */
export const isAnalyticsEnabled = Boolean(GA_ID);

export function track(event: AnalyticsEventName, properties?: Props): void {
  if (typeof window === 'undefined') return;

  const w = window as WindowWithProviders;
  let delivered = false;

  if (GA_ID && typeof w.gtag === 'function') {
    w.gtag('event', event, properties ?? {});
    delivered = true;
  }
  if (typeof w.plausible === 'function') {
    w.plausible(event, properties ? { props: properties } : undefined);
    delivered = true;
  }
  if (w.posthog?.capture) {
    w.posthog.capture(event, properties);
    delivered = true;
  }
  if (typeof w.clarity === 'function') {
    // Clarity tracks a named custom event; properties become smart tags
    // (string values only) so they stay filterable in the Clarity dashboard.
    w.clarity('event', event);
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) w.clarity('set', key, String(value));
      }
    }
    delivered = true;
  }

  if (!delivered && process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties ?? {});
  }
}

/** Convenience helper for the very common page_view event. */
export function trackPageView(path: string): void {
  track(ANALYTICS_EVENTS.PAGE_VIEW, { path });
}

// ── Identity & flags (PostHog-backed, provider-graceful) ──────────
//
// These forward to whatever has loaded (today: PostHog) and no-op otherwise, so
// callers never branch on whether a provider is configured. Identity is the P0
// fix that lets funnels follow a person across anonymous → signed-up → returning
// sessions. Pass ONLY a stable non-PII id (a user UUID) — never email/name —
// keeping PostHog PII-free in line with the event taxonomy policy.

/** Associate subsequent events with a known user; stitches prior anonymous events. */
export function identifyUser(id: string, properties?: Props): void {
  if (typeof window === 'undefined' || !id) return;
  (window as WindowWithProviders).posthog?.identify?.(id, properties);
}

/** Forget the current identity (call on sign-out) so a new anonymous id starts. */
export function resetUser(): void {
  if (typeof window === 'undefined') return;
  (window as WindowWithProviders).posthog?.reset?.();
}

/** Read a PostHog feature flag; returns `fallback` until flags resolve / when absent. */
export function featureEnabled(key: string, fallback = false): boolean {
  if (typeof window === 'undefined') return fallback;
  return (window as WindowWithProviders).posthog?.isFeatureEnabled?.(key) ?? fallback;
}

/** Report an error to the analytics provider (correlates with events/identity). */
export function captureError(error: unknown, properties?: Props): void {
  if (typeof window === 'undefined') return;
  (window as WindowWithProviders).posthog?.captureException?.(error, properties);
}

export { ANALYTICS_EVENTS } from '@swingiq/core';
export type { AnalyticsEventName } from '@swingiq/core';
