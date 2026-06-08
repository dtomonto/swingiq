# SwingVantage — Update Publishing Engine

One unified engine powers **both** the plain-English product changelog (`/updates`)
and the technical engineering log (`/dev-updates`). Publishing an update produces,
in a single workflow, **all** of:

1. A card/list item on the correct index page.
2. A dedicated, SEO/AEO/GEO-optimized report page at a clean URL.
3. Per-page metadata, canonical, Open Graph, and structured data.
4. An FAQ + an AI-answer summary for answer engines.
5. Internal links to related features and related updates.
6. A sitemap entry — **only** when the update is published, public, and indexable.

There is **no second manual step**: the detail page, the card, and the sitemap entry
are all derived from the same single source of truth, so a published card can never
exist without a working detail page, and a detail page can never be an orphan.

## Architecture at a glance

| Concern | Product updates | Developer updates |
| --- | --- | --- |
| Data model | `Update` in `apps/web/src/data/updates.ts` | `DevUpdate` in `apps/web/src/data/devUpdates.ts` |
| Public filter | `getPublicUpdates()` / `isPublicUpdate()` | `getDevUpdates()` / `isPublicDevUpdate()` |
| Detail engine (pure) | `apps/web/src/lib/updates/product-detail.ts` | `apps/web/src/lib/updates/dev-detail.ts` |
| Validation + quality | `apps/web/src/lib/updates/validation.ts` | (shares the same patterns) |
| Index page | `app/(marketing)/updates/page.tsx` | `app/(marketing)/dev-updates/page.tsx` |
| Index cards | `components/updates/UpdateCard.tsx` | `components/dev-updates/DevUpdatesContent.tsx` |
| **Detail page** | `app/(marketing)/updates/[slug]/page.tsx` | `app/(marketing)/dev-updates/[slug]/page.tsx` |
| Sitemap | `app/sitemap.ts` (`updatePages`) | `app/sitemap.ts` (`devUpdatePages`) |
| Admin publish toggle | `lib/admin/updates-store.ts` + `/admin/updates` | same |

### Why this is "one workflow, not two steps"

The detail route uses `generateStaticParams()` fed by `publicUpdateSlugs()` /
`publicDevUpdateSlugs()`. Those read the **exact same** public filter that the index
cards use. So the moment an update becomes published + public (whether by editing the
seed array, or by flipping a draft live in `/admin/updates`), the next build:

- shows its card on the index (cards already link to `updatePath(u)`),
- prerenders its dedicated `/updates/[slug]` page,
- and adds its URL to the sitemap.

No additional code, file, or action is required to "generate the page."

## Indexable vs. noindex

A detail page is prerendered **only** for published + public items
(`isPublicUpdate` / `isPublicDevUpdate`). Any other slug (draft, private, hidden,
not-yet-public, or unknown) returns `notFound()` and `generateMetadata` emits
`robots: { index: false, follow: false }`. Draft content is therefore never exposed
and never reaches the sitemap.

## Validation & quality gate

`validateUpdate(update)` checks title, unique URL-safe slug, summary, SEO metadata,
and internal links; `scoreUpdateQuality(update)` returns a 0–100 score and
`needsHumanReview` when below threshold (thin/duplicate content). These run in the
test suite today and are available to the admin Publishing screen / API route.

## Tests

`apps/web/src/lib/updates/__tests__/detail.test.ts` covers slug uniqueness,
no-orphan resolution, related updates, FAQ derivation, metadata + canonical,
JSON-LD validity (Article / TechArticle + Breadcrumb + FAQPage), validation
failures, and quality scoring for both update types.

## Related docs

- [How to publish a product update](./HOW_TO_PUBLISH_PRODUCT_UPDATE.md)
- [How to publish a developer update](./HOW_TO_PUBLISH_DEVELOPER_UPDATE.md)
- [SEO / GEO / AEO strategy for updates](./SEO_GEO_AEO_UPDATES_STRATEGY.md)
- [Auto-publish from commit trailers](./AUTO_PUBLISH_UPDATES.md)
- [Plain-English update writing guide](./HOW_TO_PUBLISH_UPDATES.md)
