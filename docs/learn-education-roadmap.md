# SwingVantage `/learn` Education System — Build Roadmap & Handoff

**Last updated:** 2026-06-14 · **Status:** Tier 0–3 shipped — the `/learn` technology-education
hub is feature-complete. Merged to `master`: PR #67 (Tier 0), #77 (Tier 1), #85 (Tier 2 + 6 of
Tier 3, plus a non-destructive `/resources`→`/learn` `rel=canonical` consolidation), and #92
(`single-camera-swing-analysis`, the 7th Tier-3 page). **One** Tier-3 idea remains
**intentionally deferred**: `how-swingvantage-labels-data` (the DataSource-taxonomy page), held
back to avoid duplicating `/learn/measured-vs-estimated` and `/trust/accuracy-and-limitations`.
(Note: #85 originally dropped `single-camera-swing-analysis` too; #92 then shipped it with a
distinct 2D-pose/honesty angle, so it is **live**, not dropped.)

This doc lets a fresh session resume building the `/learn` technology-education hub
without re-discovery. It captures the architecture, the exact recipe to add a page,
the validation gates, and the prioritized backlog (Tier 2 + Tier 3) with drafted
slugs/titles/angles and duplicate-content cautions.

---

## 1. What already exists (do NOT rebuild)

**25 live pages**, all registry-driven, under `/learn/<slug>`:

