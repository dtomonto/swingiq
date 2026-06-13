# First-Party Intelligence OS

> The operating layer that lets SwingVantage learn from every AI call so repeated
> answers, fixes and coaching can increasingly be served by **first-party
> knowledge** instead of repeatedly renting answers from third-party models.

**Strategic goal:** third-party models teach the system once; SwingVantage
retains, validates, reuses and improves that knowledge. Third-party AI is then
spent on novelty, uncertainty and high-value reasoning — not repeated work.

Admin home: **`/admin/intelligence-os`** (admin-only, `noindex`).

---

## The flywheel

```
Capture → Normalize → Dedupe → Evaluate → Promote → Retrieve → Improve → Reduce token use
```

Future requests are resolved through the cheapest reliable path:

1. **Exact answer cache**
2. **Canonical first-party answer**
3. **Deterministic rules** (pluggable seam)
4. **First-party knowledge retrieval**
5. **Small/local model** (seam — not yet wired)
6. **Third-party AI** — only when nothing above is reliable

---

## Where it lives

| Layer | Path |
|-------|------|
| Types (7 models + settings) | `apps/web/src/lib/intelligence-os/types.ts` |
| Config / defaults / privacy rules | `…/config.ts` |
| Fingerprinting & dedup (lexical, keyless) | `…/fingerprint.ts` |
| Persistence (shared `growth_records` JSONB) | `…/store.ts` |
| Routing engine | `…/router.ts` |
| Third-party AI adapter (AI gateway) | `…/provider-adapter.ts` |
| Admin service layer (review/approve/export/fix-packets) | `…/service.ts` |
| Dashboard read-models | `…/dashboard.ts` |
| Barrel | `…/index.ts` |
| Admin pages | `apps/web/src/app/admin/intelligence-os/**` |
| Admin APIs | `apps/web/src/app/api/admin/intelligence-os/**` |
| Tests | `…/intelligence-os/__tests__/**` |

### Data models (camelCase TS, persisted by `kind`)
`AIActivityEvent`, `KnowledgeItem`, `CanonicalAnswer`, `PatternMemory`,
`AnswerCacheEntry`, `EvaluationRecord`, `TokenSavingsEntry`, `IntelligenceSettings`.

Every record carries an honest `DataSource` label (`real` / `estimated` /
`imported` / `placeholder` / `mock`). Nothing is fabricated — with no data the
admin shows honest empty states.

---

## Persistence (keyless-first)

Reuses the existing **`growth_records`** JSONB table via the service-role admin
client (the same store CentralIntelligenceOS + GrowthOS use), namespaced with
`io-*` `kind` keys. **No new migration is required.** With no Supabase
configured it degrades to an in-process per-process store (resets on cold
start) — set `SUPABASE_SERVICE_ROLE_KEY` to persist.

---

## The router

```ts
import { resolveWithFirstPartyIntelligence } from '@/lib/intelligence-os';
import { gatewayCallThirdParty } from '@/lib/intelligence-os';

const decision = await resolveWithFirstPartyIntelligence(
  { sourceSystem: 'ai-coach', feature: 'ai-coach', sport: 'golf', request: userQuestion },
  { callThirdParty: gatewayCallThirdParty({ spendLabel: 'ai-coach', system: COACH_SYSTEM_PROMPT }) },
);
// decision.servedBy ∈ exact-cache | canonical-answer | rule-engine | knowledge | third-party-ai | none
```

The third-party call is **pluggable** so the router stays pure + unit-testable
and keyless-first. Omit `callThirdParty` for a dry run — the decision sets
`needsThirdParty: true` and the caller renders its own data-grounded fallback.

Helper functions (all exported): `normalizeIntelligenceRequest`,
`findExactCacheMatch`, `findCanonicalAnswer`, `retrieveKnowledge`,
`scoreConfidence`, `shouldUseThirdPartyAI`, `logAIActivity`,
`createKnowledgeCandidate`, `recordTokenSavings`, `recordPattern`,
`upsertCacheEntry`.

### Gradual adoption
Existing AI features (AI coach, video analysis, drill/retest plans, audits,
fix packets) adopt this by wrapping their LLM call with the router — nothing is
rewritten. Until then, any feature can `POST /api/admin/intelligence-os/activity`
to log activity, or features stay unchanged.

---

## How knowledge is created & reused

1. The router captures an AI response as an `AIActivityEvent` (prompt/response
   **summarized + hashed**, never stored raw).
2. If confidence ≥ `knowledgePromotionThreshold` and it isn't
   personalized/privacy-sensitive, a **knowledge candidate** is created
   (deduped by fingerprint — repeats bump occurrence/confidence, never
   duplicate).
3. An admin **reviews → approves** the candidate (Knowledge Library).
4. Approved knowledge can be promoted to a **Canonical Answer** with trigger
   phrases + auto-serve rules.
5. Future matching requests are served by cache/canonical/knowledge first; each
   avoided call is written to the **Token Savings ledger**.
6. Outcomes (success/failure) adjust confidence; poor outcomes downgrade or
   invalidate the answer.

---

## Token savings

Each avoided third-party call records `avoidedInputTokens`,
`avoidedOutputTokens` and an `estimatedCostSavedCents`. Cache hits use the
**real** cost of the original call (`dataSource: 'real'`); other rows are
conservative estimates (`dataSource: 'estimated'`) using
`ESTIMATED_COST_PER_1K_TOKENS_CENTS`. The Token Savings page breaks savings
down by served-by, provider avoided and feature.

---

## Privacy & safety

- User IDs are **hashed** (`relatedUserIdHash`); raw videos/PII are never stored
  in the knowledge layer — only summaries, references and fingerprints.
