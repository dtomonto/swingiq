# SwingVantage — Intelligence Learning Plan (25 Priorities)

> Execution plan to satisfy the 2026-06-11 intelligence/video/Kinematica/biometrics audit.
> **Goal:** move the platform from a 5/10 honest per-user foundation to a 7–8/10 adaptive,
> compounding learning system — without rebuilding the real, honest core that already exists.
>
> Companion audit lives in agent memory (`project_intelligence_learning_audit`).
> Distinct from `docs/INTELLIGENCE_UPGRADE_PLAN.md` (an earlier, separate 25-rec / 6-sprint program).

## Non-negotiable guardrails (apply to every task)

1. **Never fabricate.** Every metric/aggregate carries an honest `DataSource` label (real / estimated / imported / placeholder / mock). No peer/population claim until a real aggregate exists.
2. **Keyless-first.** Every new capability ships with a working keyless mode and is OFF until a key/flag is set (`lib/capabilities.ts`). Graceful fallback, never a hard dependency.
3. **Privacy-forward.** On-device by default; server aggregates are k-anonymized (`AGGREGATE_MIN_COHORT`); BodySync stays 18+ + non-medical; video never uploaded.
4. **Audit-first, reuse.** This codebase is ~80–95% built. Extend the real engines (`packages/core/diagnostic`, `lib/motion-lab`, `lib/priority`, `lib/retest`), don't rebuild.
5. **Preserve honesty labels.** `is_estimated`, `basis: estimated|measured`, confidence calibration, and sub-40 filtering must survive every change.

## Critical path (do these 4 first — they convert latent frameworks into real learning)

```
P2  ──(analytics on)──┐
                      ├──► P8 acceptance tracking ──► P14 cohort/outcome widgets ──┐
P1  feedback→ranking ─┘                                                            │
                                                                                   ├──► P18/21/24/25 (aggregate-dependent)
P4  k-anon aggregate store ────────────────────────────────────────────────────────┘
P3  pose→non-golf analyzers ──► P10 pose phase detection ──► P16/17 (multi-angle/club)
```

**Sequencing rule:** nothing in Phase 5's aggregate-dependent set (#18, #21, #24, #25) may ship before #4 lands a real, k-anonymized store with honest labels.

---

## Phase 1 — Foundation: make intelligence trackable & trustworthy

### P2 · Turn on one analytics provider + add acceptance/outcome events  ⭐ critical path
- **Problem:** 170+ event taxonomy exists but providers are off by default → admin surfaces are data-starved.
- **Approach:** enable one provider (PostHog recommended — already wired in `lib/analytics.ts`); add events `RECOMMENDATION_ACCEPTED`, `RECOMMENDATION_DISMISSED`, `DRILL_OUTCOME_LOGGED`, `ANALYSIS_FAILED_CLIENT`. Keep console fallback.
- **Files:** `apps/web/src/lib/analytics.ts`, `packages/core/src/analytics/events.ts`, env (`NEXT_PUBLIC_POSTHOG_*`).
- **Risk:** Low · **Complexity:** S
- **Acceptance:** events fire in a live session and appear in the provider; no PII; keyless still no-ops cleanly.

### P8 · Recommendation-acceptance tracking
- **Problem:** no signal for "do our fixes work?"
- **Approach:** instrument the Today's-Fix / drill / priority CTAs to emit accept/dismiss + later outcome; persist locally and (if Supabase on) server-side.
- **Files:** `lib/priority/*`, Fix/drill UI, store slice for acceptance.
- **Risk:** Low · **Complexity:** S · **Depends on:** P2.
- **Acceptance:** an accepted recommendation produces a durable, queryable record tied to the fault id.

### P7 · Promote Supabase sync to default-on for logged-in users
- **Problem:** local-first only → no cross-device continuity; aggregates impossible.
- **Approach:** when authenticated + Supabase configured, sync store slices to the existing per-user tables; keep full local-only mode when keyless.
- **Files:** `lib/supabase*.ts`, store persistence layer, `supabase-relational-schema.sql`.
- **Risk:** Med (data-shape parity, RLS) · **Complexity:** M.
- **Acceptance:** a logged-in user's sessions/diagnoses appear on a second device; keyless guest unaffected.

### P5 · Prompt registry + versioning + eval set  ⭐ critical path enabler for AI iteration
- **Problem:** coaching prompts are inline + unversioned; only research prompts have `PROMPT_VERSION`; no eval.
- **Approach:** central prompt registry with `{id, version, body}`; stamp AI outputs with prompt version; seed a small golden eval set (input→expected-shape) run in CI.
- **Files:** `apps/web/src/lib/ai-coach-prompts.ts`, new `lib/ai/prompt-registry.ts`, `packages/core/src/research/llm-prompts.ts` (pattern), CI.
- **Risk:** Med · **Complexity:** M.
- **Acceptance:** every LLM response records its prompt version; eval set runs green in CI and fails on schema drift.

