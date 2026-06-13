# Intelligence OS — Session Handoff

> Pick-up notes for continuing the **First-Party Intelligence OS** work in a new
> session. Last updated 2026-06-13. Full design reference: `docs/INTELLIGENCE_OS.md`.

## TL;DR — current state

The First-Party Intelligence OS is **built, merged to `master`, and closed-loop**
on the highest-value paths: **capture → curate → admin-approve → serve cheaper →
measure savings**, with daily auto-maintenance. It is keyless-first (works with no
Supabase / no AI keys) and reuses the existing `growth_records` JSONB table — **no
migration required**.

**Everything is on `master` already.** There is no outstanding branch work. The
dev branch used this session was `claude/tender-clarke-4pas13` (fully merged; safe
to ignore or delete).

## What shipped (all merged)

| PR | What |
|----|------|
| #51 | Core: 8 data models, routing engine, admin UI (8 pages) + APIs, 25 tests |
| #53 | AI coach capture (observer) |
| #57 | Video-analysis + practice-plan instrumentation + **real embeddings** (keyless-first) |
| #62 | Drill/retest first-party capture, persisted embeddings, small-model tier, AI-event retention sweeper, evaluations count |
| #68 | Scheduled daily maintenance (cron) + recruiting/journey instrumentation |
| #71 | Client `/observe` wiring (curated drills report into the OS) |
| #74 | **AI coach serving loop** — serves approved first-party answers before paying the model |
| #75 | **Video-analysis serving loop** — same, keyed on the detected-issue signature |

A **parallel session** independently merged **#65** (Action OS tasks/reports +
report retention) into the same module. The two coexist cleanly — their retention
is for *reports*; ours sweeps *AI events*. Expect `tasks.ts`, `reports.ts`, and
`tasks`/`reports` admin pages to be present alongside ours.

## File map (`apps/web/src/lib/intelligence-os/`)

| File | Purpose |
|------|---------|
| `types.ts` | 8 models + settings (camelCase; `embedding` vectors on knowledge/canonical) |
| `config.ts` | `KINDS` record keys, default settings, privacy/safety keyword lists |
| `fingerprint.ts` | `stableHash`, normalize, `semanticFingerprint`, lexical `semanticSimilarity`, dedup keys, `detectSafetyFlags` |
| `embeddings.ts` | keyless-first embeddings: `embedText`, `cosineSimilarity`, `semanticSimilarityHybrid`, `similarityWithVectors`, `similarityBackend` (test injectors: `__setEmbedderForTests`) |
| `store.ts` | repos over `growth_records` + in-process fallback; settings; `__resetIntelligenceStoreForTests` |
| `router.ts` | `resolveWithFirstPartyIntelligence` + helpers (cache/canonical/knowledge/rule/smallModel seams), `logAIActivity`, `createKnowledgeCandidate`, `recordTokenSavings`, `recordPattern`, `upsertCacheEntry`, `genId` |
| `provider-adapter.ts` | `gatewayCallThirdParty` — bridges router to `lib/ai/gateway` |
| `capture.ts` | `captureAiInteraction` (observer), `recordFirstPartyRecommendation`, `coerceSport` |
| `service.ts` | admin ops: create/review/approve knowledge & canonical, evaluations, fix packets, export, `backfillEmbeddings` |
| `retention.ts` | `runRetentionSweep` (summarize/archive aged AI events) |
| `dashboard.ts` | `getIntelligenceOverview`, `getSavingsBreakdown` |
| `reports.ts`, `tasks.ts` | **from parallel #65** (Action OS) — not ours, leave alone |

- **Admin UI:** `apps/web/src/app/admin/intelligence-os/**` (overview, ai-activity, knowledge, canonical-answers, patterns, tasks, reports, token-savings, evaluations, settings). Nav entry in `lib/admin/nav.ts` (id `intelligence-os`).
- **Admin APIs:** `apps/web/src/app/api/admin/intelligence-os/**` (resolve, activity, knowledge, canonical, patterns, evaluations, settings, export, maintenance).
- **Public/telemetry:** `apps/web/src/app/api/intelligence-os/observe` (client drill/retest), `.../cron` (daily maintenance, in `vercel.json` at 06:00 UTC).
- **Instrumented live features:** `api/ai-coach` (serve+capture), `api/video-analysis` (serve+capture), `api/agents/enhance` (cache short-circuit), `api/recruiting/summary` + `api/athletic-journey/narrative` (observer), client `components/coach-mix/CuratedSwingDrills.tsx` (`/observe`).

