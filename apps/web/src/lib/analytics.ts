// ============================================================
// SwingIQ — Analytics Abstraction Layer
//
// Provider resolution (graceful fallback, no hard dependency):
//   1. GA4 — active when NEXT_PUBLIC_GA_ID is set AND gtag is loaded
//      (see components/analytics/Analytics.tsx).
//   2. Plausible — used if window.plausible exists.
//   3. PostHog — used if window.posthog exists.
//   4. Console — development fallback so events are always visible.
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
  posthog?: { capture: (event: string, props?: Props) => void };
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

  if (!delivered && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', event, properties ?? {});
  }
}

/** Convenience helper for the very common page_view event. */
export function trackPageView(path: string): void {
  track(ANALYTICS_EVENTS.PAGE_VIEW, { path });
}

export { ANALYTICS_EVENTS } from '@swingiq/core';
export type { AnalyticsEventName } from '@swingiq/core';
