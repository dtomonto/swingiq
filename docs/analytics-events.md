# SwingVantage — Analytics Events

This document is the single reference for every analytics event SwingVantage tracks.

## 📘 In Plain English (start here)

**What this page is:** The master list of the anonymous "things that happened" SwingVantage can count — for example, *a video upload started* or *a sport was selected*. This is how you'd learn which features people actually use.

**What you actually need to know:**
- **Tracking is OFF and private by default.** Until you add a Google Analytics ID, no outside analytics company receives anything — events just print to the developer console and disappear.
- Nothing recorded here is personal or identifying — it's counts and categories (which sport, which page), not names or emails.
- Your only optional step is connecting Google Analytics, which turns these counts into charts you can read.

**What to do next (optional):** If you want visitor numbers, follow "Configuring GA4 (owner steps)" at the bottom of this page — it's the same one-line setting referenced in the other growth docs. If you'd rather stay fully private, do nothing.

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

| Event | Trigger | Suggested properties | Funnel stage | KPI supported |
|---|---|---|---|---|
| `page_view` | Any public page load | `path` | Awareness | Qualified organic traffic |
| `sport_selected` | User picks a sport | `sport` | Activation | Completed analyses |
| `video_upload_started` | Upload begins | `sport` | Activation | Completed analyses |
| `video_upload_completed` | Upload finishes | `sport` | Activation | Completed analyses |
| `video_upload_failed` | Upload errors | `sport`, `reason` | Activation | Upload confidence |
| `analysis_started` | Diagnosis begins | `sport` | Activation | Completed analyses |
| `analysis_completed` | Diagnosis returns a result | `sport`, `top_issue` | Activation | Completed analyses |
| `analysis_failed` | Diagnosis errors | `sport`, `reason` | Activation | Trust |
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

> Additional existing events (`profile_started`, `profile_completed`, `camera_angle_selected`, `priority_fix_viewed`, `drill_clicked`, `practice_plan_saved`, `professional_reference_*`, `swing_comparison_started`, `image_table_*`, `imported_data_confirmed`, `account_created`, `data_export_requested`, `data_delete_requested`) remain defined in the registry and are documented inline there.

## Adding a new event

1. Add the key to `ANALYTICS_EVENTS` in `packages/core/src/analytics/events.ts`.
2. Call it from the web app: `track(ANALYTICS_EVENTS.MY_EVENT, { ... })`.
3. Add a row to the table above with trigger, properties, funnel stage, and KPI.

## Configuring GA4 (owner steps)

1. Create a Google Analytics 4 property and copy its Measurement ID (looks like `G-XXXXXXXXXX`).
2. Open `apps/web/.env.local` (create it if it does not exist).
3. Add this line, replacing the value with your ID:
   `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
4. Save, then restart the dev server (or redeploy). Events will start flowing to GA4.

If you leave `NEXT_PUBLIC_GA_ID` unset, the site stays analytics-free and private — events only print to the developer console.
