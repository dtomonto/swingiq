# Duplicate & Cannibalization Report — SwingVantage

Audited: 2026-06-08. Scope: public, indexable routes (marketing pages,
programmatic SEO guides `PUBLISHED_SEO_PAGES`, blog posts `BLOG_POSTS`, tools).

**Headline finding:** there is meaningful **blog ↔ guide cannibalization**. Several
blog posts mirror a programmatic SEO guide on the *same keyword intent*, in a few
cases with a **near-identical or identical title**. Exact-duplicate gates do not
catch this because the pairs live in *different registries* (`blog-posts.ts` vs
`seoPages.ts`) and are near-duplicates, not byte-identical.

> No within-registry exact duplicate titles/descriptions were found (those were
> previously audited to zero and are guarded by `npm run validate:seo` /
> `npm run validate:content`). This report covers the *cross-registry* overlap
> those gates don't see.

---

## Policy

For each pair, the **programmatic guide is the canonical keyword target**: it uses
the AEO/GEO format with `HowTo`/`FAQPage` schema and sits in the sport-hub silo
(`RelatedGuides` + breadcrumbs). The blog post should either be **differentiated +
cross-linked**, or **canonicalized / noindexed / merged** into the guide.

**All merge/canonical/noindex/remove decisions are `REQUIRES OWNER DECISION`** —
they are reversible content calls, and we do not delete or de-index real content
without sign-off (per the task's own guardrail). Nothing here was auto-applied.
Recommended *safe* fix in every case: keep both, ensure the blog post links to the
guide with a descriptive (non-exact-match) anchor, and give them distinct angles.

---

## High severity — near-identical title AND intent

| Blog post | Competing guide | Recommendation |
|---|---|---|
| `/blog/how-to-stop-topping-the-golf-ball` — "How to Stop Topping the Golf Ball" | `/golf/stop-topping-the-ball` — *identical title* | **REQUIRES OWNER DECISION.** Guide wins (HowTo schema, hub silo). Either canonicalize blog → guide, or rewrite the blog as a narrative/case-study angle and link to the guide. |
| `/blog/how-to-fix-a-golf-slice` — "How to Fix a Golf Slice: The 5 Most Common Causes" | `/golf/fix-slice` — "How to Fix a Golf Slice (Beginner-Safe Guide)" | **REQUIRES OWNER DECISION.** Differentiate (blog = "5 causes" explainer that links to the guide for the fix) or canonicalize. |
| `/blog/slow-pitch-softball-stop-popping-up` — "Slow-Pitch Softball: How to Stop Popping Up" | `/softball/stop-popping-up` — "How to Stop Popping Up in Softball" | **REQUIRES OWNER DECISION.** Same intent; pick one primary, cross-link the other. |
| `/blog/how-to-stop-rolling-over-in-baseball` — "How to Stop Rolling Over Pitches in Baseball" | `/baseball/stop-rolling-over` | **REQUIRES OWNER DECISION.** Same intent; pick one primary. |
| `/blog/pickleball-third-shot-drop-guide` — "The Pickleball Third-Shot Drop…" | `/pickleball-third-shot-drop` | **REQUIRES OWNER DECISION.** Same topic; guide is the silo page. |
| `/blog/padel-bandeja-explained` — "The Padel Bandeja Explained…" | `/padel-bandeja` | **REQUIRES OWNER DECISION.** Same topic; guide is the silo page. |

## Medium severity — overlapping intent, different angle possible

| Blog post | Competing guide(s) | Recommendation |
|---|---|---|
| `/blog/how-to-read-launch-monitor-data` | `/golf/launch-monitor-analysis` | Differentiate: blog = "how to read the numbers", guide = "what to fix". Cross-link both ways. |
| `/blog/baseball-exit-velocity-guide` | `/baseball/exit-velocity-drills` | Blog = concept/explainer, guide = drills. Keep both, link blog → guide. |
| `/blog/tennis-forehand-technique-basics` + `/blog/how-to-fix-a-late-forehand` | `/tennis/forehand-analysis` | Three forehand pages. Keep the guide primary; ensure each blog targets a distinct sub-intent (fundamentals vs. late-contact fix) and links to the guide. |
| `/blog/softball-bat-path-and-launch-angle` | `/softball/bat-path-mistakes`, `/softball/best-launch-angle-slow-pitch` | Blog is a broad explainer over two narrower guides — good hub-and-spoke if the blog links to both. Confirm anchors are descriptive. |

## Low severity — monitor only

| Pages | Note |
|---|---|
| `/blog/practice-schedule-for-golfers` · `/golf/practice-at-home` · `/tools/practice-plan-generator` | Distinct **formats** (article / how-to / interactive tool). Differentiation is clear; ensure they cross-link. |
| `/tools/golf-slice-fixer` (quiz) vs the two slice pages above | Tool is a distinct interactive format — not cannibalizing; it should link to `/golf/fix-slice`. |
| `/blog/what-is-smash-factor` | Sub-topic of `/golf/launch-monitor-analysis`; fine as a supporting article that links up. |
| `/blog/how-ai-swing-analysis-works` | Editorial; complements `/how-it-works` + `/methodology`. No conflict. |

---

## Action for the XML sitemap (per task rule G5)

The sitemap currently lists **all** published blog posts (auto-derived from
`BLOG_POSTS`). Until the High-severity pairs are resolved, the owner should decide,
per pair, one of:

1. **Keep + differentiate** (preferred when the blog adds a genuinely distinct
   angle) — no code change; just cross-link.
2. **Canonicalize blog → guide** — set the blog post's canonical to the guide URL
   (the blog stays live but consolidates ranking signals to the guide).
3. **Noindex the blog post** — add a `noindex` flag so it leaves the index (and
   should then be dropped from the sitemap).
4. **Merge / redirect** blog → guide (strongest consolidation; least content).

Implementation levers (when a decision is made):
- Blog metadata is built in the blog route via `buildMetadata(...)`; pass
  `noindex: true` to de-index, or set a custom canonical there.
- To drop a post from the sitemap, filter it in `getPublishedBlogPosts()` /
  the blog registry — the XML + HTML sitemaps update automatically.

No destructive change was made. This report is the deliverable for owner review.
