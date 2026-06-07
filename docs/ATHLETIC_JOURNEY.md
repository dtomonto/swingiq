# Athletic Journey Engine

## In Plain English (start here)

The **Athletic Journey** is a personalized roadmap that tells an athlete where
they are on the path from true beginner to professional-level performance, why
they're there, what's holding them back, and exactly what to do next.

It is **live for Golf and Tennis** today. Baseball, Fast-Pitch Softball, and
Slow-Pitch Softball are shown as **"In Development"** — visible on the roadmap,
with a waitlist, but never given fake scores.

It's honest by design:

- It never decides your stage from a single number. It blends your profile,
  optional rating, videos, logged play, and practice.
- Ratings (golf handicap, UTR, USTA/NTRP) are **optional**. The journey works
  with none of them, and self-reported data is always labeled as such.
- It says when it isn't sure ("provisional / early read") and turns missing data
  into the most useful next thing to add.
- It never guarantees you'll go pro, and none of it is medical advice.

Nothing is sent anywhere — it runs on the device from data the app already has,
plus a few optional inputs you can type in.

Open it at **`/journey`** (also linked in the sidebar as "Athletic Journey").

---

## What it does

For a golfer or tennis player the engine produces a full development dashboard:

1. **Current stage** (e.g. `G4: Bogey Golfer` / `T3: Improving Club Player`) with
   a **confidence** level.
2. **Why you're here** — strengths, development gaps, and contradictory evidence.
3. **Rating / handicap alignment** — whether your game profiles above, with, or
   below your optional rating, and the category driving the gap.
4. **Journey Momentum (0–100)** — development *activity & velocity*, not skill.
5. **Journey map** — the full beginner→professional pathway with your position.
6. **Skill tree** — sport-specific branches with scores + a 1–5 self-rating.
7. **Milestones** — stage-specific, measurable, auto-tracked where possible.
8. **Missing-data prompts** — the highest-value inputs to add next.
9. **Weekly practice prescription** — weakness-aware, injury-safe blocks.
10. **History** — how stage and momentum have trended over time.
11. **AI coach read** — a structured, safe narrative of all of the above.

## Architecture

Mirrors the existing AGI/BodySync precedent: a pure, framework-agnostic engine
plus thin app glue and a self-contained local store.

```
apps/web/src/lib/athletic-journey/
  types.ts                 all types + enums
  util.ts                  small pure math helpers
  config/
    thresholds.ts          every tuning number (no magic numbers in logic)
    sports.ts              SportAvailability (live vs in-development)
    golf.ts                11 golf stages, branches, weights, prompts, hcp→stage
    tennis.ts              11 tennis stages, branches, weights, prompts, UTR/NTRP→stage
    index.ts               config barrel + lookups
  classify.ts              multi-signal stage classifier + confidence
  momentum.ts              Journey Momentum + regression risk
  rating.ts                optional rating alignment + validation
  missing-data.ts          ranked missing-data recommendations
  milestones.ts            milestone evaluation against data
  prescription.ts          weekly practice plan (injury-aware)
  narrative.ts             structured narrative builder + LLM-output validator
  engine.ts                buildJourneyDashboard() orchestrator (pure)
  index.ts                 public barrel
  store.ts                 self-contained reactive localStorage (journey-only inputs)
  adapters/
    from-store.ts          main store (read-only) → JourneySignals
    useAthleticJourney.ts  React hook
  __tests__/               unit + SSR-smoke tests

apps/web/src/components/athletic-journey/   premium UI
apps/web/src/app/(app)/journey/page.tsx     the route
apps/web/src/app/api/athletic-journey/narrative/route.ts   optional AI re-word
```

### Why a self-contained store?

The journey reads the **main app store read-only** (profile, sessions, video
analyses, daily notes, training). The *new* inputs it owns — optional ratings,
self-assessments, milestone completions, sport interest, profile extras, and the
history timeline — live in their own localStorage key
(`swingvantage_athletic_journey_v1`). This avoids touching the shared store
schema (which several agents edit) and follows the AGI `history.ts` precedent.
It can later be account-synced via a doc mirror exactly like BodySync.

