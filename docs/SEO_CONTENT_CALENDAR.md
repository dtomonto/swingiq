# SwingIQ SEO Content Calendar — Researched Cluster Backlog

_Last updated: June 2026 · Companion to [`SEO_CONTENT_PLAN.md`](SEO_CONTENT_PLAN.md) (the how) and `apps/web/src/content/seoPages.ts` (the registry)._

---

## 📘 In Plain English (start here)

This is the **prioritized list of pages to build**, grounded in real search
demand (researched June 2026 — sources at the bottom). The weekly
`seo-content-production` scheduled task pulls the next items from the top of each
list, writes full pages, and commits them locally for you to review and push.

**Why these:** people search their *frustration*, not "AI swing analysis." Each
page below answers one painful, high-volume question and routes the reader into
the matching SwingIQ tool — which is how views turn into habit, and habit turns
into ad impressions (see `SEO_CONTENT_PLAN.md`).

**Status legend:** `[ ]` not built · `[x] ` live · `[~]` draft in registry.

---

## How each page is built (the exact pattern)

Every published page is **two files**:

1. **Registry entry** — a `SeoPage` object appended to the `SEO_PAGES` array in
   `apps/web/src/content/seoPages.ts`, `publishStatus: 'published'`, filling every
   field of the `SeoPage` interface using the AEO/GEO format (direct answer →
   explanation → self-diagnosis → what SwingIQ checks → drills → mistakes → when
   to see a coach → 3–6 FAQs → related links → CTA → schema → safety notes).
2. **Route file** — `apps/web/src/app/(marketing)/<slug>/page.tsx`, copying the
   proven 18-line pattern (see `golf/fix-slice/page.tsx`):
   ```tsx
   import { buildMetadata } from '@/lib/seo/metadata';
   import { SeoArticle } from '@/components/seo/SeoArticle';
   import { getPublishedSeoPage } from '@/content/seoPages';
   const SLUG = '<slug>';
   const page = getPublishedSeoPage(SLUG)!;
   export const metadata = buildMetadata({ title: page.title, description: page.metaDescription, path: `/${SLUG}`, ogType: 'article', keywords: [page.keyword] });
   export default function Page() { return <SeoArticle page={page} />; }
   ```
