# ConnectorOS — Environment Variables

All ConnectorOS env vars are **optional and OFF by default** (keyless-first). A var
is only "configured" when set to a real, non-placeholder value (see
`isConfigured()` in `lib/capabilities.ts`). `NEXT_PUBLIC_*` vars are inlined at
build time and **safe for the browser**; everything else is **server-only** and must
never be prefixed `NEXT_PUBLIC_`.

See `apps/web/.env.example` for the copy-paste source with inline guidance.

## Required NOW (none are hard-required — the app runs keyless)

| Var | Why | Client-safe |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical URL for SEO/sitemap | ✅ |
| `ADMIN_SECRET` / `ADMIN_EMAILS` | protect `/admin` in production | ❌ secret |

## Analytics (already supported)

| Var | Stage | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | recommended | product-analytics truth; consent-gated |
| `NEXT_PUBLIC_GA_ID` | recommended | acquisition truth; consent-gated (cookies) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | cookieless, no consent needed |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | optional | replay/heatmaps; **opt-in only** |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` | optional | powers Analytics OS live numbers (server-only) |
| `CLARITY_DATA_EXPORT_TOKEN` | optional | Clarity OS metrics (server-only) |

## Reliability (Sentry — code ready, SDK deferred)

| Var | Stage | Client-safe |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | future | ✅ (DSN is public by design) |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | future | ❌ secret (source-map upload) |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` / `..._SPEED_INSIGHTS_ENABLED` | optional | ✅ |

`isObservabilityConfigured()` already flips System Health to "configured" once a DSN
is set. The reporter (`reportError`) starts delivering automatically when the Sentry
init sets the global sink — **no app code changes needed**.

## Security (Cloudflare Turnstile — scaffold)

| Var | Stage | Client-safe |
| --- | --- | --- |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | future | ✅ |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | future | ❌ secret (server verify) |

If unset, forms render **without** the widget and server verify is a safe pass in
dev — Turnstile never blocks local development.

## SEO / Indexing (GSC live; Bing + IndexNow new)

| Var | Stage | Client-safe |
| --- | --- | --- |
| `NEXT_PUBLIC_GSC_VERIFICATION` | optional | ✅ Google verify meta |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | new | ✅ Bing verify meta |
| `INDEXNOW_KEY` | new | ❌ server (also exposed at key-location file) |
| `INDEXNOW_KEY_LOCATION` | new | ❌ optional override of key-file URL |

## Video / Media (MediaPipe live; Mux/Cloudinary scaffold)

| Var | Stage | Client-safe |
| --- | --- | --- |
| `NEXT_PUBLIC_MEDIAPIPE_ENABLED` | optional | ✅ (Motion Lab already on-device) |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` / `MUX_WEBHOOK_SECRET` | future | ❌ secret |
| `NEXT_PUBLIC_MUX_PLAYBACK_SIGNING_KEY_ID` | future | ✅ |
| `MUX_PLAYBACK_SIGNING_PRIVATE_KEY` | future | ❌ secret |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | future | ❌ secret (cloud name ok) |

## AI / Monetization (future, already flag-gated)

`GEMINI_API_KEY`, `TWELVE_LABS_API_KEY`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`,
`STRIPE_*`, `BEEHIIV_API_KEY`, `REWARDFUL_API_KEY` — all future-stage; the app
waitlists/no-ops until set. Never expose any `*_SECRET` / private key client-side.

## How to enable / disable any integration safely

1. Set the var(s) in `.env.local` (never commit).
2. Restart the dev server / redeploy (NEXT_PUBLIC_* are build-time).
3. Confirm in **Admin → System Health / ConnectorOS** that status flipped to
   "Configured" (reads `connector-status.ts`).
4. To disable: unset the var → connector returns to its keyless default. Operator
   kill-switches (e.g. `clarity.enabled`) live in `/admin/feature-flags`.

> **Never** hardcode a secret in the repo. CI runs gitleaks; a committed key fails
> the security workflow.
