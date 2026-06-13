# Deterministic Intelligence — Engine Guide

> **One fix. One plan. One retest.** — produced token-free, explainably, and
> honestly, with AI escalation only when it genuinely adds value.

This document covers the **deterministic diagnosis engine**: the weighted,
symptom→cause layer that turns an athlete's reported miss pattern into a ranked,
explainable diagnosis with **no external AI call and no I/O**. It composes the
existing systems rather than replacing them.

## 1. Where it sits

```
Athlete report (sport, issue, symptoms, skill, history)
        │
        ▼
 lib/intelligence/diagnose.ts          ← weighted symptom→cause engine (PURE)
   ├─ symptom-rules.ts                 ← per-sport rule packs + registry (DATA)
   └─ lib/faults/ (ontology + packs)   ← shared fault vocabulary, retest, drills
        │
        ▼
 DeterministicDiagnosis  ── attached to ──▶ AnalysisResult.diagnosisDetail
        │                                      (lib/intelligence/heuristic.ts)
        ▼
 lib/intelligence/router.ts            ← decides if a PAID AI call is allowed
                                          (cost-saving mode can veto escalation)
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

From `@/lib/intelligence`:

| Function | Purpose |
| --- | --- |
| `analyzeDeterministicSession(input)` | Full ranked, explainable diagnosis. |
| `calculateConfidence(args)` | 0–100 score + label + **reason** (shared definition). |
| `shouldEscalateToAI(diagnosis, input)` | Whether AI/deeper analysis is warranted, with reasons. |
| `getTriggeredRuleTrace(input)` | Admin/debug list of which rules fired. |
| `runDeterministicScenarioTest(scenario)` | Run + assert a golden scenario (eval lab). |
| `getSportDiagnosisConfig(sport)` / `getSymptomsForSport(sport)` | Registry access for intake UI. |

Every `DeterministicDiagnosis` carries: `primary` + `secondary` cause, `ranked`
list, `confidence` + `confidenceLabel` + `confidenceReason`, `severity`,
`urgency`, `supportingEvidence`, `contradictingEvidence`, `missingData` +
`missingDataPrompts`, `whatWouldChangeIt`, `escalateToAI` + `escalationReasons`,
`recommendVideo`, `ruleTrace`, and an honest `disclaimer`.

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
string explains the band in plain language, e.g.
*"Confidence is moderate because only one symptom was reported; no swing video or
measured data was analyzed."*

## 4. AI escalation (`shouldEscalateToAI`)

Escalate when **any** of: confidence below the sport threshold; reported symptoms
contradict; two root causes are nearly tied; the same fix has failed ≥2 times; a
retest **regressed** the diagnosis; or a video exists for an advanced/elite
athlete. Do **not** escalate a confident, uncontested, common diagnosis.

The engine only *recommends* — `lib/intelligence/router.ts` still gates the actual
spend. See §7 for confirming cost-saving mode uses zero external tokens.

## 5. How to add a new diagnosis (fault)

1. Add an entry to `lib/faults/packs.ts` (symptom/outcome) or `ontology.ts`
   (mechanical). Use `reported({...})` in `packs.ts` to mark it
   `typicalEvidenceBasis: 'user_entered'` (the honest default). Provide all three
   `explanations` (parent/coach/advanced) — the completeness test requires they be
   present **and distinct**.
2. Give it a unique `id` (no collisions across both files), `sports`, honest
   `likelyRootCauses` / `observableEvidence`, `drillFamilies`, `retest`, and
   `defaultSeverity`.
3. The fault is now resolvable everywhere (`resolveFault`, drill matcher, retest).

## 6. How to add a new rule (symptom→cause link)

In `lib/intelligence/symptom-rules.ts`, add a `SymptomRule` to the relevant
sport/family pack:

```ts
{
  symptom: 'my_symptom',           // canonical id the athlete reports
  label: 'Plain-English label',
  aliases: ['free text variants'], // normalized onto this symptom
  candidates: [{ faultId: 'my_fault', weight: 1.0 }, { faultId: 'related', weight: 0.5 }],
  reinforcedBy: ['other_symptom'], // +15% when also present
  contradictedBy: ['opposite'],    // dampen + flag contradiction when present
  missingDataPrompts: ['The highest-value follow-up question'],
}
```

No engine code changes are needed — it is all data.

## 7. How to add a new sport

1. Ensure the sport exists in `@swingiq/core`'s `SportId`.
2. Add fault entries for it in `lib/faults/packs.ts`.
3. Add a `SportDiagnosisConfig` to `CONFIGS` in `symptom-rules.ts` (reuse a
   `*Rules()` builder or write a new rule list).
4. Add a golden scenario in `scenarios.test.ts`.

## 8. Tests & the evaluation lab

- Engine unit tests: `src/lib/intelligence/diagnose.test.ts`
- Golden scenarios (per sport / skill / contradiction / escalation):
  `src/lib/intelligence/scenarios.test.ts` (exports `GOLDEN_SCENARIOS` for reuse
  by an admin "run sample athlete scenarios" surface).
- Ontology completeness: `src/lib/faults/__tests__/faults.test.ts`.

Run them:

```bash
cd apps/web
# core must be built once so @swingiq/core resolves:
npm --prefix ../.. run build --workspace @swingiq/core   # or: (cd ../../packages/core && npm run build)
npx jest src/lib/intelligence src/lib/faults --runInBand --cacheDirectory ./.jest-cache-det
```

Run only the scenario evaluation lab:

```bash
npx jest src/lib/intelligence/scenarios.test.ts --runInBand --cacheDirectory ./.jest-cache-det
```

## 9. Confirming cost-saving mode uses zero external AI tokens

The deterministic engine is **structurally** token-free:

1. `diagnose.ts` imports only `lib/faults` + `symptom-rules` — **no AI provider,
   no `fetch`, no `lib/ai*`**. Verify there are no such imports or calls (prose
   comments may mention "provider"; this checks real code):
   ```bash
   grep -nE "^import|require\(|fetch\(|lib/ai|openai|anthropic|gemini" \
     apps/web/src/lib/intelligence/diagnose.ts
   # → only imports of ./diagnose-types, ./types, ./symptom-rules, @/lib/faults
   ```
2. `analyzeDeterministicSession` returns **synchronously** (not a `Promise`), so it
   cannot await a network call — asserted in `diagnose.test.ts`
   ("returns synchronously").
3. It is **deterministic** — identical input yields a deeply-equal result (also
   asserted in `diagnose.test.ts`), which a token-billed call could never be.
4. The router (`router.ts`, `decideRoute`) routes **free / Instant Estimate to
   `HEURISTIC_ONLY` in `COST_SAVING_MODE`** and never calls a provider — covered by
   `router.test.ts`. The engine only *recommends* escalation; the router decides.

## 10. Honesty rules

- Symptom-pack faults are `typicalEvidenceBasis: 'user_entered'` and every
  diagnosis carries a disclaimer that this is a **reported-symptom estimate, not a
  measured or video-confirmed analysis**.
- `generated: true` causes (no curated profile) are flagged and take a confidence
  penalty.
- The engine never implies a video was analyzed — `recommendVideo` invites one;
  the diagnosis text never claims one was used.
