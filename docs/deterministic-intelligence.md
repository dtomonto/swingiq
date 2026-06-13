# Deterministic Intelligence — Engine Guide

> **One fix. One plan. One retest.** — produced token-free, explainably, and
> honestly, with AI escalation only when it genuinely adds value.

This document covers the **deterministic intelligence layer**: the weighted,
symptom→cause engine plus everything built around it (intake sharpening, practice
plans, history, retest feedback, Today prioritization, skill-tree focus, admin
inspection and analytics) — all with **no external AI call and no I/O**. It
composes the existing systems rather than replacing them.

## 1. Where it sits

```
Athlete report (sport, issue) ──▶ INTAKE (intake.ts) ──┐  a couple of pre-AI
                                                        │  questions, each maps
                                                        ▼  to a symptom
 lib/intelligence/diagnose.ts   ← weighted symptom→cause engine (PURE)
   ├─ symptom-rules.ts          ← per-sport rule packs + registry (DATA)
   └─ lib/faults/ (ontology+packs) ← shared fault vocabulary, retest, drills
        │
        ├─▶ plan.ts             ← structured practice plan (warm-up, drills, retest)
        ├─▶ next-action.ts      ← ActionCandidate for the unified Today feed
        ├─▶ retest-feedback.ts  ← retest outcomes → history signals (loop)
        ├─▶ history.ts          ← persisted, summarized diagnosis history (hub)
        └─▶ athletic-journey/diagnosis-focus.ts ← cause → skill-tree category
        │
        ▼
 DeterministicDiagnosis ── attached to ──▶ AnalysisResult.diagnosisDetail
        │                                    (lib/intelligence/heuristic.ts)
        ▼
 lib/intelligence/router.ts     ← decides if a PAID AI call is allowed
                                   (COST_SAVING_MODE can veto escalation)
```

- **`diagnose.ts`** is the engine. Pure + synchronous → fully unit-testable, safe
  to run on free tiers, in Today refreshes, and in the admin scenario lab.
- **`symptom-rules.ts`** is *data*: weighted symptom→fault links, reinforcement,
  contradiction, follow-up prompts, and per-sport thresholds/limits/disclaimers.
- **`lib/faults/`** is the shared vocabulary. `ontology.ts` holds hand-curated
  *mechanical* faults (what the swing is doing); `packs.ts` holds athlete-reported
  *symptom* faults (what the ball/outcome is doing). Both are first-class.
- The engine **recommends** escalation; the **router** decides whether a paid call
  actually happens. In `COST_SAVING_MODE`, free / Instant Estimate never call AI.

## 2. Public service surface

From `@/lib/intelligence` (except where noted):

| Function | Purpose |
| --- | --- |
| `analyzeDeterministicSession(input)` | Full ranked, explainable diagnosis. |
| `calculateConfidence(args)` | 0–100 score + label + **reason** (shared definition). |
| `shouldEscalateToAI(diagnosis, input)` | Whether AI/deeper analysis is warranted, with reasons. |
| `getTriggeredRuleTrace(input)` | Admin/debug list of which rules fired. |
| `runDeterministicScenarioTest(scenario)` | Run + assert a golden scenario (eval lab). |
| `getSportDiagnosisConfig` / `getSymptomsForSport` / `getRecommendationLimit` | Per-sport registry access. |
| `generateDeterministicPlan(diagnosis, opts)` | Structured practice plan (§5). |
| `getIntakeQuestions(sport, opts)` / `intakeAnswerSymptoms(answers)` | Pre-AI intake (§4). |
| `diagnosisToActionCandidate(diagnosis, opts)` | Adapt to the unified Today feed (§7). |
| `deriveRetestSignals(issue, sport, results)` | Retest history → engine signals (§6). |
| `getDeterministicEngineStatus()` / `runGoldenScenarios()` | Admin coverage + scenario roll-ups (§9). |
| `recordDiagnosis` / `summarizeDiagnosisHistory` *(from `./history`, a `'use client'` module — import direct)* | Persisted history hub (§8). |
| `diagnosisToSkillCategory(diagnosis)` *(from `@/lib/athletic-journey`)* | Cause → journey skill category (§10). |

Every `DeterministicDiagnosis` carries: `primary` + `secondary` cause, `ranked`
list, `confidence` + `confidenceLabel` + `confidenceReason`, `severity`,
`urgency`, `supportingEvidence`, `contradictingEvidence`, `missingData` +
`missingDataPrompts`, `whatWouldChangeIt`, `escalateToAI` + `escalationReasons`,
`recommendVideo`, `ruleTrace`, and an honest `disclaimer`.

### UI components (`@/components/report`)

- **`DeterministicWhyPanel`** — collapsed "Why we think this" (evidence,
  alternative cause, what would change it, escalation note). `footerNote` adapts
  the honesty line for a video-derived vs reported issue.
- **`DeterministicPlanCard`** — renders the practice plan (short + expandable
  full form), **records the diagnosis to history**, emits `plan_generated`, and
  captures one-tap helpfulness.
- **`DeterministicIntake`** — the pre-AI sharpening questions.

