# Link Intelligence Agent

## In Plain English (start here)

The **Link Intelligence Agent** is GrowthOS's "links brain." It reads your real
SwingVantage pages, maps how they link to each other, and continuously works to
improve your site's authority and discoverability in Google **and** AI answer
engines (ChatGPT, Perplexity, Google AI Overviews).

It does five things, every run:

1. **Internal links (fully real now)** — finds orphan pages (nothing links to
   them), broken internal links, pages buried too deep, weak/over-optimized
   anchors, and then recommends specific "link page A → page B" fixes with a
   natural anchor and a plain-English reason. Safe, obvious fixes are marked
   **safe to auto-apply**; everything else waits for your one-click approval.
2. **Backlink opportunities** — surfaces white-hat ways to earn links (resource
   pages, coach/academy resources, podcasts, comparison roundups, digital PR).
   These appear in **Digital PR** (`/admin/growth/pr`).
3. **Competitor link gaps** — where rivals earn links you don't. These appear in
   **Market Intelligence** (`/admin/growth/market-intel`).
4. **AI-search (AEO/GEO) readiness** — scores how "citable" each page is and how
   to make it more so (direct answer, FAQs, schema, internal links).
5. **Linkable-asset content ideas** — content worth creating *because* it earns
   links (original data, comparisons, glossaries, calculators). These appear in
   **Recommendations**.

**Two honesty rules it never breaks:**

- It **never fakes data.** Internal-link analysis is computed from your real
  pages. Backlink + competitor numbers need a data provider (Ahrefs / Semrush /
  Search Console); until one is connected, those panels show clearly-labeled
  *curated examples*, never invented metrics.
- It **never sends outreach automatically.** It drafts; you approve and send.

### Where to find it

- **Hub:** `/admin/growth/link-intelligence` — the dashboard (health scores,
  audit, recommendations, opportunities, gaps, cluster authority, AEO readiness,
  notifications, the latest report, and provider status). Click **Run agent now**
  any time.
- **Internal Links:** `/admin/growth/internal-links` — review + approve /
  auto-apply internal-link recommendations and browse the full audit.
- It also feeds **Digital PR**, **Market Intelligence**, **Recommendations**, and
  shows an **Internal-link health** tile on the GrowthOS overview.

## How it's built (GrowthOS-native)

It reuses GrowthOS's own primitives instead of duplicating them:

- **Engine:** `apps/web/src/lib/growth/link-intelligence/` (pure, testable).
  `runLinkAgent()` computes a full analysis in memory; `persistLinkAgentResult()`
  writes records.
- **Storage:** the existing `growth_records` JSONB table via
  `lib/growth/repository.ts`. New record kinds: `internal-link-rec`,
  `link-finding`, `link-run`. Backlink opportunities reuse `AuthorityOpportunity`
  (kind `authority`); competitor gaps reuse `CompetitorInsight` (kind
  `competitor`); content ideas reuse `AIRecommendation` (kind `recommendation`).
- **UI:** the generic `RecordModule` + module definitions `internal-links` and
  `link-audit`, plus the hub page.
- **AI:** the AI Strategist gains a `link-outreach` task for drafting outreach.
- **APIs:** `POST /api/growth/link-intelligence/run`, `POST …/apply`,
  `GET …/cron`.

Access is inherited from GrowthOS (admin-guarded); no separate login or role.

## Scoring (all explainable — no black boxes)

Every score is 0–100 and returns the factors behind it:

- **Internal-link opportunity** — destination value + how under-linked it is +
  source authority + topical relevance + crawl-depth improvement + anchor
  quality. Irrelevant cross-topic links are capped.
- **Page equity** — business value vs. current internal authority (→ under/over-
  supported).
- **Backlink opportunity** — relevance, authority proxy, traffic proxy, editorial
  quality, link likelihood, competitor gap, minus spam risk.
- **AI-search citation** — answer clarity, factual depth, schema, internal
  authority, structure, sport specificity.

## Safety & guardrails (white-hat only)

- **Safe-auto-apply** requires *all of*: highly relevant (same cluster/sport),
  natural anchor (not exact-match/generic), high confidence (score ≥ 70),
  non-sensitive source (never homepage/footer/nav/money/legal), destination not
  already over-optimized, and reversible.
- **Always needs human approval:** outreach, homepage/header/footer/nav changes,
  money-page links, programmatic-template changes, redirect/canonical/noindex
  changes, content deletion, disavow.
- **Blacklisted tactics are rejected outright:** PBNs, link farms, paid links,
  comment/forum spam, cloaking, doorway pages, hidden links, mass directories,
  etc. (see `guardrails.ts`).
- "Auto-apply" records an accepted decision and is reversible; it does **not**
  edit page source at runtime — insertion happens through your content workflow.

## Automation cadence

A cron entry runs the agent on a schedule (see `apps/web/vercel.json`):

- **Weekly** (`Mon 08:00 UTC`) — full audit + opportunity refresh.
- **Monthly** (`1st 09:00 UTC`) — strategic report.

You can also trigger any cadence manually:
`GET /api/growth/link-intelligence/cron?cadence=daily|weekly|monthly`.

> **Vercel plan note:** Hobby allows 2 cron jobs (≤ daily frequency), so weekly +
> monthly are configured. On Pro you can add a `daily` entry for broken-link /
> orphan / new-page checks.

## Environment variables

Everything works with **zero** configuration (local-first, curated examples).
Add these to unlock live data + scheduling:

| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Bearer token Vercel Cron sends to the cron route. |
| `ADMIN_SECRET` | Existing admin guard for the run/apply APIs (already used by GrowthOS). |
| `AHREFS_API_KEY` | Live backlink + competitor data (Ahrefs adapter). |
| `SEMRUSH_API_KEY` | Live backlink + gap data (Semrush adapter). |
| `MOZ_ACCESS_ID`, `MOZ_SECRET_KEY` | Domain authority + link metrics (Moz). |
| `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Affordable backlink/SERP data. |
| `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY` (or `GSC_ACCESS_TOKEN`) | Search Console rankings/impressions. |

No secrets are hardcoded. Adapters live in
`lib/growth/link-intelligence/adapters/` and currently report connection status +
return no rows (a clean seam to implement the live fetch later). The UI labels
each provider as connected or "Set `<ENV_VAR>`".

## Optional: persistence

The new record kinds work keyless (in-process store, seeded empty; the hub
renders a live run every load). To persist across processes, the GrowthOS
`growth_records` Supabase table is reused — no new migration is required.

## Future roadmap

1. Implement live `fetchBacklinks` / `fetchCompetitorBacklinks` in the adapters
   (start with DataForSEO or Ahrefs).
2. Wire Search Console so the hub shows real rankings/impressions/CTR trends.
3. Add a real-world external crawler to catch runtime links the static
   inventory can't see (rendered nav/footer edge cases).
4. Track link velocity + before/after impact per applied recommendation.
5. Auto-insert safe internal links via the content system (codegen/PR), keeping
   the human-approval gate.
6. Email/Slack notifications for high-priority opportunities + monthly reports.

## Tests

`apps/web/src/lib/growth/link-intelligence/__tests__/link-intelligence.test.ts`
covers inventory, graph, internal-link analysis + recommendations, anchor
classification, scoring, guardrails (incl. "never spam", "never bad internal
links", "graceful with no API"), backlinks/competitors/content gaps, outreach,
AEO/GEO, reports, and a full agent run. Run: `npm test -- link-intelligence`.
