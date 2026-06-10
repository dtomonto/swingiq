# ConnectorOS — SEO / AEO / GEO & Indexing

SwingVantage already has a strong technical-SEO base: a curated, self-maintaining
`app/sitemap.ts` (i18n/hreflang, lastmod, honesty-gated coverage), a JSON-LD battery
(`lib/seo/jsonLd.ts`), metadata helpers (`lib/seo/metadata.ts`), Google Search Console
verification (`NEXT_PUBLIC_GSC_VERIFICATION`), and `/admin/seo` + SearchIntelligenceOS.

ConnectorOS adds the two missing search-engine connectors — **Bing Webmaster
verification** and **IndexNow** — and documents the operating procedure.

## Search-engine verification

| Engine | Method | Env |
| --- | --- | --- |
| Google | HTML-tag meta (existing) | `NEXT_PUBLIC_GSC_VERIFICATION` |
| Bing | HTML-tag meta (new) | `NEXT_PUBLIC_BING_SITE_VERIFICATION` |

Render both as `<meta name="...">` via the root layout `metadata.verification` (or a
small helper in `lib/connector-os/seo/`). **Never hardcode** verification codes —
read from env so each environment verifies independently.

### Connect Google Search Console
1. GSC → add property (Domain or URL-prefix for `swingvantage.com`).
2. Choose **HTML tag**; copy only the `content="..."` token.
3. Set `NEXT_PUBLIC_GSC_VERIFICATION=<token>`, redeploy, click Verify.
4. Submit `https://swingvantage.com/sitemap.xml`.

### Connect Bing Webmaster Tools
1. Bing Webmaster Tools → add site (or import from GSC — fastest).
2. If verifying by meta: copy the token, set `NEXT_PUBLIC_BING_SITE_VERIFICATION=<token>`, redeploy, Verify.
3. Submit the same sitemap.

## IndexNow

IndexNow instantly pings Bing/Yandex (and partners) when URLs change — faster than
waiting for a crawl. Implemented in `lib/connector-os/seo/indexnow.ts`:

- A single `INDEXNOW_KEY` (a UUID-like string) hosted at
  `https://swingvantage.com/<INDEXNOW_KEY>.txt` (the key file simply contains the key).
- `submitUrls(urls)` POSTs the changed URLs to the IndexNow endpoint.
- Keyless-safe: with no `INDEXNOW_KEY`, the utility no-ops and reports `submitted:false`.

### Scripts
- `npm run seo:indexnow` — submit a set of URLs (high-value/new pages first).
- `npm run seo:validate` — validate sitemap + JSON-LD shape (delegates to existing
  `validate:seo` / `check:sitemap:coverage`).

### Key-file hosting
Expose the key file via a route (`app/[indexnowKey]/route.ts`) or a static public
file. Set `INDEXNOW_KEY_LOCATION` only to override the default
`https://<site>/<key>.txt` URL.

## What to submit first (IndexNow / GSC priority)

1. Sport hubs (golf, tennis, baseball, softball, pickleball, padel).
2. Free tool / sample-report pages.
3. New SEO content (fix pages, glossary, learn concepts, milestones).
4. Updates / developer updates.
5. Privacy / trust / parents / coach / team pages.

## What must NOT be indexed

- `/admin/*` (admin-only, `noindex`), `/api/*`, auth screens, thin/duplicate/private
  pages. Confirm `robots` denies `/admin` and `/api`. **No `robots.ts` route was
  found** — verify robots is served (static file or header) and that it disallows
  admin/api; add a `robots.ts` if missing (follow-up).

## Schema rules (reuse `lib/seo/jsonLd.ts`)

WebSite, Organization, SoftwareApplication, FAQPage, HowTo, Article/BlogPosting,
BreadcrumbList, VideoObject (where videos exist). Add `Product` **only** when paid
products launch; `SportsActivityLocation` only if genuinely applicable (it is not —
SwingVantage is software, not a venue). Validate before shipping new schema.

## Monthly SEO audit checklist

- [ ] GSC + Bing: coverage, indexed count, top queries, CWV.
- [ ] Run `npm run audit:growth` (sitemap coverage + duplicate-content gates).
- [ ] Submit new/updated URLs via `npm run seo:indexnow`.
- [ ] Confirm new pages have title/description/canonical/OG/Twitter + correct schema.
- [ ] Internal-linking graph: every new fix/drill/glossary page links to its sport hub.