- **Personalized / privacy-sensitive requests are never globally cached or
  reused** (`normalizeIntelligenceRequest` flags them; `findExactCacheMatch` /
  `findCanonicalAnswer` / `upsertCacheEntry` refuse them).
- Youth / medical / legal / privacy / safety topics are auto-flagged and gated
  behind admin review (`reviewRequiredSafetyFlags`).
- Configurable retention (`rawEventRetentionDays`, `lowValueArchiveDays`) for
  hot/warm/cold layering.

---

## Action Intelligence OS integration

Recurring issues become **Pattern Memories** (deduped) and any pattern can
generate a **Claude Code fix packet** (markdown prompt + JSON context +
acceptance criteria + regression tests) via the Patterns page / API. Patterns
carry `relatedTaskIds` / `relatedReportIds` / `relatedKnowledgeIds` so they can
become tasks, reports, fix packets or canonical answers — keeping Critical /
High-Priority / AI-Quality / UX / Revenue items clickable and actionable.

---

## APIs (all admin-guarded via `requireAdmin` + RBAC)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/intelligence-os/resolve` | POST | Route a request through the stack |
| `…/activity` | GET, POST | Search events · log activity · promote to knowledge |
| `…/knowledge` | GET, POST, PATCH | Search · create · review/update/outcome/canonicalize |
| `…/canonical` | GET, POST, PATCH | List · create · review/update/invalidate |
| `…/patterns` | GET, POST | List · record · generate fix packet (`?fixPacket=`) |
| `…/evaluations` | GET, POST | List · create evaluation |
| `…/settings` | GET, POST | Read/update thresholds & policies |
| `…/export` | GET | Export knowledge as Markdown/JSON |
| `…/maintenance` | POST | Run retention sweep · backfill embeddings (`settings.manage`) |
| `/api/intelligence-os/observe` | POST | First-party drill/retest telemetry (rate-limited, non-admin) |

Reads require `logs.view`; reviews require `ai.review`; settings require
`settings.manage`; export requires `data.export`.

---

## Tests

`apps/web/src/lib/intelligence-os/__tests__/` — 25 tests covering
fingerprinting/dedup, the full router (cache hit, canonical auto-serve,
third-party fallback, dedup, personalized exclusion, settings thresholds), and
the service layer (review/approve, outcomes, canonicalization, evaluations, fix
packets, export, settings round-trip). Run:

```bash
cd apps/web
npx jest src/lib/intelligence-os --runInBand --cacheDirectory ./.jest-cache-io
```

---

## Semantic matching — lexical or real embeddings (keyless-first)

`lib/intelligence-os/embeddings.ts` provides `semanticSimilarityHybrid()`:

- **Keyless (default):** deterministic *lexical* token-set Jaccard — clearly
  labeled `lexical` in the admin Overview.
- **With `OPENAI_API_KEY`:** real **embeddings** (`text-embedding-3-small`,
  256-dim) compared by cosine similarity, memoized per process so curated
  candidate sets embed once. Set `AI_EMBEDDINGS=off` to force lexical, or
  `AI_EMBEDDINGS_MODEL` to override the model.

The router uses the hybrid transparently in `findCanonicalAnswer` and
`retrieveKnowledge`; if an embedding fails it falls back to lexical for that
pair. The active backend is shown honestly on the Overview page.

## Instrumented features (Phase 6)

- **AI coach** (`/api/ai-coach`) — non-blocking `captureAiInteraction()` observer.
- **Video analysis** (`/api/video-analysis`) — captures the issue→narrative
  mapping as a reusable swing-diagnosis pattern (best-effort, non-blocking).
- **Agent / practice-plan enhancement** (`/api/agents/enhance`) — full
  **exact-cache short-circuit**: identical rewrites are served from the
  first-party cache (recorded as avoided AI calls) instead of paying the model.
- **Drill / retest plans** (deterministic, no third-party AI) — the app reports
  recommendations to `POST /api/intelligence-os/observe`, which records them as
  zero-cost first-party events, dedupes recurring ones into pattern memories,
  and promotes generic ones to knowledge (`recordFirstPartyRecommendation`).
- **Recruiting summary & athletic-journey narrative** (`/api/recruiting/summary`,
  `/api/athletic-journey/narrative`) — observer logging for cost/activity
  visibility; personalized content is not promoted to global knowledge.

## Maintenance (scheduled)

The daily Vercel cron `GET /api/intelligence-os/cron` (06:00 UTC) runs the full
maintenance pass: report retention (hot→warm→cold), the AI-event retention sweep
(`runRetentionSweep`), and embedding backfill (`backfillEmbeddings`). The same
actions are available on demand via `POST /api/admin/intelligence-os/maintenance`
and the Settings-page buttons.

## Step 5 — small/local model seam

`resolveWithFirstPartyIntelligence(req, { smallModel })` tries a small/local/
low-cost model *before* the third-party fallback; a served answer is counted as
an avoided third-party call. Wire any cheap model behind the `smallModel` seam.

## Remaining integration gaps (honest)

- **Client `/observe` adoption:** the curated-drills surface
  (`CuratedSwingDrills`) now reports each recommendation to `/observe`; other
  deterministic surfaces (retest plans, Fix Stack) can adopt the same one-line
  `fetch`. Admin audits still call the gateway directly.
- **Stored embeddings** are computed on create/approve + backfilled on demand;
  there's no automatic re-embed when the provider/model changes (re-run backfill).
- **Retention scheduling:** the sweep runs on demand (admin button/API); wire a
  cron to run it automatically.
