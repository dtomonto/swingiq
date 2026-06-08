# Phase 6 + 7 — Shot-Intent Classifier & Athlete Priority Engine

## In Plain English (start here)

**Phase 6 — SwingVantage figures out what kind of shot you hit.** You no longer
have to tell it "that was a half wedge" or "that was a ¾ 7-iron." When you
import a session, each shot is automatically labelled — chip, pitch, half,
three-quarter, full, punch — or flagged as a mishit — by comparing its carry to
*your own* full-swing distance for that club. It's personal: a 90-yard pitching
wedge might be a half shot for one player and nearly full for another. The
import preview now shows the mix ("12 full · 4 ¾ · 2 mishit").

**Phase 7 — your priority comes from everything, not one bad range day.** The
dashboard now shows a synthesized **"Your #1 priority"** built from *all* your
sessions at once. It weights each issue by how **severe**, how **recent**, and
how **often** it shows up — so one ugly session can't hijack your plan, and a
fault you keep repeating rises to the top. It tells you how the priority is
trending (new / persisting / easing / worsening), **what changed** since last
time, and **what data would sharpen it** (e.g. "import club + face data", "upload
a video"). Each priority links straight to a practice plan.

---

## What changed (for engineers)

### Phase 6 — `lib/shot-intent/`
- `baselines.ts`: `buildBaselineResolver(sessions, bagCarryByName)` resolves each
  club's full-shot carry from the player's OWN data (80th-percentile of that
  club's carries, ≥4 shots) → bag carry → generic provisional benchmark. Baseline
  source drives classification confidence.
- `classify.ts`: `classifyShotIntent(shot, baseline)` → intent + `SwingType` +
  `isOutlier` + confidence + ratio, using carry/baseline ratio buckets plus
  strike sanity checks (mishit on implausibly short long-clubs / poor smash;
  flier outlier; punch on low launch + reduced carry). Thresholds documented.
- Wired into the shared import pipeline (`lib/import/process.ts`):
  `classifyNormalizedShots` / `buildShotsWithIntent` set a REAL `swing_type` +
  outlier flag (was hardcoded `'full'`). Both the guided wizard and bulk importer
  use it; the wizard preview shows the shot mix. Learning is automatic — the
  baseline sharpens as more of the player's data arrives.

### Phase 7 — `lib/priority/` + dashboard
- `engine.ts`: `computeAthletePriorities(input)` aggregates every diagnosis across
  every session (+ club gapping + recurring video issues), scoring each by
  `severity × confidence × recencyDecay(30-day half-life)` summed over
  occurrences (frequency falls out of the sum). Produces ranked priorities,
  top/secondary, per-priority **trend**, **evidence**, honest **what's-missing**
  hints, and a **what-changed** line vs the last snapshot. Pure + deterministic.
- `store/slices/prioritySnapshots.ts`: persists the top-priority over time (only
  on change, capped 20) so "what changed" works across visits. Local-first
  (defaulted in cloud-repo + reset + merge test).
- `components/dashboard/PriorityPanel.tsx`: renders it on the dashboard between
  the hero and the secondary panels; self-hides until there's enough to
  synthesize; records a snapshot on change.
- `/diagnose` result gained a clear next-step row (Practice plan / Import another
  / Quick fix / Full report) — Phase 6.3.

## Tests (18 new)
`lib/shot-intent/__tests__/shot-intent.test.ts` (11) and
`lib/priority/__tests__/engine.test.ts` (7). Full suite green (1610), tsc clean,
production build passes (344 pages).

## Not yet (future)
Phase 6: explicit per-shot correction UI that feeds back into the baseline (today
the baseline auto-learns from the distribution). Phase 7: weight in readiness
(BodySync) + on-course/emergency inputs + practice-completion as priority
signals; an AI narrative over the priority; a dedicated priority-history view.
