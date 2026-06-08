# Weekly GSC Monitoring — SwingVantage (owner)

A 15-minute weekly pass in Google Search Console. Do it the same day each week so
trends are comparable. Log results in the action table at the bottom.

Property: `https://swingvantage.com`

---

## A. Indexing & coverage (GSC → Indexing → Pages)

| # | What to check | Healthy | If not |
|---|---|---|---|
| 1 | **Indexing status** (indexed page count) | Trending up | Investigate drops |
| 2 | **Submitted vs indexed** (Sitemaps report) | Indexed ≈ submitted | Inspect the gap |
| 3 | **User vs Google-selected canonical** (URL Inspection) | Match | Note mismatched URLs (often duplicates) |
| 4 | **Crawled – currently not indexed** | Low / falling | Improve depth + internal links (Tier-3 rule) |
| 5 | **Discovered – currently not indexed** | Low / falling | Strengthen internal links; check crawl budget |
| 6 | **Duplicate without user-selected canonical** | 0 | Add/confirm self-canonical; see dup report |
| 7 | **Alternate page with proper canonical tag** | Expected for `?utm` + alternates | No action if intentional |

## B. Crawl errors (GSC → Indexing → Pages → "Why not indexed")

| # | What to check | Healthy | If not |
|---|---|---|---|
| 8 | **404s** | Stable/low | Fix or 301 the source link |
| 9 | **Redirect errors** | 0 | Resolve redirect chains/loops |
| 10 | **Soft 404s** | 0 | Add content or return real 404/noindex |
| 11 | **Server errors (5xx)** | 0 | Check hosting/logs |
| 12 | **Sitemap fetch errors** (Sitemaps report) | "Success" | Confirm `/sitemap.xml` returns 200 + valid XML |

## C. Performance (GSC → Performance → Search results; last 28 days)

| # | What to check | Action |
|---|---|---|
| 13 | **Impressions** | Note total + week-over-week trend |
| 14 | **CTR** | Note site-wide + per-page outliers |
| 15 | **Average position** | Track movement on Tier-1 queries |
| 16 | **Impressions ↑ but CTR low** | Rewrite title/meta-description for those pages |
| 17 | **Impressions but weak internal linking** | Add hub/guide links to lift them |
| 18 | **High crawl interest but poor indexation** | Improve content depth/uniqueness |

## D. Content hygiene

| # | What to check | Action |
|---|---|---|
| 19 | Pages to **merge / improve / noindex / drop from sitemap** | Cross-ref [`duplicate-cannibalization-report.md`](duplicate-cannibalization-report.md); apply safe fixes, escalate content decisions |

---

## E. Weekly action log (template)

Copy this block each week:

```
### Week of YYYY-MM-DD
- Indexed / submitted: ___ / ___
- New "Crawled – not indexed": ___        (last week: ___)
- New "Discovered – not indexed": ___     (last week: ___)
- Canonical mismatches found: ___          → [URLs]
- Crawl errors (404 / soft404 / 5xx / redirect): ___ / ___ / ___ / ___
- Sitemap status: Success | Error (___)
- Impressions (28d): ___  | CTR: ___%  | Avg position: ___
- High-impression / low-CTR pages: [URLs] → action: ___
- Pages to merge/improve/noindex this week: [URLs]
- Indexing requested for: [URLs]   (Tier ___)
- Notes / decisions for owner:
```

> Reminder: never request indexing for app-only, utility, parameterized, or
> duplicate URLs. Follow the tier order in
> [`tiered-indexation-strategy.md`](tiered-indexation-strategy.md).