### P23 · Data-quality scoring for launch-monitor imports
- **Problem:** video has `visibilityQuality`; LM sessions have no quality signal.
- **Approach:** score each imported session (shot count, dispersion, missing-field ratio) → quality band; feed into existing confidence calibration; surface in UI + admin.
- **Files:** `packages/core/src/diagnostic/engine.ts`, import pipeline (`lib/import/*`).
- **Risk:** Low · **Complexity:** S.
- **Acceptance:** a thin/noisy import is labeled lower-quality and lowers diagnosis confidence honestly.

---

## Phase 2 — Personalized intelligence: make every user feel remembered

### P1 · Wire existing feedback loops into ranking  ⭐ critical path · highest leverage
- **Problem:** insight votes + drill verdicts are collected locally and never used.
- **Approach:** consume `agi/adapters/feedback-map.ts` + `agi/insight-feedback.ts` in drill ranking (`coach-mix/recommendations.ts`) and priority surfacing (`lib/priority/engine.ts`): down-weight "no_change/hurt" drills and down-voted insights for that user.
- **Files:** `lib/agi/adapters/feedback-map.ts`, `lib/agi/insight-feedback.ts`, `lib/central-intelligence/coach-mix/recommendations.ts`, `lib/priority/engine.ts`.
- **Risk:** Low · **Complexity:** M.
- **Acceptance:** a "hurt" drill verdict measurably lowers that drill's rank on the next recommendation for that user; deterministic + testable.

### P9 · Extend skill-relative tolerance to non-golf
- **Problem:** only golf re-weights severity by skill (`profile-tolerance.ts`); non-golf grading is generic.
- **Approach:** generalize the `relevanceFactor` pattern; add per-sport skill bands using existing sport profile schemas.
- **Files:** `packages/core/src/diagnostic/profile-tolerance.ts` → per-sport adapters, `sports/sport-profiles.ts`.
- **Risk:** Med · **Complexity:** M · **Depends on:** sport profiles (exist).
- **Acceptance:** the same tennis fault ranks differently for a beginner vs advanced player; diagnosis text unchanged (re-weight only).

### P11 · Wire Motion Lab kinematics into readiness/coaching
- **Problem:** Motion Lab metrics (rotation/tempo/sequencing/balance) are siloed from BodySync readiness.
- **Approach:** feed recent Motion Lab repeatability/balance into the readiness/coaching adapters as an additional honest signal (non-medical).
- **Files:** `lib/readiness/*`, `lib/bodysync/coaching.ts`, `lib/motion-lab/repeatability.ts`.
- **Risk:** Low · **Complexity:** M.
- **Acceptance:** a low-balance Motion Lab trend nudges coaching emphasis; clearly labeled estimate.

### P6 · Weekly recap + per-metric trajectory cards
- **Problem:** no recurring "look how far you've come" surface; data already computed.
- **Approach:** weekly recap from priority snapshots + baselines + repeatability; trajectory card per key metric.
- **Files:** `lib/priority`, `lib/motion-lab/repeatability.ts`, `shot-intent/baselines.ts`, dashboard.
- **Risk:** Low · **Complexity:** M.
- **Acceptance:** a user with ≥2 weeks of data sees an accurate recap; empty/low-data states honest.

### P15 · Regression-risk + fastest-improving cards
- **Problem:** missed motivation/early-warning hooks.
- **Approach:** derive from priority trend (`worsening`) + repeatability deltas; surface as dashboard cards.
- **Files:** `lib/priority/engine.ts` (trend), `lib/motion-lab/repeatability.ts`, dashboard.
- **Risk:** Low · **Complexity:** S · **Depends on:** P6 surfaces.
- **Acceptance:** a worsening fault produces a regression-risk card; a tightening metric produces a fastest-improving card.

---

## Phase 3 — Kinematica upgrade: credible motion intelligence for all sports

