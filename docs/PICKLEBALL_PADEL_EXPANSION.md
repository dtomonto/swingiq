# Pickleball & Padel Expansion

## 📘 In Plain English (start here)

**What this is:** SwingVantage now supports **two new racket sports — Pickleball and Padel — as first-class sports**, alongside golf, tennis, baseball, slow-pitch softball, and fast-pitch softball. That's **seven supported sports** total.

**Why it matters:** Pickleball and Padel are two of the fastest-growing sports in the world. They are treated as their own sports here — *not* as "small-court tennis" (pickleball) or "tennis with walls" (padel). Each has its own stroke mechanics, AI analysis, drills, player profile, athletic journey, SEO pages, and blog content.

**What you (the owner) need to do:** Nothing to make it work — it runs with the existing setup. To make the two new pillar pages (`/pickleball`, `/padel`) and their guides show up in Google, just deploy as usual; they're already in the sitemap. If you want to feature them more prominently on the homepage, see "Promoting to homepage cards" below.

---

## New product positioning

> SwingVantage is an AI-powered multi-sport swing, movement, and performance platform built for **golf, tennis, pickleball, padel, baseball, slow-pitch softball, and fast-pitch softball.**

Sports are organized into three families (used across nav, content strategy, and data):

| Family | Sports |
|---|---|
| **Club Sport** | Golf |
| **Racket Sports** | Tennis, Pickleball, Padel |
| **Bat Sports** | Baseball, Slow-Pitch Softball, Fast-Pitch Softball |

**Display order everywhere:** Golf → Tennis → Pickleball → Padel → Baseball → Slow-Pitch Softball → Fast-Pitch Softball.

## Single source of truth

The canonical sports list lives in **`packages/core/src/sports/types.ts`**:

- `SportId` — the typed union (`'golf' | 'tennis' | 'pickleball' | 'padel' | 'baseball' | 'softball_slow' | 'softball_fast'`).
- `SPORT_TAXONOMY` — ordered list of every sport with its `category` (`club_sport | racket_sport | bat_sport`) and `status` (`supported`).
- Helpers: `getSportsByCategory()`, `getSportTaxonomy()`, `SPORT_CATEGORY_LABELS`.

Adding a future sport = add it to `SportId` + `SPORT_TAXONOMY`, then let the TypeScript compiler point you at every exhaustive `Record<SportId, …>` map that needs an entry. That is exactly how this expansion was built.

## What each new sport includes

### Pickleball (compact paddle mechanics + the kitchen)
- **Stroke model** (`packages/core/src/sports/pickleball/`): 7 phases (ready → split step → compact prep → forward swing → contact → follow-through → recovery), an issue lexicon (popped dinks, netted third drops, speed-up errors, late volleys, kitchen footwork…), 10 drills, segmented benchmarks, and a heuristic analysis engine.
- **AI**: dedicated AI Coach system prompt + a pickleball entry in the vision model's per-sport focus (compact stroke, paddle-face control, the non-volley zone). The AI is explicitly told pickleball is **not** small-court tennis.
- **Player profile** (`sport-profiles.ts` + `SportProfileForms.tsx`): dominant/paddle hand, optional DUPR, self-rating (2.0–5.0+), singles/doubles, court side, paddle style, common miss, goals, paddle equipment.
- **Athletic Journey** (`lib/athletic-journey/config/pickleball.ts`): 10 stages (PB0 New Player → PB9 Professional-Caliber), DUPR-anchored, with branches (serve/return, third shot, dinking, resets, volleys, footwork, doubles strategy, mental, match play).
- **SEO**: `/pickleball` (pillar), `/pickleball-third-shot-drop`, `/pickleball-dinking` published; video-analysis, practice-plan, drills, serve-analysis, DUPR-improvement prepared as drafts.
- **Blog**: "The Pickleball Third-Shot Drop: A Beginner-to-3.5 Guide".