3. **Sitemap** — confirm the new slug is emitted by `apps/web/src/app/sitemap.ts`
   (add it if the sitemap doesn't auto-derive from `PUBLISHED_SEO_PAGES`).

**Quality gate (non-negotiable):** no thin pages; keep SwingIQ's honest
"heuristic estimate" framing and disclaimers; keep youth-safety notes; plain
English; every page links to 2–3 related pages + 1 benchmark page and ends with a
CTA into the matching tool.

---

## Already live — do NOT rebuild

- **golf:** fix-slice, why-do-i-slice-my-driver, stop-topping-the-ball,
  high-handicap-swing-analysis, launch-monitor-analysis, practice-at-home
- **baseball:** exit-velocity-drills, youth-hitting
- **softball:** how-to-hit-line-drives, slow-pitch-power, stop-popping-up
- **tennis:** backhand-basics, forehand-analysis

---

## GOLF — highest search volume → build 2:1 vs. other sports

Slice + topping are covered; the biggest remaining gaps are the *root causes* and
the other big misses:

- [x] `golf/stop-coming-over-the-top` — "how to stop coming over the top" (the root cause behind most slices/pulls — huge volume) → CTA: Analyze / Fix Stack ✅ published 2026-06-03
- [x] `golf/how-to-fix-a-hook` — "how to fix a hook / stop hooking the ball" ✅ published 2026-06-03
- [x] `golf/stop-hitting-it-fat` — "how to stop hitting fat shots / chunking irons" ✅ published 2026-06-03
- [ ] `golf/stop-thin-shots` — "how to stop hitting thin shots"
- [ ] `golf/inconsistent-driver-distance` — "why is my driver distance inconsistent / low smash factor" → links /benchmarks + launch-monitor-analysis
- [ ] `golf/how-to-shallow-the-club` — "how to shallow the golf club"
- [ ] `golf/stop-pulling-the-ball` — "how to stop pulling the golf ball / two-way miss"
- [ ] `golf/good-swing-speed-by-age` — "what is a good swing/ball speed for my age" → links /benchmarks

## BASEBALL

- [x] `baseball/stop-rolling-over` — "how to stop rolling over / weak ground balls" (top youth search) ✅ published 2026-06-03
- [ ] `baseball/exit-velocity-by-age` — "exit velocity by age — is my exit velo good?" (very high volume) → links /benchmarks
- [ ] `baseball/use-your-lower-half` — "stop swinging with just your arms / hit with more power"
- [ ] `baseball/fix-bat-drag` — "bat drag / casting fix"
- [ ] `baseball/stop-popping-up` — "how to stop popping up in baseball"
- [ ] `baseball/late-on-fastballs` — "always late on fastballs / hitting timing drills"

## SOFTBALL (slow + fast pitch)

- [x] `softball/how-to-hit-slow-pitch` — "how to hit a slow pitch softball" (timing: don't decelerate mid-swing) ✅ published 2026-06-03
- [ ] `softball/hit-faster-pitching` — "how to hit faster pitching / reaction time" (fast pitch)
- [ ] `softball/stop-hitting-ground-balls` — "stop hitting ground balls / drive the ball"
- [ ] `softball/hit-the-riseball` — "how to hit a riseball / drop ball" (fast pitch)

## TENNIS

- [x] `tennis/tennis-grips-explained` — "tennis grips: forehand, backhand & serve" (foundational, high volume) ✅ published 2026-06-03
- [ ] `tennis/forehand-into-the-net` — "why do I hit my forehand into the net"
- [ ] `tennis/add-topspin-forehand` — "how to hit topspin on your forehand"
- [ ] `tennis/serve-toss-consistency` — "consistent serve toss / why is my serve inconsistent"
- [ ] `tennis/one-vs-two-handed-backhand` — "one-handed vs two-handed backhand"
- [ ] `tennis/backhand-power` — "why is my backhand weak / no power (hip rotation)"

---

## Launch sequence (weekly batches of 2, golf-weighted)

The `seo-content-production` task builds the next 2 unbuilt items each week. Suggested order:

| Week | Page A | Page B |
|---|---|---|
| 1 | golf/stop-coming-over-the-top | baseball/stop-rolling-over |
| 2 | golf/how-to-fix-a-hook | tennis/tennis-grips-explained |
| 3 | golf/stop-hitting-it-fat | softball/how-to-hit-slow-pitch |
| 4 | golf/inconsistent-driver-distance | baseball/exit-velocity-by-age |
| 5 | golf/stop-thin-shots | tennis/forehand-into-the-net |
| 6 | golf/how-to-shallow-the-club | softball/hit-faster-pitching |
| 7 | golf/stop-pulling-the-ball | baseball/use-your-lower-half |
| 8 | golf/good-swing-speed-by-age | tennis/serve-toss-consistency |
| 9+ | continue down each list (golf-weighted), then refresh page-2 rankers |

Adjust priorities each month using **real** Search Console "Queries" data once
analytics + GSC are live — measured demand beats this initial research.

---

## Research sources (June 2026)

- **Golf:** [HackMotion — 11 common swing mistakes](https://hackmotion.com/common-golf-swing-mistakes/), [MyGolfSpy — 10 common mistakes](https://mygolfspy.com/news-opinion/instruction/the-10-most-common-golf-swing-mistakes-and-how-to-fix-them/), [Golf.com — high-handicap mistakes](https://golf.com/instruction/10-bad-golf-swing-mistakes-high-handicappers-make/), [The Left Rough — amateur faults](https://theleftrough.com/common-amateur-golf-swing-faults/)
- **Baseball:** [Bat Digest — exit velo by age](https://batdigest.com/resources/exit-velocity-by-age/), [Grip Boost — exit velo by age](https://www.gripboost.com/blogs/news/exit-velo-by-age), [GoRout — youth hitting drills](https://gorout.com/youth-baseball-hitting-drills/), [Hitting Performance Lab](https://hittingperformancelab.com/josh-donaldson-ball-exit-speed/)
- **Softball:** [SportsRec — stop popping up (slow pitch)](https://www.sportsrec.com/7383087/how-to-stop-popping-up-at-slow-pitch-softball), [Pine Tar Press — how to hit a slow pitch](https://pinetarpress.com/how-to-hit-a-slow-pitch-softball/), [Discuss Fastpitch — pop-ups & slow pitching](https://www.discussfastpitch.com/threads/hitting-to-many-pop-ups.19634/)
- **Tennis:** [Four Seasons Tennis — 5 forehand mistakes](https://fourseasonstennis.com.au/5-common-forehand-mistakes-tennis-players-make/), [Tenis Estepona — backhand mistakes](https://www.tenisestepona.com/en/common-tennis-backhand-mistakes-how-to-fix-them/), [FeelTennis — two-handed backhand errors](https://www.feeltennis.net/tennis-two-handed-backhand-errors/), [Teachme.to — rookie mistakes](https://teachme.to/blog/tennis/common-rookie-tennis-mistakes)