### P3 · Feed MediaPipe pose track into non-golf analyzers  ⭐ critical path · biggest credibility jump
- **Problem:** non-golf video "analysis" is metadata-only heuristics; the pose track already exists in-pipeline (used by Motion Lab) but is ignored by `sports/*/analysis.ts`.
- **Approach:** pass the pose track to each sport analyzer; replace duration/camera heuristics with pose-derived checks where defensible; keep `is_estimated` + conservative confidence.
- **Files:** `apps/web/src/lib/pose/*`, `packages/core/src/sports/{tennis,baseball,softball-*,pickleball,padel}/analysis.ts`, `packages/core/src/video-analysis/deterministic-analysis.ts`.
- **Risk:** Med · **Complexity:** L.
- **Acceptance:** at least one fault per non-golf sport is detected from pose geometry (not metadata) with calibrated confidence; honesty labels intact.

### P10 · Pose-based swing-phase detection (non-golf)
- **Problem:** non-golf phases estimated from duration %.
- **Approach:** detect phases from pose velocity/landmark events (Motion Lab already does peak detection for golf).
- **Files:** `packages/core/src/sports/*/analysis.ts`, reuse `lib/motion-lab/temporal.ts` patterns.
- **Risk:** Med · **Complexity:** M · **Depends on:** P3.
- **Acceptance:** phase boundaries track the actual motion, not fixed % of clip duration.

### P16 · Multi-angle capture guidance + fusion
- **Problem:** single-camera limits true 3D (depth is reconstructed/estimated).
- **Approach:** guided two-angle capture; upgrade Motion Lab `basis` to `measured` via triangulation when two views present.
- **Files:** capture UX, `lib/motion-lab/kinematics3d.ts` (basis upgrade path already exists).
- **Risk:** Med · **Complexity:** L · **Depends on:** P3.
- **Acceptance:** two-angle sessions report `basis: measured` for rotation; single-angle stays `estimated`.

### P17 · Club / object tracking (swing-plane/path credibility)
- **Problem:** swing plane/path are 2D proxies; no club tracking.
- **Approach:** add an object-tracking provider seam (the index already references an overlay seam) behind a flag; keep plane/path labeled proxy until real.
- **Files:** `lib/motion-lab/index.ts` (object-tracking seam), new provider.
- **Risk:** High · **Complexity:** L · **Depends on:** P3.
- **Acceptance:** when enabled, club path overlay is computed; when not, UI honestly shows the 2D proxy disclaimer.

---

## Phase 4 — Platform learning: compound intelligence across users

### P4 · k-anonymized aggregate store (server)  ⭐ critical path · unlocks the whole phase
- **Problem:** `central-intelligence/aggregate.ts` + `coach-mix/trends.ts` are pure functions over SAMPLE data; no real backend.
- **Approach:** add aggregate tables (fault frequency by sport/skill, metric distributions) fed by an ingestion job that writes only k-anonymized counts (`AGGREGATE_MIN_COHORT`); wire `TrendAggregateSource` to the real source. No raw user rows in aggregates.
- **Files:** new Supabase migration + ingestion, `lib/central-intelligence/aggregate.ts`, `coach-mix/trends.ts` (replace sample with real source).
- **Risk:** Med–High · **Complexity:** L · **Depends on:** P7 (server data).
- **Acceptance:** admin trends show real aggregates labeled `real` (not "Sample") only when cohort ≥ threshold; below threshold → suppressed, not faked.

### P18 · Benchmark auto-refinement from aggregates
- **Problem:** benchmarks are hardcoded; research workflow is manual+separate.
- **Approach:** propose benchmark adjustments from aggregate distributions → admin review → commit (never auto-publish). Reuse `/admin/research` + benchmark-store.
- **Files:** `lib/grading/*`, research workflow, `/admin/benchmarks`.
- **Risk:** Med · **Complexity:** M · **Depends on:** P4.
- **Acceptance:** a proposed benchmark change is reviewable with the supporting cohort size; nothing changes without approval.

### P21 · Per-sport benchmark libraries (data-backed)
- **Problem:** non-golf benchmarks are thin vs golf's club-specific windows.
- **Approach:** build per-sport benchmark windows, seeded by research + refined by P18 aggregates.
- **Files:** `packages/core/src/sports/*/benchmarks.ts`.
- **Risk:** Med · **Complexity:** M · **Depends on:** P4, P18.
- **Acceptance:** each sport has skill-banded benchmark windows with an honest source label.

### P25 · Transfer-learning aggregation
- **Problem:** cross-sport transfer is computed per-athlete only, never aggregated.
- **Approach:** aggregate transfer-link evidence across the cohort to validate which capabilities genuinely transfer; feed back into `agi/transfer.ts` weighting.
- **Files:** `lib/agi/transfer.ts`, aggregate store.
- **Risk:** Med · **Complexity:** M · **Depends on:** P4.
- **Acceptance:** transfer suggestions cite aggregate evidence; weak links are demoted.

