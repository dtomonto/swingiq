# ConnectorOS — Architecture

ConnectorOS is **one coherent operating layer** over the connectors SwingVantage
already uses — not a junk drawer of SaaS tools. Every connector must make the core
promise — **"One fix. One plan. One retest."** — more reliable, measurable, trusted,
or discoverable. If it doesn't, it doesn't ship.

## Design principles

1. **Integrate, don't duplicate.** Each layer wraps an *existing* SwingVantage
   primitive (analytics `track()`, `reportError`, `lib/capabilities`, `lib/seo`).
2. **Keyless-first.** Every connector has a safe local default and is OFF until a
   key exists (mirrors `lib/capabilities.ts`). No key → no network calls, no bloat.
3. **One source of truth for status.** `lib/connector-os/feature-flags/connector-status.ts`
   computes configured/missing for every connector; Setup, Integrations, System
   Health and the ConnectorOS admin view all read it.
4. **Privacy by default.** No PII, no raw video, no youth data in any connector.
5. **Minimum viable stack first; scaffold the rest.** Paid/account-bound tools get
   env + flags + docs + integration points, but are not installed until needed.

## Layers (and their SwingVantage home)

| # | Layer | Connectors | Status | Home in repo |
| --- | --- | --- | --- | --- |
| 1 | **Design System** | Figma MCP, Tokens Studio, Storybook, Chromatic, (Rive later) | scaffold/docs | `lib/connector-os/design-system/` |
| 2 | **Engineering Automation** | GitHub, Actions, Playwright, Lighthouse CI, axe, dep/security scan | mostly live | `.github/workflows/*`, `playwright.config.ts` |
| 3 | **Analytics & Growth** | **PostHog (product truth)**, **GA4 (acquisition truth)**, Clarity (opt-in), **Search Console (search truth)** | **live** | `lib/analytics.ts`, `lib/posthog/*`, `lib/consent.ts` |
| 4 | **Reliability** | **Sentry (error truth)**, Vercel Analytics/Speed Insights, uptime (later) | abstraction live, SDK deferred | `lib/observability/*`, `instrumentation*.ts` |
| 5 | **SEO / AEO / GEO** | GSC, Bing, IndexNow, schema validation, sitemap, internal linking | live + IndexNow/Bing new | `lib/seo/*`, `lib/connector-os/seo/*`, `app/sitemap.ts` |
| 6 | **Trust / Security** | Cloudflare Turnstile, WAF/CDN docs, privacy-safe analytics, retention, audit logs | scaffold + live posture | `lib/connector-os/security/*`, securityOS |
| 7 | **Video Intelligence** | **MediaPipe (live)**, Mux (next), Cloudinary (optional), Gemini/Twelve Labs (later) | MediaPipe live, rest scaffold | `lib/connector-os/video/*`, Motion Lab |
| 8 | **Admin Intelligence** | funnel summaries, SEO health, error health, flags, connector status | live + ConnectorOS read | `/admin/*`, `connector-status.ts` |
| 9 | **Monetization** | AdSense, affiliate, Stripe, beehiiv, Rewardful/FirstPromoter | flag-gated, waitlisted | `lib/capabilities.ts`, `/admin/monetization` |

## Default decisions (truth assignments)

- PostHog = **product analytics truth** · GA4 = **acquisition truth**
- Search Console = **search truth** · Sentry = **error truth**
- Vercel Speed Insights = **production performance truth**
- Figma/Tokens = **design truth** · GitHub Actions = **quality truth**
- Clarity = the **only** session-replay tool (no second one — ever).

## Monetization architecture note

Monetize **content/tool edges first** (ads, affiliate, newsletter), keep the core
report/analysis experience premium and ad-free. All monetization connectors are
flag-gated in `lib/capabilities.ts` (`isAdsConfigured`, `isStripeConfigured`) and
must never render inside the analysis/report surface. Junior-athlete audience ⇒ any
ads must be non-personalized/contextual (COPPA/GDPR-K) — compliance read required
before enabling.

## Data flow

```
UI events ──► track() (lib/analytics) ──► PostHog / GA4 / Clarity (consent-gated)
errors    ──► reportError (lib/observability) ──► Sentry sink (when DSN set)
env/keys  ──► lib/capabilities + lib/consent ──► connector-status.ts ──► /admin (one truth)
content   ──► lib/seo + sitemap ──► GSC / Bing / IndexNow
video     ──► MediaPipe (on-device) ──► [future] Mux upload/playback
```
