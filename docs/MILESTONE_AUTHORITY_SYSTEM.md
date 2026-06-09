# SwingVantage Milestone Authority System

> A strategic authority-building engine (not vanity badges). Detects **verifiable**
> brand/product/SEO milestones from real data, scores each one's authority value,
> and turns genuinely-earned milestones into dedicated SEO/AEO/GEO pages — while
> **never fabricating numbers** and **never shipping thin pages**.

- **Admin:** Admin → Growth & Money → **Milestones** (`/admin/milestones`), perm `milestones.manage`
- **Public:** `/updates/milestones` (hub) + `/updates/milestones/<slug>` (dedicated pages). (Top-level `/milestones` is the authenticated in-app feature, so the public authority hub lives under `/updates`.)
- **Status:** server-evaluated + local-first owner state (no DB)

## How it works

```
content/milestones/catalog.ts        100 milestone DEFINITIONS (compact)
          │
metrics-snapshot.server.ts  ── reads REAL data ──┐ getPlatformMetrics (users/analyses/
          │                                       │ sessions/sportUsage) + content
metric-sources.ts (PURE)  ── resolves each ──────┘ registries + feature flags
          │                  trigger; unreadable → needs_data_source
triggers.ts (PURE)  ── earned / in_progress / needs_data_source / not_started
authority-score.ts (PURE)  ── 0–100 Authority Impact Score + band
evaluate.ts (PURE)  ── runs the catalog over the snapshot (+ admin overrides)
          │
          ├─► /admin/milestones        review · approve · attest · preview · export
          ├─► content/milestones/published.ts   committed → public pages + sitemap
          │       └─► /updates/milestones + /updates/milestones/[slug]  (page-detail.ts: metadata + JSON-LD)
          └─► /updates "Milestones earned" section
```

The scoring engine is **pure & isomorphic**, so the Admin Center re-runs the exact
same evaluation client-side with the admin's localStorage overrides (admin-attested
values are live).

## Truthfulness rules (built in, not optional)

1. A trigger whose metric can't be read → `needs_data_source`. It **never** auto-earns
   and **never** auto-publishes. Today this includes traffic, search clicks, indexed
   pages, backlinks, countries, uptime, page speed, retests, uploads, drill-plan and
   feedback counts (no in-app source yet).
2. A public page exists **only** for a milestone that is genuinely **earned** AND
   **admin-approved** AND committed to `published.ts`. Drafts/estimates never get a page.
3. Numbers are never injected into copy unless a **verified** value is passed.
4. Quality gate before publishing: verified metric, unique angle, ≥5 internal links
   where possible, FAQ, schema, canonical, substantive educational context — otherwise
   keep it draft/noindex.

## Adding a milestone

Append one `m(...)` entry to `apps/web/src/content/milestones/catalog.ts`
(`id`, `slug`, `title`, `category`, trigger `type` + `value`, page angle, authority
purpose). The engine, Authority scorer, admin center, content generator and (once
approved) the public page + sitemap pick it up automatically.

## Connecting a future data source

A milestone shows "Needs Data Source" until its metric is readable. To wire one:
1. Add the real count to `MetricSnapshot` (`types.ts`) and populate it in
   `metrics-snapshot.server.ts` (e.g. organic clicks from PostHog/Search Console,
   backlinks from the Link Intelligence agent).
2. Map its `TriggerType` in `metric-sources.ts` to the new field (remove it from the
   `NEEDS_SOURCE` list).
That milestone now auto-evaluates against live data.

## Publishing a milestone (manual verification → public page)

1. `/admin/milestones` → **Definitions**: find an **Earned** milestone.
   - For `admin_manual` / "needs data source" milestones you can verify manually,
     enter the verified value in "Verify / override current value".
2. Click **Approve** and enable **Dedicated page**.
3. **Published** tab → **Export approved** → paste into `PUBLISHED_MILESTONES` in
   `apps/web/src/content/milestones/published.ts` and commit.
4. The page goes live at `/updates/milestones/<slug>` and is added to the sitemap
   (unless `noindex: true`). Deploy when `origin/master` updates.

## Authority Impact Score (admin-only)

A 0–100 estimate of how much SEO/AEO/GEO authority a milestone page would add
(category demand, sport/persona relevance, internal-link value, uniqueness, trust).
Bands: 90+ Strategic · 75+ High-Value · 50+ Supporting · 25+ Low Priority · <25 Do
Not Publish Yet. Publish high-value milestones first; hold low ones back.

## Files

| Area | Path |
| --- | --- |
| Pure engine | `apps/web/src/lib/milestones/{types,metric-sources,triggers,authority-score,content,internal-links,evaluate,page-detail}.ts` |
| Catalog (100) | `apps/web/src/content/milestones/catalog.ts` |
| Published registry | `apps/web/src/content/milestones/published.ts` |
| Server | `apps/web/src/lib/milestones/{metrics-snapshot,generate,access}.server.ts` |
| Client state | `apps/web/src/lib/milestones/useMilestones.ts` |
| Admin Center | `apps/web/src/app/admin/milestones/{page,MilestoneCenterClient}.tsx` |
| Public pages | `apps/web/src/app/(marketing)/updates/milestones/{page,[slug]/page}.tsx` |
| UI | `apps/web/src/components/milestones/MilestoneUI.tsx` |
| Tests | `apps/web/src/lib/milestones/__tests__/milestones.test.ts` |
| Integrations | nav, rbac (`milestones.manage`), sitemap, `site-sections`, `events.ts`, setup catalog, agent-registry, `/updates` |

## Troubleshooting

- **A milestone won't earn:** check its data source in Definitions. `needs_data_source`
  means no readable metric — verify manually or connect a source.
- **A page isn't live:** it must be approved + in `published.ts` + committed + deployed.
- **Page missing from sitemap:** confirm it isn't `noindex` and is in `published.ts`.

## Deferred (fast-follow)

Milestone traffic-analytics dashboards (top/converting/declining pages — need Search
Console + PostHog wiring); long-form hand-written content beyond the templates;
auto-publish automation (kept admin-gated by design).