Wired into: **Start Here** (`StartHereFlow`), the **golf dashboard**
(`DashboardContent`, pre-measurement), and the **non-golf dashboard**
(`NonGolfDashboard` `PrimaryIssueCard`, explaining a video-detected issue).

## 3. Confidence model

`calculateConfidence` (in `diagnose.ts`):

- **Base 44**, **+7 per corroborating symptom** (capped at 4).
- **+ up to 15** for a clear lead margin over the runner-up cause.
- **− 12 per contradiction** (a reported symptom pointing a different way).
- **− 15** when the primary cause has no curated coaching profile (`generated`).
- **− 5** for elite athletes (subtle causes need video).
- **− 10** when the same fix has already failed ≥2 times.
- Always notes that **no video/measured data** was analyzed (a hard ceiling).

Bands: **high ≥ 70**, **moderate ≥ 50**, else **low**. The `confidenceReason`
string explains the band in plain language.

## 4. Pre-AI intake (`intake.ts`)

Before any AI is offered, a couple of **high-value** questions sharpen the read.
Each answer maps onto a symptom the engine understands, so answering re-runs
`analyzeDeterministicSession` with more signal — raising confidence or surfacing a
contradiction, **for free**.

- `getIntakeQuestions(sport, { askedIds, knownSymptoms, max })` returns a short
  (default ≤2), capped set, skipping already-known/asked questions; every question
  offers an honest "Not sure" (no signal) option.
- `intakeAnswerSymptoms(answers)` collects the chosen symptoms (drops "Not sure").
- The intake renders **only when confidence isn't already high**.

Adding a question is **data** — extend `BY_SPORT` in `intake.ts`.

## 5. Practice-plan generator (`plan.ts`)

`generateDeterministicPlan(diagnosis, { skillLevel })` turns a diagnosis into a
focused plan: **warm-up**, one **focus**, skill-scaled **drills with rep/time
prescriptions**, **success criteria**, **failure signals**, **retest
instructions**, a **progression** and **regression** path, plus a short (Today)
and long (report) form. The drill count follows the per-skill recommendation
limit (`getRecommendationLimit` — beginner 2 … advanced 4). Pure; composes the
fault ontology's retest + the real drill library.

## 6. Retest → diagnosis feedback loop (`retest-feedback.ts`)

`deriveRetestSignals(issue, sport, results)` maps a sport's completed
`RetestResult[]` (from `lib/retest`) into the engine's history signals
(`lastRetestOutcome`, `priorFailedAttempts`), matching a result to the issue by
curated fault id (keyword fallback). `persisting` / `regressed` outcomes count as
failed attempts. The dashboard feeds these into the diagnosis, so a fix that keeps
failing **escalates, loses confidence, and tips toward a deeper look** — closing
the improvement loop.

## 7. Today / next-action (`next-action.ts`)

`diagnosisToActionCandidate(diagnosis, opts)` adapts a diagnosis into the app's
unified next-best-action feed (`lib/next-action/rank`): severity from the fault
severity (bumped by urgency), confidence normalized to 0–1, detail explaining the
lead or escalation reason. The dashboard "one next action" hero uses the
deterministic read pre-measurement.

## 8. Diagnosis history & structured intelligence (`history.ts`)

A versioned, SSR-safe localStorage hub (`swingiq-diagnosis-history-v1`) of shown
diagnoses — **non-PII only** (sport, fault id, confidence, severity, escalation,
missing-data count). `recordDiagnosis` appends (deduped per sport+fault+day);
`useDiagnosisHistory` / `useRecordDiagnosis` are the React hooks;
`summarizeDiagnosisHistory` is the pure summary (most-common causes, escalation
rate, average confidence, confidence trend). This is the "structured intelligence"
hub — clean objects + a history array, never raw text. It is a `'use client'`
module — import it directly, not via the barrel.

## 9. AI escalation & admin inspection

Escalate (`shouldEscalateToAI`) when **any** of: confidence below the sport
threshold; reported symptoms contradict; two root causes nearly tied; the same fix
failed ≥2 times; a retest **regressed**; or a video exists for an advanced/elite
athlete. Do **not** escalate a confident, uncontested, common diagnosis. The
engine only *recommends* — `router.ts` gates actual spend.

**Admin:** `/admin/deterministic-engine` (server page, modeled on AI Provider)
shows per-sport coverage (symptoms / candidate causes / curated faults /
missing-data prompts / escalation threshold), the **live golden-scenario lab**
(pass/fail, confidence distribution, escalation count) via `runGoldenScenarios`, a
**cost-savings model** (¢ avoided per free diagnosis vs an AI swing report; 0
tokens), and a pointer to live telemetry in Analytics. Nav entry lives in
`lib/admin/nav.ts` (Operate → Video Analysis, `logs.view`).

## 10. Skill-tree focus (`athletic-journey/diagnosis-focus.ts`)

`diagnosisToSkillCategory(diagnosis)` maps the primary cause to the journey
`ClassificationCategory` it most develops (movement / finesse / mental / tactical /
consistency, else technique). The journey `SkillTree` accepts a `focusCategory`
prop and badges the matching branch **"Current focus"**, derived from the
athlete's reported miss (golf) or latest video-detected issue (other sports).

