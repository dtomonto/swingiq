# Duplicate-Content & Originality Audit

## In Plain English (start here)

You asked: _"make sure 0% of the pages could be questioned as being a duplicate,
and that every page is fully original and SEO-compliant to the extreme standard."_

Here is the honest result:

- **Your content was already original.** I checked all **84 public pages** plus
  the **42 programmatic SEO landing pages**, comparing every page's title,
  description, and main answer against every other page. **Zero** were exact
  duplicates, and **zero** were even near-duplicates. The way the site is built —
  one shared template filled with hand-written, per-page content from a registry —
  is exactly what keeps pages from looking the same to Google.
- **I found and fixed 3 real problems** that *could* have made Google treat a page
  as a duplicate (these are about the invisible "this is the original" tag, called
  a **canonical**, not about the words on the page).
- **I tightened 30 titles/descriptions** that were too long and would have been
  cut off in Google results — so the site now also meets the stricter
  "extreme standard" you asked for.
- **I added an automatic guard** so this can never silently regress: a new check
  runs with the rest of the site's quality gates and **fails the build** if anyone
  ever ships a page that duplicates another or forgets a canonical tag.

You don't need to do anything. Everything below is the detail.

---

## What "duplicate" means here

Search engines penalize (or simply ignore) pages when they can't tell which
version is the "real" one. That happens three ways:

1. **Same words** — two pages with the same title, description, or body text.
2. **No canonical tag** — a page doesn't declare its own official URL, so Google
   guesses, and may fold it into another page.
3. **Inherited/generic metadata** — a page falls back to the site-wide default
   title/description instead of having its own, so it looks identical to others.

This audit covers all three.

## What I checked

A new script, [`scripts/check-duplicate-content.mjs`](../scripts/check-duplicate-content.mjs),
walks **every** `page.tsx` route and the three SEO content registries
(`seoPages.ts`, `seoPagesWedges.ts`, `seoPagesRacket.ts`). For every page that is
meant to be in Google (it skips `/admin`, the logged-in app, auth, API, and any
page marked `noindex`) it verifies:

| Check | Rule |
|-------|------|
| Unique title | No two indexable pages share a `<title>` |
| Unique description | No two share a meta description |
| Unique lead answer | No two SEO pages share their "Quick answer" block |
| No near-duplicates | Token-similarity below 82% for all of the above |
| Has metadata | Every indexable page sets its own title/description |
| Has a canonical | Every indexable page declares its own canonical URL |
| Length sanity | Titles ≤ 70 chars, descriptions ≤ 175 chars (warnings) |

## What I fixed

### Real duplicate-risk bugs (3)

1. **`/pricing`** — had a title and description but **no canonical tag**.
   Converted to the shared `buildMetadata()` helper, which adds the canonical,
   Open Graph, and Twitter tags automatically.
2. **`/parents`** — same issue (no canonical). Same fix.
3. **`/sports`** — an app-style "pick your sport" screen that had **no metadata of
   its own**, so it silently inherited the site-wide default title (making it look
   like a near-twin of the homepage) and had no canonical. It's already excluded
   from the sitemap on purpose, so I gave it its own `noindex` metadata via a new
   `sports/layout.tsx` — telling Google to stay on the real, unique sport hubs
   (`/golf-swing-analysis`, `/tennis-swing-analysis`, …) instead.

### Length / "extreme standard" tightening (30)

Google cuts off titles past ~60 chars and descriptions past ~160. I shortened
**8 titles** and **22 descriptions** that ran long — across the homepage,
features, how-it-works, benchmarks, about, faq, methodology, the sport-analysis
hubs, and several registry guides — without changing their meaning or keywords.
A handful of registry descriptions also shared a boilerplate tail
("…three drills to fix it, and a practice plan"); I varied those so the unique
part of each description stands out more.

The one deliberate exception is the **homepage title**, which names all four
primary sports for brand positioning (your call, per project notes). It's
documented as an allow-listed exception in the script — length only; it is **not**
exempt from any duplicate or canonical check.

## What I intentionally left alone

Five pages are **70–77% similar** to a sibling — for example
`/padel` vs `/pickleball`, the slow-pitch vs fast-pitch bat-speed guides, and
"hit the other way" (baseball) vs "hit backside" (softball). These are **not
duplicates**: they're different sports or disciplines that naturally share
vocabulary, with distinct titles, bodies, and target keywords. They sit well
below the 82% duplicate line and show up only as informational warnings to review
over time. Forcing them apart would hurt clarity, not help SEO.

## How it stays clean (the guard)

The check is wired into the existing growth-audit pipeline so it runs in CI and
fails the build on any regression:

```bash
npm run check:duplicate-content   # run it on its own
npm run audit:growth              # runs it alongside the other gates
```

There's also a unit test,
[`apps/web/src/content/__tests__/seoPages.unique.test.ts`](../apps/web/src/content/__tests__/seoPages.unique.test.ts),
that imports the real registry data and asserts uniqueness on every `npm test`.

**Current status:** ✅ 0 duplicate or canonical issues across 84 indexable pages +
42 SEO landing pages.
