# SearchIntelligenceOS — GrowthOS Visibility Command Center

An internal, Ahrefs-class **Search Intelligence Operating System** inside GrowthOS. It tells you
what to **fix, create, and link** today — ranked by business impact — for SwingVantage, and is
architected to extend to other properties (ProfitPour, Projectward, …) and premium APIs later.

> **Honesty first.** SearchIntelligenceOS never fabricates rankings, search volumes, backlinks, or
> traffic. Every value carries a `DataSource` label (`real | estimated | imported | placeholder |
> mock`). It never publishes content or changes canonicals/sitemap without admin approval.

## What was built

A pure engine (`apps/web/src/lib/growth/search-intelligence/`) that **reuses** the existing Link
Intelligence agent (inventory, link graph, clusters, AEO, backlinks, competitor gaps — never
rebuilt) and layers on the genuinely-missing capabilities:

| Module | File | What it does |
| --- | --- | --- |
| Projects | `projects.ts` | SwingVantage (active) + multi-property placeholders |
| Page Intelligence | `page-intel.ts` | Enriches each page with owned metadata + indexability + scores |
| Technical Audit | `audit.ts` | Severity-ranked issues (metadata/content/schema/sitemap/links) |
| Keyword engine | `keywords.ts` + `keyword-seeds.ts` | Owned + strategic keywords, relative opportunity scoring |
| Content Opportunities | `opportunities.ts` | Scored gaps from keywords + cluster missing topics |
| Sitemap Intelligence | `sitemap-intel.ts` | Coverage diff + indexing/submission priority (1..100) |
| Decay detection | `decay.ts` | Structural decay/refresh signals (heuristic, labeled) |
| Brief generator | `briefs.ts` | Deterministic, production-ready content briefs |
| Scoring | `scoring.ts` | Explainable page/keyword/issue/action scorers |
| Score battery | `scores.ts` | The 9 Command Center scores, each with factor lines |
| Action feed | `actions.ts` | Prioritized, banded growth actions |
| Orchestrator | `engine.ts` | `runSearchIntel()` (pure) + `persistSearchIntel()` |
| Decision overlay | `store.ts` | Local-first zustand for human action/keyword/opportunity status |

## Routes added (all admin-only, `noindex, nofollow`)

| Route | Page |
| --- | --- |
| `/admin/growth/search` | Visibility Command Center (score battery + actions + panels) |
| `/admin/growth/search/explorer` | Site Explorer (filterable URL inventory) |
| `/admin/growth/search/page-intel?url=` | Page Intelligence deep-dive |
| `/admin/growth/search/audit` | Site Audit (issues by category + severity) |
| `/admin/growth/search/keywords` | Keyword Explorer |
| `/admin/growth/search/opportunities` | Content Opportunity engine |
| `/admin/growth/search/sitemap` | Sitemap & Indexing Intelligence |
| `/admin/growth/search/briefs?topic=` | Content Brief generator |
| `POST /api/growth/search-intelligence/run` | Admin-only run + persist |

A new **"Search Intelligence"** group is registered in `lib/growth/nav.ts`.

## Data model

New pure types in `search-intelligence/types.ts`: `Project`, `PageIntel`, `TechnicalIssue`,
`KeywordRow`, `ContentOpportunity`, `SitemapEntry`, `DecaySignal`, `ContentBrief`, `SearchAction`,
`SearchScores`, `SearchIntelRun`. No DB migration is required for the MVP — the dashboards
recompute **live** on every load (like the Link Intelligence pages), and `persistSearchIntel()`
optionally upserts the run + actions into the existing `growth_records` table when Supabase is
configured (graceful no-op otherwise).

## Scoring (transparent)

Every score returns `{ score, factors[] }`:
- **Page priority** = business value + improvement headroom + internal-link weakness − depth.
- **Keyword opportunity** = business value + intent + content gap + relative ease.
- **Technical issue priority** = severity × reach × impact × ease × confidence.
- **Action priority** = `Impact × Confidence × Urgency × BusinessValue ÷ Effort`, banded
  90+/70+/40+/<40 (critical/high/medium/low).
