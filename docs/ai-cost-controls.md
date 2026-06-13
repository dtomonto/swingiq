# GAI AI Cost Controls

Cost governance is enforced **server-side**. The GAI routing layer reads the
existing spend guard rather than re-implementing one — there is a single source
of truth for "are we allowed to spend money right now".

## Controls and where they live

| Control | Source | Notes |
| --- | --- | --- |
| Daily fleet-wide budget | `AI_DAILY_BUDGET_CENTS` (`lib/ai-budget.ts`) | `0`/unset = uncapped. Admin override at runtime. |
| Admin budget override | `ai:budget:override:cents` (Upstash) | Change the cap without a redeploy. |
| Per-operation cost estimates | `AI_OP_COST_CENTS` (`lib/ai-budget.ts`) | Coarse upper bounds, labeled "estimated". |
| Per-analysis cap (by tier) | `maxCostCents` in `lib/intelligence/tiers.ts` | Routing blocks AI when the tier's estimate exceeds it. |
| Per-user pause / metering | `lib/ai/user-ai.ts` | Per-user feature gating. |
| Per-IP rate limits | `lib/rate-limit.ts` | Slows a single abuser. |
| Kill switch / force-heuristic | Operating Mode store | Hard stops, set from `/admin/operating-mode`. |
| Provider health | caught at execution | A failing call degrades to the heuristic floor. |

## How routing uses them

In `decideRoute`, a paid AI route is only chosen when **all** hold:

```
providerConfigured && providerHealthy && budgetAllows
  && (maxCostCents <= 0 || estimatedCostCents <= maxCostCents)
```

If any fails, the request is served by the heuristic engine
(`FALLBACK_HEURISTIC`) or, for hard stops, `ADMIN_FORCED_HEURISTIC`. When a limit
is exceeded:

- the user gets a useful heuristic / cached result (never an error),
- premium fallback copy is shown ("We generated an Instant Estimate so you still
  have a clear plan today…"),
- internal budget/provider details are never exposed to the user,
- the blocked route is recorded in `analysis_logs` with its reason for admin
  review (`cost_avoided_cents` captures the spend saved).

## Cost avoided

Every non-AI route records `costAvoidedCents` = the estimated cost of the AI op
it replaced. The Operating Mode dashboard sums this into "Est. cost avoided", so
the value of Cost-Saving Mode / heuristics is visible.

## Required environment variables

All optional (keyless-first). None are required for the layer to run.

| Variable | Purpose |
| --- | --- |
| `INTELLIGENCE_OPERATING_MODE` | Default posture (`DEFAULT_AI_MODE` \| `COST_SAVING_MODE`). |
| `AI_DAILY_BUDGET_CENTS` | Arm the fleet-wide daily spend cap (e.g. `500` = $5/day). |
| `UPSTASH_REDIS_REST_URL` / `..._TOKEN` | Make operating-mode + budget durable & fleet-wide. |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` | Enable the AI tiers (otherwise heuristic-only). |
| `SUPABASE_SERVICE_ROLE_KEY` (+ URL) | Enable durable `analysis_logs` observability. |

## Required migration

`apps/web/supabase-intelligence.sql` — additive, optional. Adds the
`analysis_logs` table for durable, cross-instance routing observability. Apply
via Supabase → SQL Editor (idempotent). Without it, routing still works; logging
is a no-op.
