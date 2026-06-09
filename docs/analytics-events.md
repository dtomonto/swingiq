# SwingVantage — Analytics Events

This document is the single reference for every analytics event SwingVantage tracks.

## 📘 In Plain English (start here)

**What this page is:** The master list of the anonymous "things that happened" SwingVantage can count — for example, *a video upload started* or *a sport was selected*. This is how you'd learn which features people actually use.

**What you actually need to know:**
- **Tracking is OFF and private by default.** Until you add a Google Analytics ID, no outside analytics company receives anything — events just print to the developer console and disappear.
- Nothing recorded here is personal or identifying — it's counts and categories (which sport, which page), not names or emails.
- Your only optional step is connecting Google Analytics, which turns these counts into charts you can read.

**What to do next (optional):** If you want real numbers, pick ONE provider and paste a single line into `apps/web/.env.local` — see "Turning analytics on (owner steps)" at the bottom. The easiest, most private choice is **Plausible**: it's cookieless, so it needs no cookie-consent banner and fits our youth-safe positioning. If you'd rather stay fully private, do nothing.

**Good to know:** the whole core journey now reports itself — uploading a swing, running the analysis, seeing your #1 fix, and creating an account all count automatically. So the moment you connect a provider, you'll be able to see your most important number: how many people complete a full improvement loop (not just how many visit).

> The big event table and "Adding a new event" steps below are a reference for a developer or an AI assistant. You don't need them to use SwingVantage.

- **Event registry (source of truth):** `packages/core/src/analytics/events.ts`
- **Tracking abstraction:** `apps/web/src/lib/analytics.ts` (`track(event, properties)`)
- **Provider loader:** `apps/web/src/components/analytics/Analytics.tsx`

## How tracking works

`track()` resolves a provider at runtime with graceful fallback:

1. **GA4** — active when `NEXT_PUBLIC_GA_ID` is set and `gtag` has loaded.
2. **Plausible** — used if `window.plausible` exists.
3. **PostHog** — used if `window.posthog` exists.
4. **Console** — development fallback so events are always visible during local work.

If no provider is configured, events are logged in development and dropped in production. Nothing throws.

## Event catalogue

> **Core funnel is wired end-to-end** (as of 2026-06-07). Upload → analysis →
> #1 fix → account all emit from shared code (`VideoUpload`, `useSwingAnalysis`,
> `AIVisualAnalysisPanel`, `SignupForm`), so a configured provider measures the
> real improvement loop — not just peripheral tools/quizzes.

| Event | Trigger | Suggested properties | Funnel stage | KPI supported |
|---|---|---|---|---|
| `page_view` | Any public page load | `path` | Awareness | Qualified organic traffic |
| `sport_selected` | User picks a sport | `sport` | Activation | Completed analyses |
| `video_upload_started` | A valid file begins processing (shared `VideoUpload`) | `sport`, `source` | Activation | Completed analyses |
| `video_upload_completed` | Metadata read; video handed to the analyzer | `sport`, `source`, `duration_seconds` | Activation | Completed analyses |
| `video_upload_failed` | Upload validation/read error | `sport`, `source`, `reason` | Activation | Upload confidence |
| `analysis_started` | `useSwingAnalysis.start()` is called | `sport`, `speed`, `compared` | Activation | Completed analyses |
| `analysis_completed` | Analysis task reaches terminal success | `sport`, `configured` | Activation | Completed analyses |
| `analysis_failed` | Analysis task errors | `sport`, `reason` | Activation | Trust |
| `priority_fix_viewed` | The #1 fix result panel renders (the value moment) | `sport`, `confidence`, `overall_confidence`, `priority_count` | Activation | Completed analyses |
| `retest_completed` | A completed retest result is surfaced — the loop closes | `sport`, `outcome`, `same_conditions` | Retention | **Weekly Completed Improvement Loops** (north star) |
| `sample_report_viewed` | Sample report preview shown/opened | `source` | Consideration | Upload confidence |
| `quiz_started` | A growth-tool quiz begins | `tool`, `sport` | Consideration | Completed analyses |
| `quiz_completed` | A quiz produces a result | `tool`, `sport` | Consideration | Email capture |
| `tool_result_generated` | Any free tool outputs a result | `tool`, `sport` | Consideration | Returning users |
| `email_capture_viewed` | Email capture form rendered | `source` | Capture | Email capture |
| `email_capture_submitted` | Email submitted successfully | `source`, `lead_source` | Capture | Email capture |
| `report_copied` | Report summary copied | `sport` | Advocacy | Share/referral |
| `report_shared` | Report shared | `sport`, `method` | Advocacy | Share/referral |
| `coach_share_clicked` | "Send to coach" clicked | `sport` | Advocacy | Coach adoption |
| `pdf_downloaded` | Report PDF/print exported | `sport` | Advocacy | Returning users |
| `cta_clicked` | A primary/secondary CTA clicked | `label`, `location` | All | Conversion |
| `conversion_cta_clicked` | Legacy conversion CTA (kept for continuity) | `label` | All | Conversion |
| `outbound_partner_clicked` | Outbound partner/affiliate link clicked | `partner` | Advocacy | Partner adoption |
| `privacy_page_viewed` | Privacy/trust page viewed | `page` | Trust | Upload confidence |
| `parent_safety_viewed` | Parent/youth safety content viewed | `page` | Trust | Coach/parent adoption |
| `pricing_viewed` | Pricing page viewed | — | Consideration | Conversion |
| `account_created` | Signup succeeds (`SignupForm`) | `mode`, `needs_confirmation` | Capture | Registered users |

