# GrowthOS — Internal Marketing Operating System

## In Plain English (start here)

**GrowthOS is a private "command center" for all of SwingIQ's marketing**, built into the app at
`/admin/growth`. It's only visible to you (the admin) — never to regular users, and it's hidden from Google.

Think of it as a digital marketing department in software. It has **28 connected sections** covering
strategy, channels, campaigns, SEO, content, social, email, lifecycle, paid ads, experiments, conversion
optimization, brand, analytics, an AI strategist, and more. Open it, click around the left sidebar, and
you'll find planning tools, checklists, and an AI assistant that drafts marketing copy for you.

Three promises it keeps so you can trust it:

1. **It's honest about data.** Every number is labeled with where it came from — `Real`, `Imported`,
   `Estimated`, `Placeholder`, or `Demo data`. It will **never** show a made-up number as if it were real.
   Right now most performance numbers are placeholders because no analytics tool is connected yet.
2. **The AI only drafts — it never acts.** AI output is always a labeled draft for you to review. GrowthOS
   never sends an email, spends money, posts content, or changes pricing on its own.
3. **Records persist and you can edit them.** Every list (campaigns, channels, experiments, …) has a **New**
   button, and each row opens a panel with **Edit** and **Delete**. When your database (Supabase) is connected,
   changes are saved for good; without it, GrowthOS still works on realistic demo data so every screen is useful.

**To turn on saving (persistence):** run [`server/supabase_schema_growthos.sql`](../server/supabase_schema_growthos.sql)
once in your Supabase SQL editor (same as the other setup files). That's it — GrowthOS already uses your existing
Supabase keys. Optionally POST to `/api/growth/seed` to load the starter demo data into the database.

**To make the KPIs real:** connect an analytics provider (set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or
`NEXT_PUBLIC_GA_ID`). That turns the placeholder funnel numbers into live data.

---

## What was built

A modular, production-grade marketing operating system under two new namespaces (no existing files were
modified):

- `apps/web/src/lib/growth/**` — the "spine": types, data layer, AI layer, utilities.
- `apps/web/src/app/admin/growth/**` — the 28 module routes + UI, under the existing `ADMIN_SECRET` guard.

### Architecture highlights

- **One type system** (`lib/growth/types.ts`) defines all 32 data models. Everything builds on it.
- **Supabase-backed repository** (`lib/growth/repository.ts`) — an async `Repository<T>` that persists records
  in a single `growth_records` JSONB table when Supabase is configured, and degrades to a process-global
  in-memory store (seeded from `mock-data.ts`) when it isn't. Same pattern as `lib/billing/entitlements.ts`.
- **Full CRUD** — admin-guarded `/api/growth/records` (create / update / delete) + a generic config-driven
  form (`_components/RecordForm.tsx`) wired into every record module's New / Edit / Delete actions. A
  one-click seed route (`/api/growth/seed`) loads starter data into the DB.
- **Config-driven module engine** — most modules render from a small declarative definition
  (`_components/definitions.ts`) via one generic component (`_components/RecordModule.tsx`): KPI row, filter
  tabs, search, sortable table, a detail slide-over, and inline create/edit. Adding a column or KPI is a one-line change.
- **AI layer** — a server-only provider abstraction (`lib/growth/ai/provider.ts`, mirrors the existing
  `/api/ai-coach` pattern: OpenAI / Anthropic / Google + a safe development fallback) plus a strategist task
  catalog with claim-safe prompts and prompt-injection sanitization.
- **Consent-aware analytics** (`lib/growth/analytics.ts`) — events are dropped unless consent is granted, and
  PII keys are stripped from metadata. **UTM builder** (`lib/growth/utm.ts`) is pure + tested-by-design.
- **Honesty + safety primitives** baked into shared UI: `DataSourceBadge`, draft-first labels, `MockDataNote`.

### The 28 modules

Executive Overview · Strategy Hub · Campaigns · Channel Portfolio · Marketing Calendar · Paid Media ·
SEO/AEO/GEO · Content Studio · Organic Social · Email/CRM · Lifecycle Journeys · Creators/Affiliates ·
Referral Engine · Community Growth · Digital PR · Reputation · CRO Lab · Experiments · Offers/Monetization ·
Analytics (KPI dictionary + UTM builder) · Attribution · Market Intelligence · Brand Voice · Asset Library ·
Privacy/Consent · AI Strategist · Recommendations · Operations.

---

## Files created

### Library / spine (`apps/web/src/lib/growth/`)
`types.ts`, `scoring.ts`, `format.ts`, `labels.ts`, `nav.ts`, `analytics.ts`, `utm.ts`, `mock-data.ts`,
`repository.ts`, `ai/provider.ts`, `ai/strategist.ts`, `ai/agents.ts`.

