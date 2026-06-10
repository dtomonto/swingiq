# ConnectorOS — Event Taxonomy

**Single source of truth:** `packages/core/src/analytics/events.ts` (`ANALYTICS_EVENTS`).
All events flow through one canonical `track(event, props)` in `apps/web/src/lib/analytics.ts`,
which fans out to PostHog (product truth) / GA4 (acquisition truth) / Clarity (opt-in)
— **consent-gated**. Do **not** add a second tracker or a parallel event registry.

## Privacy contract (enforced for every event)

Event properties may include: `sport`, `source_page`/`page`, `funnel_step`/`journey_stage`,
`theme`, `device_type`, `analysis_mode`, `report_type`, `error_code`, `content_type`,
`page_slug`, `persona`, anonymized counts/bands.

Properties may **never** include: raw video URLs, user names, emails, private swing
notes, exact child age, IP addresses, or raw uploaded-media metadata. PostHog session
replay masks inputs; Clarity is opt-in only.

## Requested brief events → existing canonical event

The brief's requested events already exist (use these names — do not re-create):

| Brief event | Canonical (`ANALYTICS_EVENTS`) |
| --- | --- |
| `sport_selected` | `SPORT_SELECTED` |
| `swing_upload_started` | `VIDEO_UPLOAD_STARTED` |
| `swing_upload_completed` | `VIDEO_UPLOAD_COMPLETED` |
| `analysis_started/completed/failed` | `ANALYSIS_STARTED` / `ANALYSIS_COMPLETED` / `ANALYSIS_FAILED` |
| `report_viewed` | `SAMPLE_ANALYSIS_VIEWED` / `PRIORITY_FIX_VIEWED` |
| `sample_report_viewed` | `SAMPLE_REPORT_VIEWED` |
| `drill_opened` | `DRILL_CLICKED` / `DRILL_STARTED` |
| `practice_plan_saved` | `PRACTICE_PLAN_SAVED` |
| `retest_scheduled` | `RETEST_PLAN_CLICKED` (intent) → `RETEST_COMPLETED` (loop close) |
| `account_created` | `ACCOUNT_CREATED` |
| `data_exported` / `data_deleted` | `DATA_EXPORT_REQUESTED` / `DATA_DELETE_REQUESTED` |
| `privacy_page_viewed` | `PRIVACY_PAGE_VIEWED` |
| `trust_page_viewed` | `PARENT_SAFETY_VIEWED` |
| `affiliate_click` | `OUTBOUND_PARTNER_CLICKED` |

## Genuine gaps (recommend ADDING to the core registry)

Add these to `packages/core/src/analytics/events.ts` when the surfaces exist —
keep them in the *one* registry, never a fork:

| Proposed | Trigger | Properties | Business question | Privacy risk |
| --- | --- | --- | --- | --- |
| `theme_changed` | user switches theme | `theme`, `source_page` | which themes/sports get used | none |
| `seo_content_page_viewed` | SEO/glossary/fix page view | `page_slug`, `content_type`, `sport` | which content earns traffic | none |
| `admin_dashboard_viewed` | admin opens a dashboard | `section` | internal usage (admin-only) | none |
| `ad_impression_eligible` | an ad slot is eligible to render | `placement`, `surface` | ad inventory readiness | none |

> When adding: also extend any exhaustive switch/test over `ANALYTICS_EVENTS`.
> `CENTRAL_INTELLIGENCE_VIEWED` already exists for the admin-viewed pattern; reuse
> where it fits before adding `admin_dashboard_viewed`.

## Owner

Growth instrumentation lead. Changes to the registry go through PR review (typed,
exhaustive, consent-respecting). Audit live event volume in **Admin → Analytics OS**.
