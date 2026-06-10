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

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

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

      {/* PostHog — product analytics. Loads only when NEXT_PUBLIC_POSTHOG_KEY is set AND consented. */}
      {POSTHOG_KEY && (
        <Script id="posthog-init" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}'});`}
        </Script>
      )}
    </>
  );
}