> Additional existing events (`profile_started`, `profile_completed`, `camera_angle_selected`, `drill_clicked`, `practice_plan_saved`, `professional_reference_*`, `swing_comparison_started`, `image_table_*`, `imported_data_confirmed`, `data_export_requested`, `data_delete_requested`) remain defined in the registry and are documented inline there.

## Adding a new event

1. Add the key to `ANALYTICS_EVENTS` in `packages/core/src/analytics/events.ts`.
2. Call it from the web app: `track(ANALYTICS_EVENTS.MY_EVENT, { ... })`.
3. Add a row to the table above with trigger, properties, funnel stage, and KPI.

## Turning analytics on (owner steps)

Pick **one** provider and paste a single line into `apps/web/.env.local` (create
the file if it doesn't exist), then redeploy. Leave them all unset to stay fully
private — events only print to the developer console and disappear.

### Option A — Plausible (recommended: cookieless, no consent banner)

1. Create a Plausible account and add your site (`swingvantage.com`).
2. Add this line to `apps/web/.env.local`:
   `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=swingvantage.com`
3. Save and redeploy. Page views and every event above start flowing — no
   cookie-consent banner required, which keeps the youth-safe positioning clean.

### Option B — Google Analytics 4 (most familiar; sets cookies)

1. Create a GA4 property and copy its Measurement ID (looks like `G-XXXXXXXXXX`).
2. Add to `apps/web/.env.local`:
   `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
3. Save and redeploy. Pair with a cookie-consent banner if you have EU visitors.

### Option C — PostHog (product analytics: funnels, retention)

1. Create a PostHog project and copy its Project API Key (`phc_…`).
2. Add to `apps/web/.env.local`:
   `NEXT_PUBLIC_POSTHOG_KEY=phc_your-key-here`
3. Save and redeploy. Best if you want to build the improvement-loop funnel chart
   directly from the events above.

### Option D — Microsoft Clarity (heatmaps + session replay; sets cookies)

1. Create a project at `clarity.microsoft.com` and copy the Project ID
   (Settings → Overview).
2. Add to `apps/web/.env.local`:
   `NEXT_PUBLIC_CLARITY_PROJECT_ID=your-project-id`
3. Save and redeploy. Clarity **records sessions and sets cookies**, so the app is
   no longer cookieless once this is on — pair with a cookie-consent banner in the
   EU. Optionally add `CLARITY_DATA_EXPORT_TOKEN` (server-side) to read Clarity
   metrics inside `/admin/clarity`.

> You can set more than one — each is independent. After deploying, confirm it
> works by uploading a test swing and watching the events arrive in the
> provider's live view. The admin **Setup** page also shows Analytics as
> "configured" once any of these keys is present.
