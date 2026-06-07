# SwingVantage Admin Dashboard

## In Plain English (start here)

This is the **control center for running SwingVantage** — one place to see what's
happening, manage content, review AI output, configure each sport, watch system
health, and keep the platform safe. Think of it like the WordPress/Shopify admin,
but built for an AI sports-analysis product.

A few things that make this admin different from a typical SaaS admin, and that you
should understand up front:

- **SwingVantage is privacy-first and local-first.** Each user's data lives in
  *their own* account, and **swing videos are processed on the device and never
  uploaded**. So the admin can show *metadata* about analyses (sport, score, when),
  but it cannot show the actual video files — because they don't exist on our servers.
- **Cross-user numbers need one key.** To count users/sessions/analyses across
  everyone, the dashboard uses a special server-side key
  (`SUPABASE_SERVICE_ROLE_KEY`). If that isn't set, you'll see **honest "Local mode"
  prompts instead of fake numbers**. Nothing in this dashboard ever invents data.
- **Everything is keyless-first.** Ads, billing, AI, email all work in a safe
  fallback mode with no keys, and "upgrade" when you add a key. The
  [Integrations](#integrations) page shows exactly what's connected.

If you're brand new, open **Admin → Command Center**, read the alert cards, then use
the sidebar. The **Admin Academy** (`/admin/learning`) has guided walkthroughs.

---

## How to access the admin

The whole `/admin/*` area is protected by `app/admin/layout.tsx`. You get in one of
two ways:

1. **Allowlisted email (recommended).** Log in normally; if your email is listed in
   the `ADMIN_EMAILS` environment variable, you're an admin.
2. **Secret header.** Requests carrying `x-admin-secret` matching the `ADMIN_SECRET`
   env var are admins (used by trusted proxies/tooling).

In local development with neither set, the admin is open so you can build. In
production, with neither set, **nobody** gets in (secure by default). Non-admins are
redirected to `/dashboard` and never told the route exists.

## Roles & permissions

Anyone who clears the guard is a **Super Admin** by default. You can narrow this with
finer roles (Content Manager, SEO Manager, Support Agent, AI Review Specialist,
Sports Content Editor, Monetization Manager, Analyst, Read-Only Viewer).

- **Server-authoritative roles** come from the `ADMIN_ROLES` env var, formatted
  `email:role,email:role` (e.g. `alice@x.com:content_manager`). This is what the
  server actually enforces.
- The **Security** page also offers a convenience overlay for managing this in the
  UI, but the server never trusts the client overlay to *grant* access — least
  privilege only ever *removes* capability from the Super Admin default.

Roles and the permissions each one grants are defined in
[`lib/admin/rbac.ts`](../apps/web/src/lib/admin/rbac.ts). Permission gating shows up
in three places: which sidebar sections appear, which actions render, and a
server-side re-check on every mutating API call.

## Audit log

Every meaningful admin change is recorded — who did it, what changed, before/after,
and when. Wave 1 records to a local-first store
([`lib/admin/stores/audit-log.ts`](../apps/web/src/lib/admin/stores/audit-log.ts));
an optional Supabase mirror can be added later. The Command Center shows recent
activity; the full **Audit Log** page (later wave) is the searchable history.

---

## Sections

The sidebar is generated from a single source of truth
([`lib/admin/nav.ts`](../apps/web/src/lib/admin/nav.ts)). Sections marked **"Soon"**
are planned and ship wave-by-wave; they render disabled rather than 404.

| Section | What it does | Status |
| --- | --- | --- |
| **Command Center** (`/admin`) | Executive overview, smart alerts, recent activity | ✅ Live |
| **System Health** (`/admin/system-health`) | Plain-English status of every service | ✅ Live |
| **Integrations** (`/admin/integrations`) | What's connected; safe configuration (no secrets shown) | ✅ Live |
| **Users / Athletes** | Accounts and per-sport athlete profiles | 🔜 |
| **Uploads & AI Analyses** | Swing media metadata + AI output review queues | 🔜 |
| **Content / SEO / Sports** | CMS, SEO/AEO/GEO, per-sport config | 🔜 |
| **Generated Fixes** | Review queue for AI-generated fix pages (no auto-publish) | 🔜 |
| **Monetization / Analytics** | Ads & revenue surfaces, funnels & reports | 🔜 |
| **Support / Feedback / Notifications** | Tickets, feedback→roadmap, alert center | 🔜 |
| **Feature Flags / Audit Log** | Toggle features by segment; full change history | 🔜 |
| **Security / Legal / Settings** | Roles, compliance, site configuration | 🔜 |
| **Admin Academy** (`/admin/learning`) | Onboarding & playbooks for new operators | 🔜 |

Pre-existing tools (GrowthOS, AdsOS, Video Studio, Social, Insights, Re-engage, Staff
Academy) are linked from the sidebar and the Command Center; they keep their own URLs.

---

## Security best practices

- The layout guard is the front door; **every admin API/server action re-checks
  admin + permission server-side** via
  [`requireAdmin()`](../apps/web/src/lib/admin/context.ts). Never rely on the UI alone.
- The **service-role** Supabase client bypasses row-level security, so it's only ever
  used in server code that has already authorized the caller.
- **Secrets are never returned to the browser** — integration pages show only whether
  a key is present, not its value.
- **Dangerous actions** (delete user/media, publish AI content, toggle a core flag,
  edit legal pages, bulk operations) require a confirmation dialog and write an audit
  entry.

## Troubleshooting

- **"Local mode" / blank counts on the Command Center** → set
  `SUPABASE_SERVICE_ROLE_KEY` (plus the public Supabase keys) and press *Re-check* on
  Integrations.
- **A section says "Soon"** → it's planned for a later wave; it isn't broken.
- **Redirected to `/dashboard` when opening `/admin`** → your email isn't in
  `ADMIN_EMAILS` (or you're not logged in). Add it and re-login.
- **An integration shows "Off" but you set the key** → the app reads env at
  build/restart; redeploy or restart the dev server, then *Re-check*.

---

## For developers

- **Nav model:** `apps/web/src/lib/admin/nav.ts` — add a section in one place.
- **RBAC:** `apps/web/src/lib/admin/rbac.ts` + `context.ts` (server guard).
- **Component kit:** `apps/web/src/components/admin/*` — `PageHeader`, `SectionCard`,
  `DataTable`, `MetricStat`, `AlertCard`, `StatusBadge`, `HelpPanel`, `ConfirmDialog`,
  `NotConnected`, `ErrorState`.
- **Server data adapters:** `apps/web/src/lib/admin/data/*` — the only place that
  reads cross-user data (service role). Each query is independently guarded so one
  failure never blanks a page.
- **Local-first admin stores:** `apps/web/src/lib/admin/stores/*` — standalone
  `localStorage` keys (`swingvantage-admin-*`), separate from the cloud-synced athlete
  store.
- Each admin page should use `PageHeader` (plain-English intro), a `HelpPanel`, and
  honest empty/`NotConnected` states.
