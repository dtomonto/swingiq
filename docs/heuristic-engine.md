# GAI Heuristic Engine

The deterministic engine behind the free **Instant Estimate** tier and the safe
fallback floor for every other route. It makes **no external AI call**, costs
nothing per request, and always returns a usable, normalized plan.

It does **not** introduce a parallel rule store. It composes the curated
knowledge that already lives in the codebase:

- **`lib/faults/ontology.ts`** — `resolveFault(id, { sport, label })` returns the
  diagnosis, root causes, observable evidence, retest criteria, and
  audience-aware explanations for a fault. Unknown ids get an honest
  `generated: true` entry rather than fabricated detail. `matchFaultId(text,
  sport)` maps free-text issues to a curated id when confident.
- **`lib/drills/catalog.ts`** — `getAllDrills()` is the real drill library; the
  engine token-matches a fault to its 2–3 most relevant drills.

## Output

`runHeuristicEstimate(request, route?)` returns an `AnalysisResult` with:

- `diagnosis`, `confidence` (0–1) + `confidenceLabel`, `reasoning`
- `primaryFix` (the one fix)
- `drills` (2–3, linked to the library by `slug` where available)
- `practicePlan.days` (a 7-day plan)
- `retest` (protocol, active window, "improved when")
- `setupNote` when equipment matters
- `disclaimer` (honest: this is an estimate, not a video breakdown)
- `poweredBy: 'SwingVantage GAI'`, `ruleVersion`
- `costEstimateCents: 0`

The function is pure and synchronous, so it is the dependable fallback for any
route and is fully unit-tested (`heuristic.test.ts`).

## Confidence

Curated, confidently-matched faults start higher (~0.72) than synthesized ones
(~0.50); each selected symptom adds a little, elite athletes subtract a little
(symptoms alone are less diagnostic at that level). Clamped to 0.40–0.90 — the
engine never claims certainty it does not have.

## Supported issues

The ontology + per-sport diagnostic engines in `packages/core` already cover the
high-leverage faults across all seven sports (golf, tennis, pickleball, padel,
baseball, slow-pitch & fast-pitch softball) — e.g. slice/hook/chunk/top/push/pull
in golf; pop-up/rollover/casting/late-contact in baseball & softball;
late-contact/mishit/footwork-timing in the racquet sports. Any issue without a
curated entry resolves to an honest generated entry.

## Adding or improving a rule

Because the engine is data-driven, you extend it by extending the **data**, not
the engine:

1. Add a curated entry to `CURATED` in `lib/faults/ontology.ts` (id, sports,
   name, description, root causes, drill families, retest, explanations).
2. Add matching drills to the per-sport drill library if needed.
3. The `HeuristicRule` interface in `lib/intelligence/types.ts` documents the
   full conceptual rule contract (id, symptoms, confidenceBase, sevenDayPlan,
   version, …) for reference.

No engine code changes are required to support a new fault.
