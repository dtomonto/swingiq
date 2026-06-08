# Technical SEO Architecture — SwingVantage

How crawlability, canonicalization, sitemaps, and structured data are wired, and
how to extend them safely. This is the engineer-facing companion to the
owner-facing checklists in this folder.

Last reviewed: 2026-06-08.

---

## Source of truth: the curated URL registry

`apps/web/src/lib/seo/site-sections.ts` is the single source of truth for the
**curated, static** public pages that belong in the index (sport hubs, tools,
sample reports, methodology, benchmarks, partners, about/legal). Each entry is a
typed `CuratedUrl { path, label, section, priority, changeFrequency }`.

Two surfaces read from it so they can never drift apart:

| Surface | File | URL |
|---|---|---|
| XML sitemap | `apps/web/src/app/sitemap.ts` | `/sitemap.xml` |
| HTML sitemap | `apps/web/src/app/(marketing)/sitemap/page.tsx` | `/sitemap` |

**Dynamic** content is NOT in the registry — it is emitted from its own registry
so new items appear automatically and are never duplicated:

| Content | Registry |
|---|---|
| Programmatic SEO guides (incl. `/pickleball`, `/padel`) | `PUBLISHED_SEO_PAGES` — `@/content/seoPages` |
| Blog posts + `/blog` | `getPublishedBlogPosts()` — `@/data/blog-posts` |
| Challenges + `/challenges` | `CHALLENGES` — `@/content/challenges` |
| Library videos + `/learn` | `getLibraryItems()` — `@/lib/library` |
| Localized `/es`, `/fr` pages | `localizedRoutes()` — `@/lib/marketing-i18n` |

> Rule: a path lives in **exactly one** place. If it is emitted by a dynamic
> registry, it must NOT also be in `site-sections.ts`, or it appears twice in the
> sitemap. The test `lib/seo/__tests__/site-sections.test.ts` enforces this.

### Adding a page
- A new programmatic guide → add to `seoPages.ts` (it auto-appears in both sitemaps).
- A new blog post / challenge / library video → add to its registry.
- A new curated static page → add one `CuratedUrl` to `site-sections.ts`.

The honesty gate `scripts/check-sitemap-coverage.mjs` fails CI if a new public
`(marketing)` page is neither covered nor explicitly excluded, so nothing is
silently left out.

---

## Canonicalization

`apps/web/src/lib/seo/metadata.ts` → `buildMetadata({ path })` emits a
self-referencing canonical for every public page, plus hreflang alternates for
translated pages. `apps/web/src/config/site.ts` → `absoluteUrl()` is the reusable
URL builder; the canonical origin is `NEXT_PUBLIC_SITE_URL` (default
`https://swingvantage.com`) — never a hardcoded or preview host.

**Query parameters canonicalize automatically.** The canonical is rendered
statically from the clean `path`, so `…/golf-swing-analysis?utm_source=x` is
served with `<link rel="canonical" href="https://swingvantage.com/golf-swing-analysis">`.
No per-parameter handling is needed.

---

## Structured data (JSON-LD)

`apps/web/src/lib/seo/jsonLd.ts` provides type-safe builders: `organizationSchema`,
`websiteSchema`, `softwareApplicationSchema`, `articleSchema`, `faqPageSchema`,
`howToSchema`, `breadcrumbListSchema`, `serviceSchema`, and `buildGraph`. Render
with `<JsonLd>` (`components/seo/JsonLd.tsx`), which serializes via
`serialize-json-ld.ts` (escapes `<>&` + U+2028/U+2029 so a `</script>` in any
field cannot break out — the single safe serializer).

Policy: no fabricated ratings, reviews, awards, dates, or authors. Org/WebSite/
SoftwareApplication render on the homepage and each sport hub. `<Breadcrumbs>`
emits its own `BreadcrumbList`, so a page that renders breadcrumbs must NOT add a
second one to its graph (guarded by `seo.test.ts`).

---

## robots.txt

`apps/web/public/robots.txt` blocks the authenticated app surface, `/admin`, and
`/api/`, and references `https://swingvantage.com/sitemap.xml`. Programmatic-SEO
allows are directory-level (`/golf/`, `/tennis/`, …) so new guides need no edit.
Do not add a global `Disallow: /`, and never block a page that carries a
`noindex` (Google must crawl it to see the directive).

---

## Future: splitting the sitemap by type

Today one sitemap is correct — the whole site is far below Google's **50,000-URL
/ 50 MB per-file** limit. Because every curated URL already carries a `section`,
splitting later is mechanical:

1. Add `app/sitemaps/[section]/route.ts` that emits one section
   (`curatedUrlsBySection()[section]` + that section's dynamic registry, e.g.
   guides for a `guides` file, posts for `blog`).
2. Convert `app/sitemap.ts` into a `<sitemapindex>` listing each child sitemap.
3. Keep `Sitemap:` in robots pointing at the index.

Target structure when the time comes:

```
/sitemap.xml                 ← sitemap index
/sitemaps/pages.xml          ← curated 'main' + 'about' + 'legal'
/sitemaps/sports.xml         ← curated 'sports' + 'benchmarks'
/sitemaps/tools.xml          ← curated 'tools' + 'sample-reports'
/sitemaps/guides.xml         ← PUBLISHED_SEO_PAGES
/sitemaps/blog.xml           ← BLOG_POSTS
```

**Trigger:** split once any single section approaches a few thousand URLs, or the
combined sitemap nears ~40k URLs. Not before — premature splitting adds moving
parts with no benefit at current scale.

---

## Validation gates (run before shipping SEO changes)

| Command | Checks |
|---|---|
| `node scripts/check-sitemap.mjs` | every sitemap literal resolves to a real route (no 404s) |
| `node scripts/check-sitemap-coverage.mjs` | every public page is in the sitemap or explicitly excluded |
| `npm run validate:seo` | per-page SEO content validation |
| `npm --prefix apps/web test -- src/lib/seo` | registry + metadata + JSON-LD unit tests |
| `npm --prefix apps/web run type-check` | TypeScript |

Both sitemap gates scan **both** `app/sitemap.ts` and `lib/seo/site-sections.ts`.
