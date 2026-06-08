# How to publish a product update

Product updates are the **plain-English, athlete-facing** changelog at `/updates`.
Keep them free of developer jargon. Only publish **real, shipped** features —
anything not finished must carry a clear `draft` / `planned` / `coming_soon` /
`beta` / `in_progress` status and stay non-public.

## 1. Add the entry

Add an `Update` object to the `UPDATES` array in
`apps/web/src/data/updates.ts` (or flip an auto-generated draft live from
`/admin/updates` — see [AUTO_PUBLISH_UPDATES.md](./AUTO_PUBLISH_UPDATES.md)).

Minimum fields for a publishable, indexable update:

```ts
{
  id: 'update-086',
  title: 'Plain-English headline of what changed',
  slug: 'plain-english-headline',          // lowercase, hyphenated, UNIQUE
  summary: 'One paragraph a user understands.',
  releaseDate: '2026-06-08',
  displayDate: 'June 2026',
  category: 'New Feature',
  status: 'published',                      // published → eligible for a page
  visibility: 'public',                     // public → eligible for the sitemap
  sport: 'All Sports',                      // or a specific sport
  audience: ['all athletes', 'parents', 'coaches'],
  userBenefit: 'What the athlete can now do (40+ chars).',
  whyItMatters: 'Why this is worth their attention.',
  whereToFindIt: 'Where in the app to use it.',
  sortOrder: 158,

  // SEO / AEO / GEO (strongly recommended for indexable updates)
  metaTitle: 'Unique meta title | SwingVantage',
  metaDescription: 'Unique 1–2 sentence meta description.',
  seoKeywords: ['three', 'or more', 'keywords'],
  answerEngineSummary: 'A self-contained answer an AI engine can quote.',
  internalLinkTargets: ['/features', '/journey'],   // ≥1 relevant link

  createdAt: '2026-06-08',
  updatedAt: '2026-06-08',
}
```

## 2. What you get automatically

On the next build, **with no extra steps**:

- A card on `/updates` (title + "Read full update →" both link to the page).
- A dedicated report page at `/updates/<slug>` with hero, executive summary,
  how-to-use, AI-answer block, related features, an FAQ, related updates, and a CTA.
- Unique `<title>`, meta description, canonical, Open Graph.
- JSON-LD: `BreadcrumbList` + `Article` + `FAQPage`.
- A sitemap entry (because `status:'published'` + `visibility:'public'`).

## 3. Validate before publishing

`validateUpdate()` / `scoreUpdateQuality()` in
`apps/web/src/lib/updates/validation.ts` check for: missing title/slug/summary,
non-unique or malformed slug, missing SEO metadata, too few internal links, and
thin content. Run the test suite:

```bash
cd apps/web && npx jest src/lib/updates --runInBand
```

## 4. Drafts & "coming soon"

To keep something out of the public site and the sitemap, set `status` to a
non-published value **and** `visibility` to `private`/`internal`. It will not get a
detail page, a card, or a sitemap entry, and the slug will 404 + noindex.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Page 404s | Update is not `published` + `public`, or slug mismatch. |
| Not in sitemap | Same — only published + public updates are listed. |
| Duplicate-slug test fails | Two updates share a `slug`; make it unique. |
| "Thin content" warning | Lengthen `summary` / `userBenefit`; add keywords + links. |