- **Command Center battery**: search health, technical, indexability, content authority, internal
  linking, keyword opportunity, AEO readiness, backlink authority, growth momentum.

## Approvals & safety

- All routes inherit the admin guard from `app/admin/layout.tsx` (ADMIN_SECRET / RBAC) and are
  `noindex`. Feature flag: **`search_intelligence_os`** (`lib/admin/flags.ts`).
- Actions are flagged `canClaudeImplement` and `requiresApproval`. Public-content, canonical,
  schema, and sitemap changes always require admin approval. The brief generator never auto-publishes.

## How to run a scan

Open `/admin/growth/search` and click **Run scan now** (or `POST /api/growth/search-intelligence/run`
with the `x-admin-secret` header). The scan is registry-derived and keyless.

## Integrations / adapters

Reuses the Link Intelligence provider adapters + `providerStatuses()` (Ahrefs / Semrush / Moz /
DataForSEO / Search Console). None are required for the MVP. Env vars are the same ones those
adapters already read — see `lib/growth/link-intelligence/adapters/`.

## Import / export (shipped)

**CSV export** is available on every table (Keyword Explorer, Site Explorer, Site Audit, Content
Opportunities, Sitemap Intelligence) via the reusable `ExportCsvButton` + the pure `toCsv`
serializer.

**CSV import** (Keyword Explorer → *Import / export*) supports three kinds via `importByKind`:
- **keywords** — `keyword,volume,difficulty,intent,sport,url`. Rows with real `volume`/`difficulty`
  are labeled `imported` (verified); rows without are scored with relative estimates and labeled
  `estimated`. Headers are alias/case/spacing-insensitive.
- **rankings** — `keyword,url,position,device,checked_at`.
- **backlinks** — `source_url,target_url,anchor,nofollow,authority` (domain is derived if absent).

Parsing is RFC-4180-ish (quoted fields, escaped `""`, embedded commas/newlines, CRLF, BOM). Imports
persist in the local-first store (`store.ts`, localStorage) so they survive a live re-scan, and each
imported set can be cleared or re-exported. Engine + UI: `csv.ts`, `ExportCsvButton.tsx`,
`keywords/KeywordTools.tsx`.

> Next step: a GSC/GA4 adapter can promote these `imported` rows to live `gsc` data automatically.

## Tests

`search-intelligence/__tests__/search-intelligence.test.ts` (25 assertions): projects, page-intel
enrichment, audit + severity, keyword build + opportunity scoring, opportunities, sitemap
coverage/priority, decay, brief shape, scorers + bands, the score battery, and full orchestration.
Run with a private cache to avoid concurrent-agent contention:

```
cd apps/web && npx jest search-intelligence --runInBand --cacheDirectory ./.jest-cache-si
```

## Known limitations

- **Registry-derived, not a live crawl.** The audit reflects owned page data (the same source the
  sitemap renders from), not rendered-HTML/HTTP-status checks. A live-HTTP-fetch crawler is a
  stubbed adapter seam.
- **Keyword volume/difficulty are relative estimates**, clearly labeled, until a provider/CSV is
  connected. Backlink authority is a curated white-hat proxy until a link-data provider is connected.
- **No historical tracking yet** — growth momentum is a structural heuristic until Search Console
  is connected.

## Future roadmap

1. Live-HTTP crawler adapter (HTTP status, redirects, rendered meta/H1, broken external links).
2. Google Search Console + GA4 ingestion → real ranks, impressions, CTR, and true decay.
3. Full rank-tracker history + SERP-feature tracking (CSV import already feeds it).
4. ~~CSV import/export wiring~~ — **shipped** (see Import / export above).
5. Multi-project switching UI (the `Project` model is already in place).
6. First-run setup wizard (add project → confirm sitemap → run scan → add competitors/topics).