Tier 0 (PR #67): `what-is-heuristic-data`, `ai-in-sports-performance`,
`heuristic-vs-ai-swing-analysis`, `how-retesting-improves-swing-feedback`,
`how-swingvantage-uses-player-profiles`, `future-of-ai-coaching-in-recreational-sports`.

Tier 1 (PR #77): `is-ai-swing-analysis-accurate`, `what-is-athlete-general-intelligence`,
`how-ai-swing-analysis-works`, `does-ai-replace-a-coach`, `how-to-film-your-swing`,
`measured-vs-estimated`, `how-to-read-your-swing-report`.

Tier 2 (PR #85): `ai-analysis-vs-private-lessons`, `what-transfers-between-sports`,
`ai-analysis-vs-launch-monitors`, `is-ai-swing-analysis-worth-it`, `how-often-should-you-retest`.

Tier 3 (PRs #85 + #92): `how-the-ai-coach-works`, `what-is-a-swing-fault`,
`what-data-swingvantage-uses`, `what-is-the-skill-tree`, `what-is-the-athlete-journey`,
`what-makes-a-good-practice-plan`, and `single-camera-swing-analysis` (#92).

Also live: `content/technologyClaims.ts` (centralized, legally-safe claim config),
`EducationalLink` component + term registry, and the `/learn` hub "How SwingVantage
thinks" section (auto-lists the registry).

## 2. Architecture — the files that matter

| Purpose | Path |
|---|---|
| **Article registry** (SEO/AEO/GEO source of truth) | `apps/web/src/lib/learn/tech-education.ts` |
| Page route (one folder per slug) | `apps/web/src/app/(marketing)/learn/<slug>/page.tsx` |
| Shared UI (AnswerLead, FaqSection, EduSection, EduCard, EduCardGrid, ComparisonTable, TrustCallout, CtaRow) | `apps/web/src/components/learn/education-ui.tsx` |
| Inline cross-link component + term registry | `apps/web/src/components/learn/EducationalLink.tsx`, `apps/web/src/lib/learn/educational-links.ts` |
| Claims config (safe data-scale language) | `apps/web/src/content/technologyClaims.ts` |
| Sitemap (XML + HTML) curated URLs | `apps/web/src/lib/seo/site-sections.ts` |
| Standards-enforcement test | `apps/web/src/lib/learn/__tests__/tech-education.test.ts` |
| Site-wide uniqueness/canonical gate (registry-aware) | `scripts/check-duplicate-content.mjs` |
| `/learn` hub (auto-lists registry) | `apps/web/src/app/(marketing)/learn/page.tsx` |

The hub section and the standards test BOTH iterate `TECH_EDUCATION_ARTICLES`, so a new
registry entry is auto-listed and auto-validated. You only hand-write: (a) the registry
entry, (b) the `page.tsx`, (c) one sitemap row.

## 3. Recipe to add ONE page

1. **Add a `TechEducationArticle` entry** to `TECH_EDUCATION_ARTICLES` in
   `lib/learn/tech-education.ts` with: `slug`, `title`, `heading`, `description`,
   `answerSummary`, `breadcrumbLabel`, `datePublished: PUBLISHED`, `dateModified: MODIFIED`,
   `faqs` (≥5 recommended).
2. **Create** `app/(marketing)/learn/<slug>/page.tsx`. Copy an existing Tier-1 page as a
   template (e.g. `how-ai-swing-analysis-works/page.tsx`). It must:
   - `const SLUG = '<slug>'; const article = getTechEducationArticle(SLUG)!;`
   - `export const metadata = buildTechEducationMetadata(SLUG);`
   - render `<JsonLd data={buildTechEducationGraph(SLUG)} />`, `<Breadcrumbs items={techEducationCrumbs(article)} />`,
     `<AnswerLead>{article.answerSummary}</AnswerLead>` right under the H1 (`article.heading`),
     a substantive bespoke body (3–5 `EduSection`s), `<TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>`,
     `<NotCoachReplacementNotice/>`, `<FaqSection faqs={article.faqs} />`, and a related-links nav.
   - Use `<EducationalLink term="heuristic-data" | "ai-sports">` for the FIRST meaningful
     instance of those terms only (no spammy density).
3. **Add a sitemap row** in `lib/seo/site-sections.ts` (`CURATED_URLS`), section `'methodology'`,
   `priority: 0.6, changeFrequency: 'monthly'`.
4. **Validate** (see §4). 5. Commit with explicit pathspecs; open PR; drive CI green; squash-merge.

## 4. Hard constraints (the strict SEO/AEO/GEO bar — enforced by test + gate)

- **Title**: rendered `<title>` = `"<title> | SwingVantage"` must be **15–70 chars**.
- **Description**: **70–175 chars**, unique site-wide.
- **answerSummary**: **80–340 chars**, self-contained (it's the AEO/GEO citable lead + Speakable target).
- **FAQs**: ≥2 (use 5–6); each question ends with `?`; each answer ≥40 chars.
- **No unverified scale claims**: never "millions of data points/users/athletes"
  (`DATA_SCALE_VERIFIED=false` in technologyClaims; gate + test both block it).
- **Distinct from existing pages** — titles/descriptions/answers must not near-duplicate
  (Jaccard ≥0.82 fails, ≥0.7 warns). Watch especially: `/methodology`
  ("Methodology — What SwingVantage Measures, Estimates, and Does Not"), `/how-it-works`
  ("How SwingVantage Works — AI Swing Analysis in 4 Steps"), `/athlete-general-intelligence`
  ("Athlete General Intelligence — Cross-Sport AI Engine"), `/pricing`, `/trust`, and the
  sport hubs (`/golf-swing-analysis` etc.). Do NOT make per-sport `/learn` analysis pages.
- Defensible tone: no guaranteed results, no medical/diagnosis language, coach-COMPLEMENT
  framing (never "replaces a coach").

## 5. Validation commands

```bash
# from repo root; build the workspace core first in a fresh container:
npx turbo run build --filter=@swingiq/core

cd apps/web
npx tsc --noEmit
npx eslint <changed files>
# private jest cache avoids concurrent-agent cache races:
npx jest tech-education --runInBand --cacheDirectory ./.jest-cache-te

# from repo root — the SEO/AEO/GEO + integrity gates:
node scripts/check-duplicate-content.mjs   # MUST show new pages with 0 warnings
node scripts/validate-links.mjs
node scripts/check-sitemap-coverage.mjs
npx turbo run build --filter=@swingiq/web  # new pages must prerender as ○ (static)
```
Pre-existing warnings to IGNORE (not ours): `/demo`, `/sample-report`,
`/tools/swing-tempo-trainer` description lengths; `/softball/*`, `/padel↔/pickleball`
title similarities.

## 6. LESSON LEARNED — do not touch the footer / shared i18n chrome

PR #67 added two footer links → two regressions: (a) new `footer.*` dict keys are CHROME
keys, so they gated EVERY localized page until blessed in
`apps/web/src/content/marketing/translation-manifest.generated.json` (fix:
`node scripts/i18n/upkeep.mjs --bless`); (b) a taller footer broke the committed Playwright
visual baselines on home/pricing/sample-report/trust. We reverted the footer entirely.
**Discovery of `/learn` pages is already covered by the hub section + sitemap + inline
cross-links — do NOT add footer links to ship education pages.** If footer changes are ever
required, bless i18n AND regenerate visual baselines (`npm run test:e2e:visual:update`).

> NOTE: the owner has separate in-flight edits to `PublicFooter.tsx` and `site-sections.ts`
> (adding `/deterministic-intelligence`, `/resources/...` links). Leave those alone unless asked.

## 7. Git / shipping flow

- Branch off latest `origin/master`. Develop, commit with **explicit pathspecs**
  (`git commit -m "..." -- path1 path2` — never `git add -A`; shared index).
- Revert any auto-modified `apps/web/next-env.d.ts` before committing.
- Open PR (base `master`), watch CI (`subscribe_pr_activity`), squash-merge once all
  required checks are green: type-check/lint/build, Jest, growth audit, security
  lint/typecheck, custom security checks, dependency audit.
- Commit trailers: `Co-Authored-By: Claude <noreply@anthropic.com>`, plus `Update:` /
  `Dev-Update:` one-liners for the auto-changelog.

---

## 8. Tier 2 — ✅ SHIPPED (PR #85)

All five shipped under section `'methodology'`. The original draft slug
`ai-analysis-vs-private-coach` shipped as **`ai-analysis-vs-private-lessons`**; the table below is
kept for historical reference (drafted angles + dup cautions).

| Slug | Title (`<title>` base) | Angle / intent | Dup cautions |
|---|---|---|---|
| `ai-analysis-vs-private-coach` | SwingVantage vs a Private Coach | Cost & value education for "ai analysis vs lessons"; link to `/pricing`, don't restate it | Keep distinct from `/pricing` and `does-ai-replace-a-coach` (that's the objection page; this is cost/value) |
| `what-transfers-between-sports` | What Transfers Between Sports? | Concrete transfer examples (golf↔tennis↔baseball); the AGI moat | Distinct from `/athlete-general-intelligence` and `what-is-athlete-general-intelligence` — lead with examples, not the engine |
| `ai-analysis-vs-launch-monitors` | AI Swing Analysis vs Launch Monitors | "do I need a launch monitor"; estimated vs measured framing | Reuse but don't duplicate `measured-vs-estimated` (that's about labels; this is a tool comparison) |
| `is-ai-swing-analysis-worth-it` | Is AI Swing Analysis Worth It? | Consideration-stage value/ROI | Distinct from `is-ai-swing-analysis-accurate` (accuracy) and the cost page |
| `how-often-should-you-retest` | How Often Should You Retest Your Swing? | Retest CADENCE/frequency how-to | Must differ from `how-retesting-improves-swing-feedback` (why) — this is when/how-often |

## 9. Tier 3 — ✅ SHIPPED (PRs #85 + #92), one deferred

Seven of the eight shipped: the first six in #85, and `single-camera-swing-analysis` in #92.
**`how-swingvantage-labels-data` is the single deferred item** (see its row + §10). Table kept
for reference.

| Slug | Title | Angle / intent | Dup cautions |
|---|---|---|---|
| `how-the-ai-coach-works` | How the AI Coach Works | Flagship feature, honest "what it won't do" | Distinct from `how-ai-swing-analysis-works` (pipeline) |
| `what-is-a-swing-fault` | What Is a Swing Fault? | Foundational concept; hub to fault ontology + `/learn/data-points` | — |
| `single-camera-swing-analysis` ✅ #92 | How Single-Camera Swing Analysis Works | Honesty/limits of 2D video | Distinct from `how-to-film-your-swing` and `is-ai-swing-analysis-accurate` |
| `what-data-swingvantage-uses` | What Data Does SwingVantage Use? | Data types + privacy-forward | Distinct from `how-swingvantage-uses-player-profiles` (personalization) |
| `what-is-the-skill-tree` | What Is the Skill Tree? | Progression feature explainer | — |
| `what-is-the-athlete-journey` | What Is the Athlete Journey? | Stages-of-improvement feature | — |
| `what-makes-a-good-practice-plan` | What Makes a Good Practice Plan? | "one plan" reinforcement; broad intent | — |
| `how-swingvantage-labels-data` ⏸️ DEFERRED | Why SwingVantage Never Fabricates Metrics | DataSource-label honesty pillar | **HIGH dup-risk with `measured-vs-estimated`** — only build with a clearly distinct angle (the DataSource taxonomy: real/estimated/imported/placeholder/mock), or drop |

## 10. Status & what's left

Tiers 0–3 are shipped and live; the `/learn` hub auto-lists them. The **only** remaining backlog
item is `how-swingvantage-labels-data` (§9), deliberately deferred because its DataSource-taxonomy
angle overlaps `/learn/measured-vs-estimated`. Build it only if a clearly distinct angle emerges
(real / estimated / imported / placeholder / mock as an explicit taxonomy); otherwise leave it
dropped. Any further page follows the same registry-driven recipe (§3); the standards test +
duplicate-content gate keep the bar.