### P24 · Leaderboards by capability percentile
- **Problem:** only XP ranking exists; no skill-fair comparison.
- **Approach:** capability percentiles from the aggregate store; opt-in, anonymous-by-default, youth-protected (reuse existing community privacy rules).
- **Files:** community surfaces, aggregate store.
- **Risk:** Med · **Complexity:** M · **Depends on:** P4.
- **Acceptance:** a user sees their percentile only with ≥ threshold cohort; opt-out respected; minors never ranked vs adults.

### P14 · Cohort / outcome admin widgets
- **Problem:** outcome analysis is external (PostHog) only; not on the dashboard.
- **Approach:** pre-built widgets ("high-score analyses → retention", "recommendation acceptance by sport") over P2/P8 events + aggregates.
- **Files:** `/admin/analytics`, `/admin/command-center`.
- **Risk:** Med · **Complexity:** M · **Depends on:** P2, P8, P4.
- **Acceptance:** owner answers "which recommendations are accepted / which features retain" without leaving the admin.

### P19 · Prompt/model drift monitoring
- **Problem:** no drift detection on AI outputs.
- **Approach:** run the P5 eval set on a schedule; alert on schema/quality regressions; track per-version acceptance.
- **Files:** eval harness, `/admin/ai-quality`, cron.
- **Risk:** Med · **Complexity:** M · **Depends on:** P5.
- **Acceptance:** a deliberately broken prompt version trips an alert.

### P20 · Coach-in-the-loop review workflow
- **Problem:** AI outputs surface in queues but no iterate-loop.
- **Approach:** reviewer can flag/correct an AI output; correction feeds the eval set + prompt-tuning backlog (never auto-trains).
- **Files:** `/admin/ai-analyses`, `/admin/ai-quality`, eval set.
- **Risk:** Med · **Complexity:** M · **Depends on:** P5, P19.
- **Acceptance:** a reviewer correction becomes a new eval case.

### P12 · AI-output review → iterate loop (close it)
- **Problem:** review queues surface items but don't drive iteration.
- **Approach:** wire P8 acceptance + P20 corrections back into prompt/version selection and ranking.
- **Files:** `/admin/ai-analyses`, prompt registry, ranking.
- **Risk:** Med · **Complexity:** M · **Depends on:** P5, P8, P20.
- **Acceptance:** a low-accepting prompt version is flagged for replacement.

---

## Phase 5 — Biometrics & engagement completion

### P13 · Sport mobility modules (tennis / baseball / softball / pickleball / padel)
- **Problem:** mobility guide is golf-only (`lib/readiness/golf-mobility.ts`).
- **Approach:** build per-sport mobility/warm-up modules mirroring the golf structure; keep non-medical framing.
- **Files:** `lib/readiness/*`.
- **Risk:** Low · **Complexity:** M.
- **Acceptance:** each sport has a warm-up/mobility module surfaced in pre-round/readiness.

### P22 · Device integrations go-live (Apple Health / Garmin / WHOOP / Oura)
- **Problem:** all providers are `coming_soon`; BodySync is manual self-report only.
- **Approach:** ship the Apple Health export importer first (no tokens), then OAuth providers behind keyless flags; store only normalized daily summaries (no raw payloads).
- **Files:** `lib/bodysync/providers/registry.ts`, `lib/bodysync/import/apple-health.ts`, new OAuth adapters.
- **Risk:** Med · **Complexity:** L.
- **Acceptance:** at least one real device source flows into readiness with consent + summaries-only; manual mode still works keyless.

---

## Milestones / definition of done

- **M1 (Phases 1–2):** feedback closes the per-user loop; analytics live; recaps/trajectory shipping. → learning-loop 3 → ~5.
- **M2 (Phase 3):** non-golf video uses real pose. → video maturity ~5 → ~7.
- **M3 (Phase 4):** real k-anon aggregate + outcome widgets + benchmark refinement. → overall 5 → ~7–8 (genuine compounding).
- **M4 (Phase 5):** sport-complete biometrics + live device data. → biometric maturity ~5 → ~7.

## Risk register (top)

- **Aggregate privacy (P4/P24/P25):** enforce k-anonymity at the query layer; never expose < threshold cohorts.
- **Credibility regression (P3/P17):** never let a richer UI outrun real measurement — keep `estimated`/`measured` basis honest.
- **Concurrency/shared-checkout:** land each task via its own worktree + path-scoped commits (see CLAUDE.md).
- **Cost (AI/eval):** keep keyless-first + budget gate (`lib/ai-budget.ts`); eval set small and cached.
