# WS-01 — Fix Today data overload (focused, capped Today)

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-04 (player profile)** for profile completion + archetype + skill level.
- **WS-03 (skill tree)** for skill-tree-driven recommendations (degrade gracefully if absent).
- Can start in parallel using existing engines; integrate WS-03/04 outputs as they land.

## Operating rules
- Worktree: `npm run wt create today-focus` → `cd ../swiq-agents/today-focus` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Add `Update:` (athlete-facing). Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest today --runInBand --cacheDirectory ./.jest-cache-today`.

## What already exists (REUSE — this is mostly a refinement, not a rebuild)
- **Priority engine:** `apps/web/src/lib/priority/engine.ts` (`computeAthletePriorities`),
  `types.ts` (`AthletePriority`, `PriorityResult`, severity/trend), `consistency.ts`.
- **Agent orchestrator / next-best-action / insights:** `apps/web/src/lib/agents/orchestrator.ts`
  (`runOrchestrator`, caps to 3 insights), `workflows/resume.ts` (`buildResumeState`,
  `getNextBestAction`), `registry.ts`, `scoring.ts`, types in `apps/web/src/lib/agents/types.ts`
  (`AgentAction`, `AgentInsight`, `ActionIntent`).
- **UI:** `apps/web/src/components/agents/DashboardIntelligence.tsx`,
  `apps/web/src/components/dashboard/PriorityPanel.tsx`, `DashboardNextAction.tsx`,
  `apps/web/src/components/agi/TodaysTasks.tsx`, hook `apps/web/src/hooks/useAgentInsights.ts`.
- Journey: `apps/web/src/lib/athletic-journey/` (stage, momentum, retest readiness).

## Objective
Redesign Today so it shows **only what matters today**, capped by user type & skill level,
with secondary depth collapsed by default and expanding into *useful* detail (no dead panels).

## Deliverables

### Today prioritization layer (`apps/web/src/lib/today/`)
Build a thin orchestration over existing engines — **do not duplicate** their scoring:
- `types.ts` — `TodayItem` (id, kind, priority, title, reason, action href/label,
  `collapsedDetail`, source, expiresAt), `TodayKind`
  (`must_do`, `recommended_next`, `retest_due`, `critical_alert`, `active_plan`, secondary kinds),
  `TodayView` (primary[], collapsedSections[]).
- `engine.ts` — `buildTodayView(input): TodayView` that:
  - pulls candidates from priority engine + agent next-best-action + retest due + active plan +
    confidence/regression alerts + profile completion + journey stage,
  - scores by urgency, user type/role, skill level, plan status, retest due, recent regression,
    confidence/uncertainty, profile completion, journey stage, session recency, behavior, business relevance,
  - **caps visible primary items by user type** and pushes overflow into collapsed
    "More insights" / "Optional work":
    - new user → onboarding/profile/first upload/first fix;
    - beginner → 1–3; intermediate → 2–4; advanced → 3–6; returning → unfinished plans/retests/streaks;
    - coach/parent/team/facility → grouped by athlete/team priority, not raw volume.
  - deterministic; pure; no fabrication.

### UI (refine the Today surface — keep existing routes working)
- A focused Today view: Must-do, Recommended next action, Retest due, Critical alert,
  Active plan continuation; secondary sections **collapsed by default**, expanding into real
  content (reports, history, secondary recs). Fix any low-contrast/white-on-white issues.
- Mobile-first, accessible. Empty/loading/error states. Wire through `useAgentInsights` +
  new `useToday` hook. Do not break `(app)/dashboard` or `(app)/journey`.

### Analytics (add to `packages/core/src/analytics/events.ts`, fire via `track()`)
`today_item_viewed`, `today_item_expanded`, `today_item_completed` with
`{ kind, category, user_role, skill_level, source_type, confidence_score }`. Coordinate with WS-10.

### Tests (`apps/web/src/lib/today/__tests__/`)
- caps by user type/skill level; overflow goes to collapsed; urgency ordering; retest-due
  surfaces; regression alert surfaces; new-user gets onboarding set; deterministic output.

## Acceptance
- Today defaults to a focused, non-overwhelming view; secondary collapsed → expands to meaning.
- Visible items vary by user type, role, skill level. Connects to skill tree + journey.
- tsc/eslint/jest green; no broken routes.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