## How to make it actually save money (operator steps)

The serving loop is **a no-op until canonical answers are approved** (safe by
design). To activate real savings:

1. Let AI features run so AI Activity + knowledge **candidates** accumulate
   (`/admin/intelligence-os/ai-activity`, `/knowledge`).
2. Approve good candidates → promote to **canonical answers**
   (`/admin/intelligence-os/canonical-answers`), set trigger phrases + enable
   auto-serve (approval enables it; gated by the confidence threshold in Settings).
3. From then on, matching **generic, non-personalized** coach/video questions are
   served first-party (no third-party call), and the savings show on the Overview +
   Token Savings pages.
4. For real cross-deploy persistence + real embeddings, set
   `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` (both optional; keyless works).

## Verify locally

```bash
cd apps/web
npx tsc --noEmit
npx eslint src/lib/intelligence-os src/app/api/intelligence-os src/app/api/admin/intelligence-os
npx jest src/lib/intelligence-os --runInBand --cacheDirectory ./.jest-cache-io   # 56 tests
```

## Backlog (prioritized) — with entry points

The high-leverage work is done. Remaining items are polish / diminishing returns:

1. ~~**Re-embed on model change**~~ — ✅ **DONE.** `KnowledgeItem`/`CanonicalAnswer`
   now carry `embeddingModel`; `embeddings.ts` exposes `currentEmbeddingModel()`
   (resolved at call time) and keys its memo on the model so a switch re-embeds
   instead of returning a stale vector; `backfillEmbeddings` (`service.ts`)
   re-embeds rows that are missing a vector **or** whose `embeddingModel` differs
   from the current `AI_EMBEDDINGS_MODEL`, stamping the new model. Covered by a
   service test.
2. ~~**Extend client `/observe`** to other deterministic surfaces — Fix Stack
   (`components/drillmatch/FixStackPanel.tsx`) and retest plans~~ — ✅ **DONE.**
   `FixStackPanel` now reports both the deterministic drill (`kind: 'drill'`,
   feature `fix-stack`) and the retest plan (`kind: 'retest'`, feature
   `fix-stack-retest`) to `/api/intelligence-os/observe`, deduped per
   `(sport, fault, drill)`, fire-and-forget and error-swallowed — mirroring
   `CuratedSwingDrills.tsx`.
3. **Persist query-time embeddings** — `similarityWithVectors` re-embeds the
   *request* per call (memoized per process). Fine for current volume; revisit only
   at large scale.
4. **Do NOT** add the serving loop to `recruiting/summary` or
   `athletic-journey/narrative` — they rephrase one specific athlete's content, so
   they're inherently personalized; the router correctly refuses to serve them from
   shared knowledge. They stay observer-only **by design**.

## Working notes / gotchas

- **Concurrency:** another session actively edits this module. Always
  `git fetch origin master && git reset --hard origin/master` before starting; the
  dev branch repeatedly diverged post-squash-merge and needed
  `git rebase origin/master` + `git push --force-with-lease`. The only conflict so
  far was `dashboard.ts` (Action OS metrics vs our evaluations count) — resolved by
  keeping both.
- **CI:** `master` is branch-protected; land via PR. 18 checks (~5 min). Webhooks
  don't deliver CI *success* — re-check via the GitHub MCP and merge (squash).
- **Container has no `gh`/API token** and the git remote is a local proxy; use the
  `mcp__github__*` tools for all GitHub ops.
- **Honesty rules:** every record carries a `DataSource` label; nothing is
  fabricated; personalized answers are never globally reused; user ids are hashed;
  prompts/responses are summarized + hashed, never stored raw.
