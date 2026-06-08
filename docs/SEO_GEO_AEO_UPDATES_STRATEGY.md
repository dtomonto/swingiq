# SEO / AEO / GEO strategy for SwingVantage updates

How the update detail pages earn discoverability in classic search (SEO), AI answer
engines (AEO), and generative search (GEO) — without spamming the index.

## Per-page signals (every published, indexable update)

- **Unique `<title>` + meta description** — from `metaTitle` / `metaDescription`,
  falling back to title/summary. Built by `buildUpdateMetadata` /
  `buildDevUpdateMetadata`.
- **Canonical URL** — self-referential `/updates/<slug>` (or `/dev-updates/<slug>`),
  so syndicated/duplicate surfaces never cannibalize the report page.
- **Open Graph** title/description/type + published/modified time.
- **Structured data** (`buildUpdateJsonLd` / `buildDevUpdateJsonLd`, serialized via
  the shared XSS-safe `serializeJsonLd`):
  - `BreadcrumbList` (matches the visible breadcrumbs in the hero).
  - `Article` (product updates) / `TechArticle` (developer updates).
  - `FAQPage` whenever FAQ items exist.
  - A `SoftwareApplication` `about` reference to SwingVantage.
- **Visible breadcrumbs**, clean slug URLs, and a published + modified date.

## AEO — answer engines

Each page renders an **"In a nutshell"** AI-answer block (`answerEngineSummary` →
`generativeSearchSummary` → derived) — a concise, self-contained answer an engine can
quote — plus a **derived FAQ** (`buildUpdateFaqs` / `buildDevUpdateFaqs`) sourced only
from author-provided fields (no hallucinated claims). The FAQ is mirrored in
`FAQPage` JSON-LD so the same Q&A is both human-readable and machine-extractable.

## GEO — generative search

Content is scannable (clear `<h2>` sections), grounded in real product copy, and
internally linked to sport hubs and feature pages via `internalLinkTargets`
(`resolveInternalLinks`). Related-update cross-links build topical authority around
each feature area.

## Anti-spam / quality gating

- Only **published + public** updates get a page and a sitemap entry; drafts/private
  items 404 + `noindex` and are excluded from `sitemap.ts`.
- `scoreUpdateQuality` flags thin content for human review below threshold.
- `validateUpdate` blocks duplicate or malformed slugs and missing metadata, so we
  never ship duplicate titles/descriptions or cannibalizing pages.
- The sitemap stays a **curated trust surface** — update pages are added
  programmatically from the public registry, never by blanket-including routes. The
  `[slug]` routes are out of scope for `check-sitemap-coverage.mjs` (registry-driven).

## Sitemap behavior

`app/sitemap.ts` adds one entry per published-public update
(`updatePages`) and per published dev update (`devUpdatePages`), with `lastModified`
from each item's own `updatedAt` / `date`. Robots already allows `/updates` and
`/dev-updates` (prefix match covers the detail pages); `/admin` and `/api` stay
blocked.

## Field → signal cheat sheet

| Field | Drives |
| --- | --- |
| `slug` | Clean URL + canonical (must be unique) |
| `metaTitle` / `metaDescription` | `<title>` / meta + OG |
| `seoKeywords` | `keywords` meta + Article keywords |
| `answerEngineSummary` | AEO "In a nutshell" block + AI quote |
| `summary` / `whyItMatters` / `whereToFindIt` / `userActionRequired` | Derived FAQ |
| `internalLinkTargets` | Internal links (topical authority) |
| `sport` / `category` / `relatedFeature` | Related-update selection |
| `updatedAt` | Sitemap `lastmod` + Article `dateModified` |
