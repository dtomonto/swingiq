# SwingIQ — SEO / AEO / GEO System

How SwingIQ's organic-visibility system is built and how to extend it safely.

---

## 📘 In Plain English (start here)

**What this page is:** The technical how-to for adding new search-friendly pages (the ones that help SwingIQ show up in Google and AI answers) to the website.

**What you actually need to know:**
- There's a safe, repeatable system for creating these pages, with an automatic quality check that **blocks weak, low-effort ("thin") pages** from going live. That protects your reputation with Google.
- This is a builder's guide. You don't operate it directly — a developer, a content writer, or an AI assistant uses it when adding pages.
- If you want the bigger-picture strategy of how SwingIQ gets discovered (and your own owner steps), read [SEO_GEO_AEO.md](SEO_GEO_AEO.md) instead — that one is written for you.

**What to do next:** Nothing here is a task for you. For your SEO to-dos, see [SEO_GEO_AEO.md](SEO_GEO_AEO.md).

> Everything below is a step-by-step reference for whoever codes new pages — a developer or an AI assistant. You don't need it to run SwingIQ.

---

## 1. Metadata system

Every public page builds its metadata with one helper:

```ts
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'How to Fix a Slice',     // brand suffix added automatically
  description: '…',
  path: '/golf/fix-slice',          // → canonical + OG url
  ogType: 'article',                // 'website' (default) | 'article'
  noindex: false,                   // true for private/thin/draft pages
  keywords: ['…'],                  // optional
});
```

`buildMetadata` (in `apps/web/src/lib/seo/metadata.ts`) returns a complete
Next.js `Metadata` object: title, description, canonical, Open Graph
(title/description/type/url/siteName/image), Twitter card, and robots. Defaults
come from `apps/web/src/config/site.ts`.

## 2. Schema (JSON-LD) system

Builders live in `apps/web/src/lib/seo/jsonLd.ts` and render via the `<JsonLd>`
component (`apps/web/src/components/seo/JsonLd.tsx`):

| Builder | Use |
|---|---|
| `websiteSchema()` | Site-wide WebSite node |
| `organizationSchema()` | Publisher/Organization (only includes social links that exist) |
| `softwareApplicationSchema()` | The app (price truthfully $0) |
| `articleSchema()` | Informational pages |
| `faqPageSchema()` | FAQ blocks |
| `howToSchema()` | Step-based guides, drills, challenges |
| `breadcrumbListSchema()` | Breadcrumb trails (auto via `<Breadcrumbs>`) |
| `serviceSchema()` | Coach/team/partner pages |
| `buildGraph(...nodes)` | Wraps nodes into one `@graph` document |

**Quality rules (enforced by review + scripts):**
- No fake ratings, reviews, awards, credentials, or medical claims.
- Only populate fields we can truthfully fill.

## 3. Sitemap & robots

- `apps/web/src/app/sitemap.ts` pulls published SEO pages from the content
  registry (`PUBLISHED_SEO_PAGES`) and lists tool/partner/challenge routes.
  Draft registry entries are excluded.
- `apps/web/public/robots.txt` allows public marketing/SEO routes and blocks
  authenticated app routes and `/api/`.
- `npm run generate:sitemap` verifies every literal path the sitemap emits
  resolves to a real route (catches 404 entries).

## 4. Content registry

`apps/web/src/content/seoPages.ts` is the single source of truth for
programmatic SEO landing pages. Each `SeoPage` carries slug, sport, audience,
keyword, intent, funnelStage, priority, full content blocks, FAQs, schemaType,
safetyNotes, and `publishStatus`.

- `publishStatus: 'published'` → routed (a `page.tsx` under `app/<slug>/`),
  indexed, and in the sitemap.
- `publishStatus: 'draft'` → backlog only; never routed or indexed.

Pages render through `components/seo/SeoArticle.tsx` in the AEO/GEO format.

## 5. AEO/GEO page format

Every SEO page follows this order so answer engines and humans both win:

1. **Direct answer** (a concise paragraph at the very top)
2. What is happening (explanation)
3. Diagnose it yourself (checklist)
4. What SwingIQ looks for
5. Beginner-safe drills
6. Common mistakes to avoid
7. When to work with a coach
8. FAQ
9. CTA
10. Schema (Article/HowTo + FAQPage) + breadcrumbs

## 6. Adding a new SEO page

1. Add a fully-written entry to `seoPages.ts` with `publishStatus: 'published'`.
2. Create `apps/web/src/app/<slug>/page.tsx` that calls `buildMetadata` and
   renders `<SeoArticle page={…} />`.
3. Add the path to `robots.txt` (the sitemap picks it up automatically).
4. Run `npm run validate:seo` and `npm run audit:growth`.

## 7. Quality rules (anti-thin-content)

`npm run validate:seo` fails the build if a published page lacks a substantive
direct answer, fewer than 3 diagnosis steps, or fewer than 3 drills, or is
missing its route or robots entry. Keep drafts as drafts until they're real.