### Routes + UI (`apps/web/src/app/admin/growth/`)
`layout.tsx`, `page.tsx` (Executive Overview), and one folder per module
(`strategy`, `campaigns`, `channels`, `paid-media`, `seo`, `content`, `social`, `crm`, `lifecycle`,
`creators`, `referral`, `community`, `pr`, `reputation`, `cro`, `experiments`, `offers`, `analytics`,
`attribution`, `market-intel`, `brand`, `assets`, `calendar`, `privacy`, `ai-strategist`,
`recommendations`, `operations`).

Shared components in `_components/`: `GrowthShell.tsx`, `ui.tsx`, `RecordModule.tsx`, `RecordModulePage.tsx`,
`definitions.ts`, plus bespoke clients (`AiStrategistContent.tsx`, `analytics/UtmBuilder.tsx`,
`calendar/CalendarView.tsx`).

### API
- `apps/web/src/app/api/growth/ai/route.ts` — AI Strategist generation (rate-limited, key stays server-side).
- `apps/web/src/app/api/growth/records/route.ts` — admin-guarded CRUD (POST/PATCH/DELETE) for all record kinds.
- `apps/web/src/app/api/growth/seed/route.ts` — admin-guarded one-time seed loader.

### Database
`server/supabase_schema_growthos.sql` — the `growth_records` table + indexes + RLS (run once in Supabase).

---

## Environment variables

GrowthOS introduces **no new environment variables** — it reuses what the app already supports:

| Purpose | Variable(s) | Effect when missing |
| --- | --- | --- |
| Admin access | `ADMIN_SECRET` | In dev, `/admin/*` is open for local work; in prod, access is blocked without it. |
| AI Strategist | `AI_PROVIDER` + `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` | Falls back to structured draft templates (clearly labeled). |
| Live analytics | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_POSTHOG_KEY` | KPIs stay labeled as placeholders. |

---

## Assumptions made

- This is the **first build**: useful immediately on mock-safe demo data, architected for real integrations
  later. CRUD repositories exist and work in-process; durable persistence arrives with a DB adapter.
- The existing dark "admin" visual language was adopted (the app's 7-theme token system is for the
  user-facing app; `/admin` already uses its own dark palette).
- GrowthOS reuses the existing `/admin` `ADMIN_SECRET` guard rather than inventing a new auth model.

## Security & privacy limitations

- **Persistence:** durable when Supabase is configured (run `server/supabase_schema_growthos.sql` once). The
  keyless fallback store is process-global — consistent within one running server, but not across separate
  serverless instances. Connect Supabase for true cross-instance persistence (already wired).
- **Auth:** GrowthOS is admin-only via `ADMIN_SECRET`. Long-term, replace with a Supabase role check
  (the admin layout already notes this).
- **No consent banner yet:** until one ships, analytics consent defaults to "unknown", so the consent-aware
  `track()` helper **drops** events rather than tracking without permission. See the Privacy module's risk
  register for the live governance checklist.
- **AI safety:** provider keys are server-only; user/competitor input is sanitized; output is draft-first and
  claim-safe (no fabricated metrics, testimonials, or unsupported claims).

## Recommended future integrations

Analytics (GA4, Plausible, PostHog, Segment, Mixpanel, Amplitude) · Search (Search Console, Ahrefs, Semrush) ·
Paid (Google/Meta/TikTok/LinkedIn Ads) · CRM/messaging (Resend, Customer.io, Klaviyo, Twilio, OneSignal) ·
Payments (Stripe — partially present) · Data (Supabase/Postgres) · AI (Anthropic/OpenAI/Gemini — present).

## Manual testing checklist

1. Visit `/admin/growth` (dev: open; prod: send the `x-admin-secret` header).
2. Click through the sidebar — all 28 sections load; the "Jump to…" filter narrows them.
3. Open any record module (e.g. Campaigns) → search, filter tabs, click a row for the detail panel, and use
   **New / Edit / Delete** (creates persist to Supabase when configured, else the process-global store).
4. AI Strategist → pick a task, fill context, **Generate draft** → returns a labeled draft (real copy if an
   AI key is set, template otherwise) with a Copy button.
5. Analytics → the UTM builder updates the generated URL live; presets fill source/medium.
6. Calendar → month grid renders demo items; toggle to list view; switch months.
7. Privacy → consent records, pixel inventory, and the governance risk register render.
8. Confirm every screen shows honest data-source labels and no number is presented as real production data.

## Suggested next development phase

Persistence + CRUD are done. Remaining steps to fully operationalize:

1. **Run the schema** → `server/supabase_schema_growthos.sql` in Supabase, then POST `/api/growth/seed` to load
   starter data. (One-time, ~1 minute.)
2. **Connect analytics** (Plausible/GA4) → turn placeholder KPIs real; wire the analytics event utility into
   key app actions (signup, upload, payment).
3. **Ship a consent banner** → flip analytics consent to a real choice; clear the two "needs attention" items
   in the Privacy risk register.
4. **Wire one lifecycle email** (the drafted abandoned-first-upload flow) end-to-end through a provider, with
   sending behind an explicit human toggle.
