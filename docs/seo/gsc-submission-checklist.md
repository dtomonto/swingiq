# Google Search Console — Submission Checklist (owner)

A manual, repeatable runbook for getting SwingVantage indexed cleanly. Claude
Code **cannot** sign in to Google Search Console (GSC) or submit URLs for you —
these steps are yours to perform in the GSC web UI.

Property: `https://swingvantage.com` · Sitemap: `https://swingvantage.com/sitemap.xml`

---

## 0. One-time setup

1. Verify the **domain property** `swingvantage.com` in GSC (DNS TXT record is
   the most robust — covers http/https and all subdomains).
2. Confirm the live sitemap is healthy before submitting:
   - Open `https://swingvantage.com/sitemap.xml` → must return **HTTP 200** and
     valid XML (no parser error in the browser).
   - Spot-check a few `<loc>` values — all should be `https://swingvantage.com/…`,
     clean (no `?`), and load without redirecting.

## 1. Submit the sitemap

1. GSC → **Indexing → Sitemaps**.
2. Enter `sitemap.xml` and **Submit**.
3. Wait for status **Success** and a non-zero "Discovered URLs". If you see
   "Couldn't fetch", re-check the URL returns 200 and is not blocked by robots.

## 2. Inspect + request indexing for the first 20 priority URLs

Work the list in [`priority-submit-urls.md`](priority-submit-urls.md) **in order**.
For each URL:

1. Paste it into the **URL Inspection** bar (top of GSC).
2. Read **Coverage**:
   - "URL is on Google" → done, move on.
   - "URL is not on Google" → click **Request Indexing**.
3. Click **View crawled page → More info** and confirm:
   - **Google-selected canonical** == **User-declared canonical** (both should be
     the clean `https://swingvantage.com/…`). A mismatch means Google chose a
     different canonical — note it for the weekly review.
   - **Indexing allowed? Yes**, **Page fetch: Successful**.

> Request Indexing is rate-limited (a handful per day). Do the 20 over 2–3 days;
> don't spam. Submitting the sitemap already queues everything for discovery —
> manual requests just prioritize the most important pages.

## 3. Confirm canonicals at scale

GSC → **Indexing → Pages**. After a few days, watch for:
- **"Duplicate, Google chose different canonical than user"** — investigate; usually
  a near-duplicate (see [`duplicate-cannibalization-report.md`](duplicate-cannibalization-report.md)).
- **"Alternate page with proper canonical tag"** — expected for `?utm=…` variants
  and intentional alternates; no action.

## 4. Tiered rollout — do NOT submit everything at once

Submit in tiers (full rationale in [`tiered-indexation-strategy.md`](tiered-indexation-strategy.md)):

- **Tier 1 / first 20** — submit now (this checklist).
- **Tier 2** (supporting guides, strong blog posts, drill pages) — submit **only
  after** internal linking to them is in place (hub → guide, guide → guide).
- **Tier 3** (long-tail / emerging / thin pages) — submit **only after** content
  depth and uniqueness are improved.
- **Never** submit: login/signup, settings, dashboards, `/admin`, `/api`,
  tutorial/video app pages, parameterized/search/filter URLs, or any redirecting
  or duplicate URL. These are blocked in `robots.txt` and absent from the sitemap
  by design.

## 5. Monitor (weekly)

Run [`weekly-gsc-monitoring.md`](weekly-gsc-monitoring.md) every week. At minimum:
sitemap status, Pages report (indexed vs. not), and the Performance report
(impressions / CTR / average position).

---

## Quick reference — what "good" looks like
- Sitemap: **Success**, discovered ≈ number of public pages.
- Inspected Tier-1 URLs: **URL is on Google**, canonical matches.
- Pages report: indexed count trending up; "Crawled – currently not indexed" and
  "Discovered – currently not indexed" trending down or explained.
- No spike in 404s, soft 404s, redirect errors, or server errors.
