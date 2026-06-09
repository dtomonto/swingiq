# SwingVantage Intelligence Upgrade — Sprint Plan

Program to execute all 25 recommendations from the 2026-06-09 product-intelligence audit.
Shipped sprint-by-sprint with the project's standard bar: pure/testable where possible,
verified (lint + tsc + build + jest), committed, pushed. Keyless-first preserved — every
item works without a provider key; provider keys only *upgrade* behaviour.

**Legend:** ✅ keyless-safe (ship now) · 🔑 owner-gated (needs a provider key / cost decision) · ⬜ todo · 🟢 done

---

## Sprint 1 — Deterministic core hardening (`packages/core`, `lib/grading`)
Highest correctness leverage, zero provider dependency, fully unit-testable. The deterministic
engine is the source of truth the LLM only narrates — hardening it lifts every downstream surface.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 10 | Robust statistics in `computeSessionStats` (2σ-winsorized mean) | 🟢 | SHIPPED `57e18991`. Identical to plain mean for clean data; drops >2σ mishits at ≥5 shots. |
| 11 | Dispersion-aware diagnostic confidence | 🟢 | SHIPPED `57e18991`. `dispersionConfidenceFactor` 0.7–1.0; std-dev fields added to SessionStats. |
| 14 | Expand club target windows + per-loft interpolation | 🟢 | SHIPPED `ca5508df`. All 7 club categories now in TARGET_WINDOWS (was 3; rest fell back to mid_iron). |
| 13 | Profile-relative diagnostic thresholds | 🟢 | SHIPPED `ca5508df`. `relativizeDiagnoses` + PROFILE_TOLERANCES (beginner ±6° → pro ±1.5°); annotates/re-ranks, doesn't rewrite rules. |
| 15 | Cross-session diagnosis awareness (persistence) | 🟢 | SHIPPED `d5519076`. `assessFaultPersistence` (new/intermittent/persistent/chronic) + persistence confidence factor. |
| 16 | Confidence-calibration logging scaffold | 🟢 | SHIPPED `4b5d43f7`. `lib/calibration` — recordPrediction/resolveOutcome + computeCalibration (per-band predicted-vs-observed, over/under-confidence). |

**Acceptance:** new unit tests for each; existing `diagnostic/engine.test.ts` green; full suite green.

