// ============================================================
// SwingIQ — Analytics Abstraction Layer
// Connect to PostHog, GA4, Segment, or Mixpanel by implementing
// the track function below.
// ============================================================

import { ANALYTICS_EVENTS } from '@swingiq/core';
import type { AnalyticsEventName } from '@swingiq/core';

export function track(
  event: AnalyticsEventName,
  properties?: Record<string, unknown>,
): void {
  // Development: log events to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }

  // Production: uncomment and configure your analytics provider
  // if (typeof window !== 'undefined' && (window as any).posthog) {
  //   (window as any).posthog.capture(event, properties);
  // }
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', event, properties);
  // }
}

export { ANALYTICS_EVENTS } from '@swingiq/core';
export type { AnalyticsEventName } from '@swingiq/core';
