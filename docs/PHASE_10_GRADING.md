# Phase 10 — Golf Grading, Player Profiles & Benchmarks

## In Plain English (start here)

SwingVantage now grades your golf **against your own level**, not against tour
pros. There are seven profiles — **Beginner → Developing → Intermediate →
Advanced → Competitive → Elite → Professional** — and your sessions are graded
relative to what's expected at *your* level. So a developing player who strikes
it cleanly for their level sees a **B or A**, not an F.

After a diagnosis you'll see a **grade card**: an overall grade, a grade for each
part of your swing (face, path, strike, launch/spin, dispersion, consistency),
how you're moving versus your own recent average, and exactly **what reaching the
next level needs**. It always says which profile it graded you against — picked
automatically from your handicap (or skill level / data) — and you can change it
with one tap. Admins can tune the benchmarks at **/admin/benchmarks**.

---

## What changed (for engineers)

The scoring engine (`@swingiq/core`) produces absolute 0–100 dimension scores
with fixed A–F cutoffs. Phase 10 adds a **profile-aware grading layer** on top in
`apps/web/src/lib/grading/` (pure, then surfaced).

- `profiles.ts` — the 7 `GOLF_PROFILES` (handicap range, typical score,
  `expected` benchmark, description), the gradeable `GRADE_DIMENSIONS`,
  `defaultBenchmarks()` (profile × dimension table) and default weights.
- `classify.ts` — `inferGolfProfile({handicap, skillLevel, avgOverallScore})`
  → profile + confidence + basis (handicap > skill > data > default).
- `grade.ts` — `gradeSession({scores, profileId, benchmarks?, ownBaselineOverall?})`
  → per-dimension grades **relative to the benchmark** (`gradeFromDelta`: meeting
  it = B, +10 = A), overall, vs-profile (exceeding/meeting/below), vs the player's
  own baseline, next-level gaps, and a plain-language explanation.
- `useGolfProfile.ts` — active profile (confirmed in `settings.golf_profile`, else
  inferred). `benchmark-store.ts` — operator-tunable override (localStorage) +
  `useActiveBenchmarks()`; grading reads default ⊕ override.

### Surfaces
- `components/grading/GradeCard.tsx` on the `/diagnose` result: overall + per-
  dimension grades, the profile selector ("auto from your handicap" / "you set
  this"), vs-baseline, next-level "what unlocks", and an honest
  "graded against your level — not tour pros" badge.
- `/admin/benchmarks` (+ nav entry) — editable profile × dimension table; Save
  (local override + live preview), Reset, and **Copy as JSON** to commit a global
  default in `lib/grading/profiles.ts` (no benchmark backend — honest boundary).
- `AppSettings.golf_profile` stores the confirmed profile (synced; no new slice).

## Tests (11 new)
`lib/grading/__tests__/grading.test.ts`: profile ordering + next, handicap/skill/
data classification, relative grade cutoffs, and that the SAME score grades higher
for a beginner than a pro (the core guarantee). Full suite green (1679), tsc clean,
build passes (344 pages, /admin/benchmarks present).

## Not yet (future)
Per-profile benchmarks are uniform across dimensions by default (the admin table
refines them); a richer onboarding that asks the missing profile fields (typical
miss, scoring leak, practice frequency); auto-suggesting a profile move-up after a
run of exceeding sessions; grade history on the timeline.
