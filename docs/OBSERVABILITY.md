# SwingVantage — Observability, Analytics & Test Gates

_Companion to [AUTOMATION_OPPORTUNITY_AUDIT_2026-06.md](AUTOMATION_OPPORTUNITY_AUDIT_2026-06.md). Covers the foundation automations A1, A2, A3, A4, A10._

> **📘 In Plain English (start here).** This page is the "switch panel" for the
> safety + measurement foundation. The **code is already in place and safe** — it
> does nothing until you flip a switch, and it can't break the app while it's off.
> There are exactly four switches, each a single setting:
>
> 1. **See errors** → create a free Sentry project, paste one key (A2).
> 2. **Measure usage** → set one Plausible domain (A3).
> 3. **Catch outages** → point an uptime monitor at the site (A2).
> 4. **Fail loudly on bad config in production** → set `STRICT_ENV=1` in Vercel (A10).
>
> Until you do, SwingVantage runs exactly as before — just with the wiring ready.
> Meanwhile the **test gates (A1/A4) now run automatically** on every push, so a
> broken journey or unit test is caught before it reaches the site.

---

## 1. What shipped (and why it's safe)

| Item | What it is | Safe-by-default behaviour |
|---|---|---|
| **A4 — Jest in CI** | `.github/workflows/test.yml` runs all unit tests on every push/PR | Was never run in CI before; now gates merges |
| **A1 — Playwright in CI** | The same workflow runs the E2E journeys against a real build | Installs Playwright on the fly; `package.json` untouched |
| **A2 — Error reporting** | `lib/observability/report.ts` + `instrumentation.ts` + `instrumentation-client.ts` + `global-error.tsx` | No-op until a Sentry sink is configured; never throws |
| **A3 — Analytics** | `lib/analytics.ts` (already present) + privacy-by-default e2e guard | No third-party script loads until you set a provider |
| **A10 — Env validation** | `lib/config/env.ts`, called from `instrumentation.ts` | Warns only; throws *only* when `STRICT_ENV=1` |

Nothing here adds a runtime dependency. The Sentry SDK is **not** installed — the
reporter forwards to it only if you choose to add it (step 2 below).

---

## 2. Switch 1 — Turn on error monitoring (A2)

1. Create a project at [sentry.io](https://sentry.io) (free tier is fine) → choose **Next.js** → copy the **DSN**.
2. Install the SDK (one-time): `npm i @sentry/nextjs`.
3. Set env vars (Vercel → Project → Settings → Environment Variables, and `.env.local`):
   - `NEXT_PUBLIC_SENTRY_DSN` = your DSN (client)
   - `SENTRY_DSN` = your DSN (server)
4. Initialise it by adding these two small blocks (the reporter looks for the
   global capture function and `window.Sentry`):

   ```ts
   // src/instrumentation.ts — inside register(), after assertEnv():
   if (process.env.SENTRY_DSN && process.env.NEXT_RUNTIME === 'nodejs') {
     const Sentry = await import('@sentry/nextjs');
     Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
     (globalThis as { __svCaptureException?: unknown }).__svCaptureException =
       Sentry.captureException;
   }
   ```

   ```ts
   // src/instrumentation-client.ts — at the top, before the listeners:
   if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
     const Sentry = await import('@sentry/nextjs');
     Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 });
     (window as { Sentry?: unknown }).Sentry = Sentry;
   }
   ```

5. (Optional, recommended) wrap `next.config.mjs` with `withSentryConfig` for
   source-map upload, per Sentry's wizard. This is the only step that touches
   `next.config.mjs`, so do it when that file isn't mid-edit by another task.

**Verify:** throw a test error (e.g. visit a route that calls `reportError`) → it
appears in Sentry within a minute. The root `global-error.tsx` screen reports
automatically.

---

## 3. Switch 2 — Turn on usage measurement (A3)

The analytics abstraction (`lib/analytics.ts`) already supports three providers.
**Recommended: Plausible** — cookieless, no consent banner, fits the youth-safe
positioning.

- Plausible: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=swingvantage.com`
- or GA4: set `NEXT_PUBLIC_GA_ID=G-XXXXXXX`
- or PostHog (best for funnels): set `NEXT_PUBLIC_POSTHOG_KEY=phc_xxx`

**Verify:** after deploy, load the site and confirm events in the provider
dashboard. The `analytics-privacy.spec.ts` e2e test enforces that **nothing**
loads until one of these is set; `src/lib/__tests__/analytics.test.ts` enforces
that events route correctly once a provider is present.

---

## 4. Switch 3 — Catch outages (A2)

No code required. Point an external monitor at production:

- [UptimeRobot](https://uptimerobot.com) / [Better Uptime](https://betterstack.com) (free tiers), or Vercel's built-in monitoring.
- Monitor `https://swingvantage.com/`, `/api/capabilities`, and one key app route.
- Route alerts to your email.

---

## 5. Switch 4 — Fail loudly on bad production config (A10)

`lib/config/env.ts` validates the **format** of any variable that is set (a
typo'd URL, a non-numeric `AI_DAILY_BUDGET_CENTS`, an unknown AI provider) and
warns about half-configured integrations. By default it only **warns** so it can
never block local/keyless development.

To make a misconfigured **production** deploy fail at boot instead of erroring at
runtime, set `STRICT_ENV=1` in Vercel. With it on, a hard format error in a
required-shape variable stops the server from starting (loud, early, obvious).

---

## 6. The test gates (A1 / A4) — what runs now

`.github/workflows/test.yml`:
- **Unit (Jest):** every push/PR runs the full unit suite (1300+ tests).
- **E2E (Playwright):** builds the app and runs the journey specs in `apps/web/e2e`
  (home/SEO surface, keyless auth, CSV import→diagnosis, floating-help overlap,
  analytics privacy).

To make these **block merges**, enable branch protection on `master` and add
"Unit tests (Jest)" and "E2E journeys (Playwright)" to the required status checks
(GitHub → Settings → Branches). This is the final step that turns the safety net
into a true gate — see the audit's §4 and the master audit's F-11.

---

## 7. Where everything lives

```
apps/web/src/instrumentation.ts            # server boot: env check + onRequestError → reporter
apps/web/src/instrumentation-client.ts     # browser: global error/rejection → reporter
apps/web/src/lib/observability/report.ts   # provider-agnostic error sink (A2)
apps/web/src/lib/config/env.ts             # env format validation (A10)
apps/web/src/lib/analytics.ts              # provider-agnostic event sink (A3, pre-existing)
apps/web/src/app/global-error.tsx          # on-brand root error screen + auto-report
apps/web/e2e/analytics-privacy.spec.ts     # privacy-by-default guard (A3)
.github/workflows/test.yml                 # Jest + Playwright CI gates (A1/A4)
```