> ✅ **SPRINT 1 COMPLETE** (#10 #11 #13 #14 #15 #16) — commits 57e18991, d5519076, ca5508df, 4b5d43f7. ~55 new tests; core jest 228 + tsc clean + full turbo build green throughout.

---

## Sprint 2 — AI coach trust layer (`/api/ai-coach`, `lib/ai-coach-prompts`)
Make the AI output trustworthy and structured. Core (grounding, structure, cache, memory) is
keyless-safe; only the live model call is provider-gated.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Structured `AICoachResponse` via Anthropic structured outputs (`output_config.format` / `messages.parse()`) | 🔑 | Type already defined+unused; populate it. Falls back to free-text parse when keyless. |
| 2 | Output-grounding validator (numeric claims must trace to `[DATA CONTEXT]`) | 🟢 | SHIPPED `9bf52215`. `validateGrounding` (°/yards/mph/rpm vs context, rounding tolerance); wired into /api/ai-coach as additive `grounding` field. 7 tests. |
| 3 | Migrate hand-rolled `fetch` → official `@anthropic-ai/sdk` | 🔑 | Typed errors, auto-retry, `.parse()`, `.stream()`. Removes drift across ~10 AI routes. |
| 6 | App-level response cache keyed on hash(context, question) | 🟢 | SHIPPED `f819dd59`. Pure TtlLruCache + stable cacheKey; wired into /api/ai-coach (returns `cached:true`). 8 tests. |
| 5 | Longitudinal + conversation memory wired into the prompt | 🟢 | SHIPPED `e8611727`. `recent_history` ctx field → `[RECENT HISTORY]` block in buildCoachPrompt; folded into cache key. (Conversation/multi-turn memory = thin follow-up.) |

**Acceptance:** grounding rejects fabricated numbers in tests; structured parse round-trips; cache hit on repeat; keyless path unchanged.

---

## Sprint 3 — AI ops & model strategy (`lib/ai/*` new gateway)
A single typed AI gateway underpins tiering, batching, logging, eval. Mostly owner-gated (cost).

| # | Item | Status | Notes |
|---|------|--------|-------|
| — | Unified AI gateway (provider abstraction, like the vision provider) | 🔑 | Shared retry/cache/budget/logging/structured-output; foundation for 3/4/9. |
| 4 | Model tiering by difficulty/segment (haiku→sonnet→opus) | 🔑 | Route low-confidence/multi-fault/founding-member calls to a stronger model. Current IDs: `claude-haiku-4-5` ($1/$5), `claude-sonnet-4-6` ($3/$15), `claude-opus-4-8` ($5/$25). |
| 7 | Interaction logging (opt-in, anonymized) → coach-mix trends seam | 🔑 | Closes the coach learning loop. Privacy-gated. |
| 8 | AI eval / golden-set harness + `count_tokens` cost accounting | ✅ | Extends the prompt-injection suite; regression-tests grounding/refusals/structure. Token counting via API, not tiktoken. |
| 9 | Batches API (50% cost) for non-interactive generation | 🔑 | AGI narrative, social, feature-education drafting. |

---

## Sprint 4 — Vision & motion intelligence (`packages/core/video-analysis`, `lib/motion-lab`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 17 | Fuse objective pose metrics (kinetic-chain, hip-shoulder sep) into the vision prompt as ground truth | 🔑 | LLM interprets measured motion instead of guessing from frames. Numbers are keyless (motion-lab); the vision call is gated. |
| 18 | Swing-repeatability score as a first-class output | ✅ | `motion-lab/repeatability.ts` exists; headline consistency (the #1 amateur differentiator). |
| 19 | Quality-gate AI-vision spend (`motion-lab/quality.ts`) | ✅ | Reject low-quality clips before the paid call; tell user to re-record. |

---

## Sprint 5 — AGI, personalization & recommendations (`lib/agi`, `lib/priority`, `lib/central-intelligence`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 20 | Surface the keystone/cross-sport-transfer insight prominently; smarter gating | ✅ | The genuine moat; currently buried behind an off-by-default flag. |
| 21 | Insight → action → outcome reinforcement loop | ✅ | Rerank insights by whether acting on them measurably helped (`commitment.ts`+`progress.ts`). |
| 22 | Unified "next best action" ranker | ✅ | Consolidate priority + readiness + keystone + drill-match + funnel into one ranked feed. |
| 23 | Privacy-safe cohort intelligence ("players like you") | ✅ | Anonymized cohort similarity over `aggregate.ts`/coach-mix trends. |
| 24 | Drill recommendations learn from retest outcomes | ✅ | Wire `drillmatch/feedback.ts` to real outcome deltas. |

---

## Sprint 6 — Retrieval & uncertainty (`lib/knowledge` new + cross-cutting)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 25 | RAG/embeddings over the faults ontology + `lib/learn` corpus + drill library | 🔑 | Ground the coach in *your* curated methodology; semantic drill/fault search. Keyless local lexical-embedding fallback + provider-gated vector path. Largest effort, largest payoff. |
| — | Uncertainty intervals (carry 245±12) surfaced consistently | ✅ | Folds the std-devs from Sprint 1 into the UI/AGI/coach surfaces. |

---

## Sequencing & dependencies
- **1 → 2 → 4/5** can proceed largely in parallel after 1 (the engine outputs feed everything).
- **3** (gateway) should land before 4's vision-call changes and 9 (batches) to avoid per-route drift.
- **25** depends on 2 (grounding) + the gateway (3) for the generation half; the corpus/index half is independent and keyless.
- **Owner decisions needed (🔑):** which provider for AI tiering/batches/embeddings, a daily cost ceiling, and the opt-in telemetry posture. Everything ✅ ships regardless.

## Definition of done (every item)
Pure logic unit-tested · `eslint` 0 errors · `tsc` clean · `next build` passes · full `jest` green · committed + pushed · memory + this doc updated with 🟢.