## Classification (never one metric)

`classifyPlayerStage()` blends up to three **sources**, renormalizing weights
over whatever is present and lowering confidence when sources are missing:

| Source | Weight | Notes |
| --- | --- | --- |
| Optional rating | 0.5 | handicap / UTR / NTRP → guidepost stage order |
| Self-report | 0.3 | skill level, competition level, golf typical score (capped low) |
| Performance | 0.2 | weighted category scores from videos/metrics/self-assessments |

Per-sport **category weights** (sum 1.0) drive the performance index and the
"priority weakness":

- **Golf** — scoring 25, technique 25, consistency 15, finesse 15, practice 10,
  tactical 5, competitive 5.
- **Tennis** — scoring 25, technique 25, finesse 15, movement 15, tactical 10,
  practice 5, mental 5.

**Guardrails:** elite (order ≥ 9) requires real competitive evidence;
professional (order 10) requires a *verified* signal. Self-report alone can
never reach elite/pro. Confidence bands: `high / medium / low / provisional`.

## How optional ratings are handled

- **Golf handicap** — USGA scale, plus handicaps are negative, max index 54.0.
  `golfHandicapToOrder()` maps it to a stage guidepost only.
- **Tennis UTR** — 1.00–16.50. **USTA/NTRP** — 1.5–7.0. Both optional; UTR is the
  primary when both are present.
- Ratings carry a **source** (`self_reported / coach_entered / imported /
  verified / estimated`). Self-reported values are never presented as verified,
  and the alignment explanation appends a caveat.
- `compareRatingAlignment()` returns `above / aligned / below / unknown` with a
  specific, honest explanation naming the driving category.

## In-development sports

`config/sports.ts` is the single source of truth. Baseball / Fast-Pitch /
Slow-Pitch have `journeyEnabled: false` and **no stage config**, so the engine
*cannot* produce a score for them — it throws if asked, and the UI shows a
premium locked card (Notify / Join waitlist / Create basic profile) instead.
Interest is captured locally. To activate a sport later: add a
`config/<sport>.ts` (stages, branches, weights, prompts, rating mapping),
register it in `config/index.ts`, and flip `journeyEnabled` + status to
`available`.

## Optional AI narrative

The structured narrative in `narrative.ts` is **deterministic and is the source
of truth**. `POST /api/athletic-journey/narrative` can ask a configured provider
to *re-word* it more naturally; the result must pass `validateNarrative()`
(structure intact, no guarantees/hype) or the deterministic base is returned.

- **Keyless by default**: with no `AI_PROVIDER` configured the route echoes the
  deterministic narrative unchanged — **no spend**.
- The "Refine wording" button is **off by default**. Enable it with
  `NEXT_PUBLIC_JOURNEY_AI_REWORD=1` and a server-side provider key.

## Analytics

Events (in `@swingiq/core` `ANALYTICS_EVENTS`): `athletic_journey_viewed`,
`journey_sport_selected`, `journey_stage_viewed`, `journey_stage_calculated`,
`journey_confidence_changed`, `journey_momentum_changed`, `journey_rating_added`,
`journey_handicap_added`, `journey_missing_data_clicked`,
`journey_practice_viewed`, `journey_milestone_completed`,
`journey_in_development_viewed`, `journey_waitlist_joined`,
`journey_basic_profile_created`, `journey_recalculated`.

## Safety

- No guaranteed outcomes; estimates are labeled; verified ≠ self-reported.
- Injury notes lower practice volume + add a safety note (no diagnosis).
- Per-user local data; the engine never crosses users.

## Testing

`npm test -- src/lib/athletic-journey` — unit tests for the classifier (incl.
elite/pro guardrails and no-rating paths), momentum, rating alignment, sport
availability, milestones, the store adapter, plus an SSR smoke test that renders
the whole UI tree and an in-development card without throwing.

## Manual steps

**None required** — the feature is local-first and ships working. Optional:
configure a provider + `NEXT_PUBLIC_JOURNEY_AI_REWORD=1` to enable AI re-wording;
later, mirror `swingvantage_athletic_journey_v1` into Supabase for cross-device
sync (same pattern as BodySync).
