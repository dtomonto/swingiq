import Script from 'next/script';
import { GA_ID } from '@/lib/analytics';

/**
 * Loads whichever analytics provider(s) are configured via env — and nothing
 * otherwise. With no provider set (the default), this renders nothing and
 * analytics calls fall back to the dev console (see lib/analytics.ts), keeping
 * the site fast and private by default.
 *
 * Supported (any combination; each is independently env-gated):
 *   • Plausible  — NEXT_PUBLIC_PLAUSIBLE_DOMAIN  (RECOMMENDED: cookieless &
 *     privacy-first, so it needs no cookie-consent banner and fits the
 *     youth-safe positioning). Auto-tracks page views incl. in-app navigation.
 *   • GA4        — NEXT_PUBLIC_GA_ID
 *   • PostHog    — NEXT_PUBLIC_POSTHOG_KEY (+ optional NEXT_PUBLIC_POSTHOG_HOST)
 *
 * All three also receive SwingIQ's custom events through lib/analytics.ts.
 */

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function Analytics() {
  return (
    <>
      {/* Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is set. */}
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

      {/* Plausible — cookieless, privacy-first, no consent banner required.
          script.js auto-tracks page views including SPA navigations; the shim
          exposes window.plausible so lib/analytics.ts can send custom events. */}
      {PLAUSIBLE_DOMAIN && (
        <>
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
          <Script id="plausible-init" strategy="afterInteractive">
            {`window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments) };`}
          </Script>
        </>
      )}

      {/* PostHog — product analytics. Loads only when NEXT_PUBLIC_POSTHOG_KEY is set. */}
      {POSTHOG_KEY && (
        <Script id="posthog-init" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}'});`}
        </Script>
      )}
    </>
  );
}