### Padel (wall/glass play + doubles net control)
- **Stroke model** (`packages/core/src/sports/padel/`): 7 phases (ready → split step → **wall read** → preparation → contact → follow-through → recovery), an issue lexicon (weak bandeja, overhit smash, poor wall read, late after glass, partner spacing…), 9 drills, segmented benchmarks, and a heuristic analysis engine.
- **AI**: dedicated AI Coach system prompt + a padel entry in the vision model's per-sport focus (overhead family, glass play, net control). The AI is explicitly told padel is **not** tennis with walls.
- **Player profile**: dominant/racket hand, optional club/league rating, level, court side (deuce/advantage/flexible), style (defensive wall, net attacker, lob strategist, power smasher, bandeja specialist), common miss, goals, racket equipment.
- **Athletic Journey** (`lib/athletic-journey/config/padel.ts`): 10 stages (PD0 New Player → PD9 Professional-Caliber). Padel has **no universal numeric rating**, so stage is estimated from video + match logs + practice (honest by design); club/league rating is captured as optional context.
- **SEO**: `/padel` (pillar), `/padel-bandeja`, `/padel-wall-rebound-technique` published; vibora, serve-analysis, video-analysis, practice-plan, drills, doubles-strategy prepared as drafts.
- **Blog**: "The Padel Bandeja Explained: How to Hold the Net".

## SEO / AEO / GEO

- **Published pillar pages** are routed (`app/(marketing)/pickleball`, `/padel`, etc.) and auto-listed in `app/sitemap.ts` via `PUBLISHED_SEO_PAGES`.
- **Registry**: `content/seoPagesRacket.ts` (mirrors the `seoPagesWedges.ts` pattern) holds all pickleball/padel pages; `RACKET_PAGES` is spread into `SEO_PAGES`. Promote a `draft` to `published` and add a matching `page.tsx` to ship a new page.
- **Benchmarks**: `/benchmarks/pickleball` and `/benchmarks/padel` (data in `data/benchmarks.ts`, also in the sitemap).
- **Personas / content strategy**: `content/sportStrategy.ts` adds pickleball & padel as `secondary` tier (indexed, in nav/footer). Promote to `primary` to add a homepage persona card.

### Weekly SEO build cycle (recommended sport mix)

Balance the rotation so no single sport dominates. Target distribution per cycle:

| Golf | Tennis | Pickleball | Padel | Baseball | Slow-Pitch | Fast-Pitch |
|---|---|---|---|---|---|---|
| ~20% | ~15% | ~15% | ~15% | ~15% | ~10% | ~10% |

Generate pages by sport × intent (skill level, shot type, common mistake, practice goal, equipment, rating goal, persona). The prepared draft slugs in `seoPagesRacket.ts` are the pickleball/padel backlog to work through.

### Blog cycle

Recurring pickleball/padel content (technique, strategy, mistake-fix, beginner guides, AI/video-analysis, rating improvement). Use the same recommended mix as the SEO cycle. Two seed posts shipped (third-shot drop; bandeja).

## Promoting to homepage cards

Pickleball and Padel ship as **secondary** personas (indexed, in nav/footer, in the sitemap) to avoid disturbing the current homepage hero layout. To feature either as a homepage persona card, change its `tier` from `'secondary'` to `'primary'` in `content/sportStrategy.ts` and redeploy.

## Honest-by-design notes

- All new analysis is **heuristic/estimated** (no ML model runs for these sports yet) and is labeled as such — consistent with the other sports.
- Pickleball/padel benchmarks are evidence-informed **estimates and video quality scores**, not radar measurements (confidence: medium-low). This is stated in the data and copy.
- Padel deliberately uses **no fake numeric rating**; the journey is data-driven.

## Remaining / next improvements

- Promote the prepared draft SEO slugs to published pages (add `page.tsx` for each).
- Optional: add pickleball/padel professional reference swings to `compare` and seed Motion Lab taxonomy entries.
- Optional: pickleball/padel-specific equipment scoring (paddles) in `lib/equipment`.
- Optional: localize new copy (i18n) and add tutorial-center videos for the new sports.
