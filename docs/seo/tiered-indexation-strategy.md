# Tiered Indexation Strategy — SwingVantage

Submit pages to Google in tiers so crawl equity flows to the strongest pages
first. Tier order is enforced operationally via the GSC checklist — the XML
sitemap itself lists all public pages (Google decides what to index), but you
**manually request indexing** and build internal links tier by tier.

---

## Tier 1 — submit now (high quality + indexable today)

The first 20 are enumerated in [`priority-submit-urls.md`](priority-submit-urls.md).
Tier 1 as a class:

- **Homepage** — `/`
- **Sport hubs** — `/golf-swing-analysis`, `/tennis-swing-analysis`,
  `/baseball-swing-analysis`, `/softball-swing-analysis`
  (`/slow-pitch`, `/fast-pitch`), `/pickleball`, `/padel`
- **Top public tools** — `/tools` + `/tools/golf-slice-fixer`,
  `/tools/swing-mistake-quiz`, `/tools/practice-plan-generator`
- **Sample reports** — `/sample-report` (+ per-sport)
- **Methodology / how-it-works** — `/how-it-works`, `/methodology`
- **Best conversion guides** — `/free-swing-analysis`, `/golf/fix-slice`,
  `/golf/launch-monitor-analysis`

**Rule:** include immediately; these are indexable and high quality.

---

## Tier 2 — submit AFTER internal linking is in place

- Supporting programmatic guides (e.g. `/golf/stop-topping-the-ball`,
  `/softball/how-to-hit-line-drives`, `/tennis/forehand-analysis`,
  `/baseball/exit-velocity-drills`)
- Strong blog posts (`/blog/what-is-smash-factor`,
  `/blog/how-to-read-launch-monitor-data`)
- Remaining tools, benchmarks pages, partner pages
- Comparison / use-case pages once written

**Prerequisite before submitting Tier 2:**
1. Each Tier-2 page is linked from its sport hub (hub → guide) — already provided
   by the `RelatedGuides` silo on each hub.
2. Each guide links back to the hub + a relevant tool + a related guide
   (already provided by per-page `relatedLinks` + `Breadcrumbs`).
3. The page is reachable within 2 clicks of the homepage (footer + hub links).

Confirm those, then request indexing for Tier-2 URLs in the GSC checklist flow.

---

## Tier 3 — submit AFTER content depth improves

- Lower-priority long-tail articles and emerging-topic pages
- The Phase-3 "growth wedge" guides that are thinner than the Tier-1/2 set
- Any page flagged "Crawled – currently not indexed" by Google (a depth/quality
  signal — improve before re-requesting)

**Prerequisite before submitting Tier 3:**
1. Unique, substantial content (not a thin variation of a Tier-1/2 page).
2. Distinct keyword intent from any existing page (see
   [`duplicate-cannibalization-report.md`](duplicate-cannibalization-report.md)).
3. Internal links from at least one Tier-1/2 page.

---

## Never submit (and never in the sitemap)

Login/signup, settings, dashboards, account pages, `/admin`, `/api`, tutorial-UI
and video app pages, internal utility pages, redirect-only URLs, query-parameter
/ search / filter URLs, and thin placeholders. These are blocked in `robots.txt`
and excluded from the sitemap by construction (see
[`technical-seo-architecture.md`](technical-seo-architecture.md)).

## Draft content

Programmatic pages with `publishStatus: 'draft'` in `seoPages.ts` (e.g.
`compare/private-lessons`, `compare/youtube-swing-tips`) are **not routed, not
indexed, and not in the sitemap**. Promote them to `'published'` only when they
meet Tier-2/3 quality — never ship a thin page to win a tier.
