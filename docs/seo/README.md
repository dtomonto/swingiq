# SwingVantage — Technical SEO docs

How the SEO infrastructure works (for engineers) and how to operate Google Search
Console (for the owner).

| Doc | Audience | Purpose |
|---|---|---|
| [technical-seo-architecture.md](technical-seo-architecture.md) | Engineer | Sitemap/canonical/schema wiring; the curated URL registry; when & how to split the sitemap; validation gates. |
| [gsc-submission-checklist.md](gsc-submission-checklist.md) | Owner | Validate + submit `sitemap.xml`, inspect the first 20 URLs, confirm canonicals, tiered rollout. |
| [priority-submit-urls.md](priority-submit-urls.md) | Owner | The first 20 priority URLs (Tier 1) — *provisional, pending approval*. |
| [tiered-indexation-strategy.md](tiered-indexation-strategy.md) | Owner | Tier 1/2/3 definitions + the prerequisites to graduate a page to the next tier. |
| [weekly-gsc-monitoring.md](weekly-gsc-monitoring.md) | Owner | 20-point weekly GSC review + an action-log template. |
| [duplicate-cannibalization-report.md](duplicate-cannibalization-report.md) | Owner + Engineer | Blog↔guide cannibalization findings; per-pair recommendations (most `REQUIRES OWNER DECISION`). |

**Source of truth for URLs:** `apps/web/src/lib/seo/site-sections.ts`
(curated) + the content registries (`seoPages.ts`, `blog-posts.ts`,
`challenges.ts`, library). Both `/sitemap.xml` and `/sitemap` read from these.

**Validate before shipping SEO changes:**
```
node scripts/check-sitemap.mjs
node scripts/check-sitemap-coverage.mjs
npm --prefix apps/web test -- src/lib/seo
npm --prefix apps/web run type-check
```
