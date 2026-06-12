'use client';

// ============================================================
// Consent-gated, cookie-setting analytics (GA4 + PostHog)
// ------------------------------------------------------------
// GA4 and PostHog set cookies, so — like Microsoft Clarity — they load ONLY
// after the visitor accepts cookies (the single umbrella consent in
// lib/consent.ts). With no consent (declined or not-yet-chosen) neither loads
// and the app works normally. Plausible is NOT here: it is cookieless and
// loads unconditionally from the server component (Analytics.tsx).
//
// Each provider stays independently env-gated, so nothing loads unless it is
// actually configured. Consent is read after mount via useSyncExternalStore
// (server snapshot = false), so accepting in the banner starts these live with
// no reload and there is no hydration mismatch.
// ============================================================

import Script from 'next/script';
import { useEffect, useSyncExternalStore } from 'react';
import { GA_ID } from '@/lib/analytics';
import { hasAnalyticsConsent, subscribeConsent, ensureRegion } from '@/lib/consent';
import { PostHogProvider } from './PostHogProvider';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';

export function ConsentGatedAnalytics() {
  // Resolve the consent region once (idempotent) and gate on region-aware
  // consent — EU/unknown opt-in, elsewhere default-on with opt-out.
  useEffect(() => { ensureRegion(); }, []);
  const consented = useSyncExternalStore(subscribeConsent, hasAnalyticsConsent, () => false);
  if (!consented) return null;

  return (
    <>
      {/* Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is set AND consented. */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* PostHog — product analytics via the posthog-js SDK (not the legacy CDN
          snippet). Loads only when NEXT_PUBLIC_POSTHOG_KEY is set AND consented.
          The provider also bridges auth → identify/reset. See PostHogProvider. */}
      {POSTHOG_KEY && <PostHogProvider />}
    </>
  );
}
