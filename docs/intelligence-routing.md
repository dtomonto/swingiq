# GAI Intelligence Routing

**Heuristics first. AI when needed. Premium value always.**

SwingVantage's **General Athlete Intelligence (GAI)** is the unifying layer that
routes every analysis request through the right combination of deterministic
rules, cached knowledge, AI providers, and player context. This document
describes the routing layer added under `apps/web/src/lib/intelligence`.

It is a **thin connective layer** over systems that already exist — it does not
re-implement them:

| Concern | Owned by (existing) | Wired by (this layer) |
| --- | --- | --- |
| AI provider adapters | `lib/ai/ai-ops/*`, `lib/ai/gateway.ts` | executors injected into the router |
| Heuristic knowledge | `lib/faults/ontology.ts`, `lib/drills/catalog.ts`, `packages/core` diagnostic engine | `heuristic.ts` composes them |
| Budget / spend guard | `lib/ai-budget.ts` | `context.ts` reads `aiBudgetExceeded()` |
| Provider routing overrides | `/admin/ai-provider`, `lib/ai/ai-ops/routing-store.ts` | unchanged; complementary |
| Plans / entitlements | `lib/billing/entitlements.ts` | `context.ts` resolves the plan |

## The flow

```
AnalysisRequest
  → resolveRouteContext()      // operating mode, capabilities, budget, plan (live)
  → buildDecisionInput()       // pure inputs
  → decideRoute()              // PURE decision — fully unit-tested
  → routeAnalysis() executes via injected deps:
        CACHED            → getCached() (falls back to heuristic on miss)
        HEURISTIC_ONLY    → runHeuristicEstimate()
        HYBRID            → runHybrid()  (wraps the orchestrator)
        FULL_AI           → runFullAI()  (wraps the orchestrator)
        FALLBACK/FORCED   → runHeuristicEstimate()
  → normalized AnalysisResult
  → logAnalysis()              // best-effort observability
  → upgrade CTA attached when AI wasn't used
```

No frontend component decides whether to call AI, and no component calls a
provider directly — everything goes through `analyze()` (`service.ts`).

## Route types

`HEURISTIC_ONLY` · `HYBRID` · `FULL_AI` · `CACHED` · `FALLBACK_HEURISTIC` ·
`ADMIN_FORCED_HEURISTIC`

## Decision logic (the contract)

```ts
if (adminKillSwitch || adminForceHeuristic) return ADMIN_FORCED_HEURISTIC;
if (cacheHit && cacheAllowed)                return CACHED;

const aiPossible = providerConfigured && providerHealthy && budgetAllows
                && (maxCostCents <= 0 || estimatedCostCents <= maxCostCents);

if (operatingMode === COST_SAVING_MODE) {
  if (tier === INSTANT_ESTIMATE || userPlan === 'free') return HEURISTIC_ONLY;
  if (adminAllowsAIOverrideForTier && aiPossible)        return byTier(); // HYBRID | FULL_AI
  return HEURISTIC_ONLY;
}

// DEFAULT_AI_MODE
if (tier === INSTANT_ESTIMATE)                       return HEURISTIC_ONLY;
if (tier === AI_SWING_REPORT)                        return aiPossible ? HYBRID : FALLBACK_HEURISTIC;
if (tier === PREMIUM_RETEST_PLAN && videoAvailable)  return aiPossible ? FULL_AI : FALLBACK_HEURISTIC;
return FALLBACK_HEURISTIC;
```

`decideRoute` is pure (no I/O) — see `router.test.ts` for the full branch matrix.

## Wiring AI tiers to the orchestrator

`analyze()` accepts `runHybrid` / `runFullAI` executors. Callers that hold a
video wrap the existing `runAnalysisPipeline` (`lib/ai/ai-ops/orchestrator.ts`)
and pass it in. When no executor is supplied (symptom-only requests), AI tiers
degrade safely to the heuristic floor — you cannot run video AI without video,
and the user still gets a usable plan. Any executor error is caught and recorded
as `FALLBACK_HEURISTIC`.

### Live video routes (wired)

The expensive video routes keep their own mature execution + response contract,
so rather than re-route their output through `analyze()`, they consult the
**same central `decideRoute`** via `gateVideoAnalysis()` (`video-gate.ts`):

- **`/api/video-vision-analysis`** (Premium Retest Plan) — after provider/feature/
  user-pause checks, the gate decides whether the paid vision call may run under
  the current Operating Mode. Blocked → honest `{ configured: false, message }`.
- **`/api/video-analysis`** (AI Swing Report) — the optional paid coach narrative
  is gated as its final condition; the deterministic analysis always returns.

The gate enforces the kill switch, force-heuristic, and Cost-Saving posture that
these routes previously bypassed, records each decision to `analysis_logs`, and
**fails open** (the routes' own provider + budget guards remain the backstop) so
it can only add safety, never break a working flow. Provider config and the daily
budget cap keep their existing dedicated guards.

## Reusable cache

`cache.ts` is a non-personalized recommendation memory (Upstash + in-memory
fallback). `analyze()` probes it once per request (reusing the read as the
`getCached` dep, so the router never fetches twice); a hit flips `cacheHit` so
`decideRoute` returns `CACHED`. After a fresh compute it write-throughs the
result.

**Safety:** only deterministic results (`sourceMode === 'heuristic'`) are cached.
AI / hybrid / premium-video findings are **never** stored or reused across users,
and the key normalizes only symptom-level inputs (sport, issue, symptoms, skill,
goals, handedness, tier) — never a user id. So a personalized finding can never
leak between athletes.

## Provider health

`health.ts` derives the router's `providerHealthy` signal from the existing
recent-call telemetry (`lib/ai/ai-ops/call-log`). It is conservative and
fail-open: a provider is only "unhealthy" when it has enough recent samples and
none of the relevant providers are succeeding — otherwise healthy. This lets the
router skip a provider mid-outage instead of paying for failing calls, while the
execution-time try/catch remains the real backstop.

## Files

- `types.ts` — shared vocabulary (OperatingMode, IntelligenceTier, AnalysisRoute, …)
- `router.ts` — `decideRoute` (pure) + `routeAnalysis` (DI orchestration)
- `heuristic.ts` — Instant Estimate builder over the fault ontology + drill library
- `tiers.ts` — the three tier configs + per-tier cost op mapping
- `operating-mode.ts` — Upstash-backed posture store (Default AI ↔ Cost-Saving)
- `context.ts` — live signal resolver (mode, capabilities, budget, plan, health)
- `cache.ts` — reusable, non-personalized recommendation cache
- `health.ts` — runtime provider health from call telemetry
- `video-gate.ts` — operating-mode governance for the live video routes
- `service.ts` — `analyze()`, the public server entry
- `log.ts` — best-effort `analysis_logs` writer + admin rollup

See also: [heuristic-engine.md](./heuristic-engine.md),
[admin-operating-mode.md](./admin-operating-mode.md),
[ai-cost-controls.md](./ai-cost-controls.md).
