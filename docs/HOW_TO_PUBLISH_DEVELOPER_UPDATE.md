# How to publish a developer update

Developer updates are the **technical** engineering log at `/dev-updates`. They may
use engineering language but must stay readable, structured, and honest — describe
what was actually built. **Never** expose secrets, env vars, private URLs, exploit
detail, or customer data.

## 1. Add the entry

Add a `DevUpdate` object to the `DEV_UPDATES` array in
`apps/web/src/data/devUpdates.ts` (or flip an auto-generated `Dev-Update:` draft
live from `/admin/updates`).

```ts
{
  id: 'dev-my-feature',          // kebab-case + unique; the "dev-" prefix is
                                 // stripped to form the URL slug → /dev-updates/my-feature
  version: 'Motion Lab',         // optional tag
  title: 'What changed, technically',
  date: '2026-06-08',
  displayDate: 'June 2026',
  category: 'Architecture',      // see DevUpdateCategory
  impact: 'notable',             // major | notable | foundational
  headline: 'One-line technical summary.',
  details: 'A grounded paragraph: what was built and why it mattered.',
  highlights: ['Concrete win', 'Another concrete win'],
  stack: ['TypeScript', 'Next.js'],
  isMilestone: false,            // true → also shows in the milestone timeline
  // status defaults to published; set status: 'draft' to hide it.
}
```

## 2. What you get automatically

On the next build:

- A card on `/dev-updates` (title + "Read full developer report →" link to the page).
- A dedicated `/dev-updates/<slug>` page with hero, "what was built", implementation
  highlights, stack, AI-answer block, an FAQ, and related developer updates, plus a
  cross-link to the plain-English product updates.
- Unique metadata + canonical + Open Graph.
- JSON-LD: `BreadcrumbList` + `TechArticle` + `FAQPage`.
- A sitemap entry (published, non-draft dev updates only).

The slug is derived deterministically from the `id` (the `dev-` prefix removed); a
test asserts every published dev-update slug is unique.

## 3. Safety review (required)

Before publishing, confirm the `details`/`highlights` contain **none** of: API keys,
secrets, environment variable values, private/internal URLs, exploitable
vulnerability detail, auth-bypass instructions, customer/user data, private logs, or
confidential infrastructure detail. Describe architecture at a level that informs,
not one that creates risk.

## 4. Drafts

Set `status: 'draft'` to keep an entry out of the public page and the sitemap; its
slug will 404 + noindex until flipped to published.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Page 404s | Entry is `status: 'draft'`, or slug mismatch. |
| Ugly slug | Give the entry a cleaner `id` (kebab-case); the `dev-` prefix is dropped. |
| Slug collision test fails | Two entries reduce to the same slug; rename an `id`. |
