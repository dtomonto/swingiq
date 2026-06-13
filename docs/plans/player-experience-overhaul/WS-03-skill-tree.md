# WS-03 — Auto-generated athlete skill tree

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-08 (data model):** `skill_tree_nodes` table + types + shared enums (`SkillNodeStatus`).
- **WS-04 (player profile):** profile signals feed the starter tree; expose `skill_tree_state`.
- Feeds **WS-01 (Today)**, **WS-02 (dashboard)**, **WS-07 (journey)**.

## Operating rules
- Worktree: `npm run wt create skill-tree` → `cd ../swiq-agents/skill-tree` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Add `Update:` (athlete-facing). Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest skill-tree --runInBand --cacheDirectory ./.jest-cache-tree`.
- **Never fabricate data** — every node change carries honest evidence + confidence + basis.

## What already exists (AUDIT FIRST — extend, don't rebuild)
The athlete journey already has skill *branches* and a SkillTree UI. Inspect before building:
- `apps/web/src/lib/athletic-journey/types.ts` — `SkillBranchState`, `ClassificationCategory`,
  `PerformanceMetric`, `ConfidenceLevel`, milestones.
- `apps/web/src/lib/athletic-journey/engine.ts` — `buildJourneyDashboard` (branch scoring).
- `apps/web/src/lib/athletic-journey/config/{golf,tennis,pickleball,padel}.ts` — per-sport
  branches/stages/thresholds (baseball/softball "in development").
- `apps/web/src/components/athletic-journey/SkillTree.tsx` — existing branch UI.
- AI routing (deterministic fallback): the AI gateway is `apps/web/src/lib/ai/gateway.ts`
  (`complete()`, `resolveProvider()`, `selectModel()`); higher-level intelligence in
  `apps/web/src/lib/agi/` (`engine.ts`, `index.ts`). Study how the codebase degrades when AI is
  unavailable/paused. The skill tree MUST work fully without AI (deterministic), and only *enrich*
  with AI summaries when present.

Decision to make in your PR: extend the journey skill-branch model into a richer node graph
**in place**, or add `apps/web/src/lib/skill-tree/` that composes journey branch state +
`skill_tree_nodes` persistence. Prefer composing over duplicating the branch scoring math.

## Objective
A dynamic, per-player skill tree auto-generated from profile + sessions + reports + retests +
intelligence outputs, multi-sport, sport-specific competencies, feeding and fed by the journey,
influencing Today. Graceful with limited data (starter tree from sport/skill level/goals/issues/
player type). Deterministic fallback; AI-optional. Extensible sport config (no brittle hardcoding).

## Deliverables

### Domain (`apps/web/src/lib/skill-tree/` — or extend athletic-journey)
- `types.ts` — `SkillNode` (id, player_profile_id, sport, category, name, description,
  `status` ∈ {locked, available, active, improving, mastered, needs_attention, regressed},
  level, progress_score, confidence_score, **evidence**), `SkillTree` (sport → nodes + edges/
  prerequisites), `NodeEvidence` (why it changed, `source_session_ids`, `source_report_ids`,
  `retest_dates`, confidence, intelligence summary, `last_updated_at`).
- `config/` — per-sport node definitions + prerequisites, reusing/aligning with journey branch
  config. Provide golf + baseball/softball node sets (examples below) and stubs for the rest.
- `generate.ts` — `buildStarterTree(profileSignals, sport): SkillTree` (deterministic; from
  sport + skill level + goals + stated issues + player type).
- `update.ts` — `updateTreeFromEvidence(tree, { sessions, reports, retests }): SkillTree` that
  transitions node status, attaches evidence, and **never overwrites meaningful historical
  evidence** (append/version). Deterministic; AI summary optional enrichment.
- `service.ts` — assemble/persist via `skill_tree_nodes` (WS-08 projection); auto-update hook
  on new session/report/retest; expose tree for dashboard/Today/journey. Emits
  `skill_tree_node_updated`.

**Example golf nodes:** Setup & alignment, Grip/face control, Swing path, Low point control,
Contact quality, Launch window, Distance control, Wedge matrix, Tee-shot discipline, Retest
consistency, Mental reset.
**Example baseball/softball nodes:** Stance/load, Timing, Contact point, Barrel path, Launch
control, Opposite-field control, Power transfer, Plate discipline, Defensive first step, Glove
presentation, Throwing transition, Error recovery.

### UI (extend `apps/web/src/components/athletic-journey/SkillTree.tsx` or new component)
- Node graph with states (locked/available/active/improving/mastered/needs_attention/regressed),
  node detail drawer showing evidence (sources, retests, confidence, summary, last updated).
- Skill-tree preview surfaces in dashboard player card (WS-02), Today (WS-01), journey (WS-07).
- Mobile-first, accessible; loading/empty (starter tree)/error states. Honest confidence labels.

### Analytics
`skill_tree_viewed`, `skill_tree_node_opened`, `skill_tree_node_updated` with
`{ sport, skill_level, node_category, status, confidence_score, source_type }`. Coordinate w/ WS-10.

### Tests (`apps/web/src/lib/skill-tree/__tests__/`)
- starter tree from minimal profile; status transitions from session/report/retest evidence;
  evidence is attached + not destroyed on re-update; deterministic without AI; multi-sport;
  regressed/needs_attention detection.

## Acceptance
- A tree auto-generates for each player; nodes update from session/report/retest data; evidence
  attached; connects to Today + journey + dashboard; deterministic fallback; extensible config.
- tsc/eslint/jest green; no broken routes.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
