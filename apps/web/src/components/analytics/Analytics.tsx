import Script from 'next/script';
import { ClarityScript } from './ClarityScript';
import { ConsentGatedAnalytics } from './ConsentGatedAnalytics';

/**
 * Loads whichever analytics provider(s) are configured via env — and nothing
 * otherwise. With no provider set (the default), this renders nothing and
 * analytics calls fall back to the dev console (see lib/analytics.ts), keeping
 * the site fast and private by default.
 *
 * Consent posture (see lib/consent.ts):
 *   • Plausible — NEXT_PUBLIC_PLAUSIBLE_DOMAIN. Cookieless & privacy-first, so
 *     it needs NO consent and loads unconditionally here (server-rendered).
 *   • GA4 / PostHog / Clarity — set cookies, so they are CONSENT-GATED: they
 *     load only after the visitor accepts cookies (one umbrella choice in the
 *     banner). GA4 + PostHog live in <ConsentGatedAnalytics/>; Clarity adds an
 *     operator kill-switch on top in <ClarityScript/>.
 *
 * Every provider also receives SwingVantage's custom events through
 * lib/analytics.ts (which itself only forwards to whatever has actually loaded).
 */

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';

export function Analytics() {
  return (
    <>
      {/* Plausible — cookieless, privacy-first, no consent required.
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

      {/* Cookie-setting analytics — load only after the visitor accepts cookies. */}
      <ConsentGatedAnalytics />
      <ClarityScript />
    </>
  );
}