## 11. How to extend

- **Add a diagnosis (fault):** add an entry to `lib/faults/packs.ts`
  (symptom/outcome) or `ontology.ts` (mechanical). Use `reported({...})` for the
  honest `user_entered` default. Provide all three `explanations`
  (parent/coach/advanced) — present **and distinct** (enforced by a test). Unique
  `id` (no collisions across both files).
- **Add a rule (symptom→cause):** add a `SymptomRule` to the sport/family pack in
  `symptom-rules.ts` (`candidates` with weights, `reinforcedBy`, `contradictedBy`,
  `missingDataPrompts`). No engine code changes.
- **Add a sport:** ensure it exists in `@swingiq/core` `SportId`; add fault
  entries (`packs.ts`); add a `SportDiagnosisConfig` to `CONFIGS`
  (`symptom-rules.ts`); add intake questions (`intake.ts`); add a golden scenario
  (`golden-scenarios.ts`).
- **Add an intake question:** extend `BY_SPORT` in `intake.ts` (data only).

## 12. Tests & the evaluation lab

| Area | File |
| --- | --- |
| Engine (diagnosis, confidence, escalation, urgency, trace, purity) | `diagnose.test.ts` |
| Golden scenarios (per sport / skill / contradiction / escalation) | `scenarios.test.ts` (+ data in `golden-scenarios.ts`) |
| Coverage + scenario summary | `coverage.test.ts` |
| Analytics emitters | `analytics.test.ts` |
| Practice-plan generator | `plan.test.ts` |
| Diagnosis history + summary | `history.test.ts` |
| Intake questions | `intake.test.ts` |
| Next-action adapter | `next-action.test.ts` |
| Retest feedback loop | `retest-feedback.test.ts` |
| Quick-result enrichment | `lib/onboarding/quickStart.test.ts` |
| Diagnosis → skill category | `lib/athletic-journey/diagnosis-focus.test.ts` |
| Fault ontology completeness | `lib/faults/__tests__/faults.test.ts` |

Run them:

```bash
cd apps/web
(cd ../../packages/core && npm run build)   # @swingiq/core resolves to dist
npx jest src/lib/intelligence src/lib/faults src/lib/onboarding src/lib/athletic-journey \
  --runInBand --cacheDirectory ./.jest-cache-det
```

Run only the scenario evaluation lab:

```bash
npx jest src/lib/intelligence/scenarios.test.ts --runInBand --cacheDirectory ./.jest-cache-det
```

## 13. Analytics & observability

The pure engine emits nothing (it stays side-effect-free). UI call sites emit via
`lib/intelligence/analytics.ts`:

| Event | When |
| --- | --- |
| `deterministic_analysis_completed` | A diagnosis is surfaced to the athlete. |
| `deterministic_ai_escalation_recommended` / `_skipped` | …and the engine does / doesn't recommend a deeper look. |
| `deterministic_intake_answered` | An athlete answers a pre-AI intake question. |
| `deterministic_plan_generated` | A practice plan is generated/shown. |
| `deterministic_user_feedback_submitted` | A one-tap "was this helpful?". |
| `deterministic_diagnosis_confirmed` / `_rejected` | A retest verdict (improved / regressed) on a prior cause. |

Properties are **non-PII only** (sport, skill_level, fault id, confidence, rule /
missing-data counts, escalation decision, plan/drill counts, helpful, outcome,
question_id) — never identity, free-text, video, or biometrics. Event names live
in `@swingiq/core` `ANALYTICS_EVENTS`; `track()` routes them to whichever provider
is configured (PostHog/GA4/…), or the console in dev.

## 14. Confirming cost-saving mode uses zero external AI tokens

The deterministic engine is **structurally** token-free:

1. `diagnose.ts` imports only `lib/faults` + `symptom-rules` — **no AI provider,
   no `fetch`, no `lib/ai*`**:
   ```bash
   grep -nE "^import|require\(|fetch\(|lib/ai|openai|anthropic|gemini" \
     apps/web/src/lib/intelligence/diagnose.ts
   # → only ./diagnose-types, ./types, ./symptom-rules, @/lib/faults
   ```
2. `analyzeDeterministicSession` returns **synchronously** (not a `Promise`) — it
   cannot await a network call (asserted in `diagnose.test.ts`).
3. It is **deterministic** — identical input yields a deeply-equal result
   (asserted), which a token-billed call could never be.
4. The router routes **free / Instant Estimate → `HEURISTIC_ONLY` in
   `COST_SAVING_MODE`** and never calls a provider (`router.test.ts`).

## 15. Honesty rules

- Symptom-pack faults are `typicalEvidenceBasis: 'user_entered'`; every diagnosis
  carries a disclaimer that it's a **reported-symptom estimate, not a measured or
  video-confirmed analysis**.
- `generated: true` causes (no curated profile) are flagged and penalized.
- The engine never implies a video was analyzed — `recommendVideo` invites one;
  the text never claims one was used.
- The admin cost figure is a **per-diagnosis model**, not live spend.
- All analytics and history records are **non-PII**.
