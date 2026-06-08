# Analytics OS (PostHog control center)

One place in the admin to manage **everything PostHog does** — product & web
analytics, session replay, funnels, retention, feature flags, A/B experiments,
surveys, cohorts and SQL. Lives at **`/admin/analytics`** ("Analytics OS" in the
sidebar). Powered by PostHog; honest and local-first like the other OS modules.

## The two keys (this is the whole mental model)

| Key | Looks like | Public? | What it does | Where |
| --- | --- | --- | --- | --- |
| **Project API key** | `phc_…` | Public (safe in the browser) | Lets the site **send** events to PostHog | `NEXT_PUBLIC_POSTHOG_KEY` |
| **Personal API key** | `phx_…` | **Secret** (server-only) | Lets the OS **read** data back + manage flags | `POSTHOG_PERSONAL_API_KEY` |

You already have the first one. The second is optional — add it to turn on live
numbers and flag management *inside* the dashboard.

## Connection levels

The OS is honest about exactly how much is wired (shown as a ribbon at the top):

- **none** — no project key. Add `NEXT_PUBLIC_POSTHOG_KEY`.
- **ingest** *(current)* — events flow to PostHog ✓. Read-only panels show a
  "add a personal API key" prompt; deep links into PostHog still work.
- **full** — read + manage live, right inside the OS.

## Turn on live data (optional)

1. PostHog → **Settings → Personal API keys → Create personal API key**. Give it
   read access (add **Feature flag write** if you want to toggle flags from the OS).
2. PostHog → **Settings → Project** → copy the **Project ID** (a number).
3. Add both as **server-side** env vars (no `NEXT_PUBLIC_` prefix), then redeploy:

   ```
   POSTHOG_PERSONAL_API_KEY=phx_your-personal-key
   POSTHOG_PROJECT_ID=12345
   ```

   - Local: `apps/web/.env.local`
   - Production: **Vercel → Settings → Environment Variables**

   Region defaults to US. If your PostHog is the EU cloud, also set
   `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`.

## The tabs

- **Overview** — coverage map of all PostHog capabilities, each tagged *Live in
  OS* / *Manage here* / *Open in PostHog* / *Needs API key*, with deep links.
- **Web Analytics** — pageviews, visitors, sessions, by-day sparkline, top pages
  & referrers (last 7/30/90 days).
- **Product** — top events (live) + the instrumented event catalog + key funnels.
- **Feature Flags** — list and **toggle your real PostHog flags** (writes to
  PostHog for everyone — distinct from the device-local operator flags under
  *Feature Flags*).
- **Explore** — surveys/experiments/cohorts/dashboards counts + a read-only
  **HogQL SQL explorer**.
- **Connect** — live two-key connection test + the setup steps above.

## Verify it's working

- **Connect tab → "Test now"** runs a live check of both keys.
- Or open the public site, click around, then in PostHog go to
  **Activity → Live events** — your events appear within seconds.

## How it's built (for maintainers)

- `apps/web/src/lib/posthog/` — engine (all server-safe, key never reaches the client):
  - `config.ts` — env → sanitized connection (none/ingest/full), region/host derivation.
  - `capabilities.ts` — single-source map of the PostHog surface (add a capability = one entry).
  - `client.ts` — **server-only** defensive API client (decide test, project test, HogQL, flag list/toggle, counts). Never throws.
  - `queries.ts` — tested HogQL builders + shapers + a read-only guard.
  - `dashboard.ts` — synchronous static assembly (no network) so the page always loads.
- `apps/web/src/app/api/admin/analytics-os/route.ts` — admin + RBAC gated; GET live snapshot, POST `test` / `query` / `toggle-flag`.
- `apps/web/src/app/admin/analytics/` — the page + `AnalyticsOsDashboard` client shell.
- Tests: `apps/web/src/lib/posthog/__tests__/posthog.test.ts`.
