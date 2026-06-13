# WS-07 — Athlete journey + wire everything together (capstone)

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- Runs **after** WS-01..WS-06 land (or as they land). This is the integration capstone that
  makes the experience cohesive end-to-end.

## Operating rules
- Worktree: `npm run wt create journey-integration` → `cd ../swiq-agents/journey-integration` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest athletic-journey --runInBand --cacheDirectory ./.jest-cache-journey`.

## What already exists (REUSE)
- `apps/web/src/lib/athletic-journey/` — engine (`buildJourneyDashboard`), `types.ts`
  (`JourneyDashboard`, `StageDefinition`, `MilestoneState`, `SkillBranchState`,
  `MomentumResult`, `RatingAlignmentResult`, `prescription`, `narrative`), per-sport config,
  store, adapters (`from-store.ts`, `useAthleticJourney`).
- Journey UI: `apps/web/src/components/athletic-journey/*` (JourneyMap, SkillTree,
  MilestonePanel, PracticePrescriptionPanel, MissingDataPanel, RatingPanel, JourneyHistory).

## Objective
Update the athlete journey and connect all overhauled systems so they form one coherent loop:
profile ⇄ skill tree ⇄ journey ⇄ Today ⇄ dashboard ⇄ reports/plans/retests ⇄ uploads ⇄ analytics.

## Deliverables / integration points
- **Journey now reflects:** current stage, completed milestones, active focus, next suggested
  milestone, **skill-tree progression (WS-03)**, recent session outcomes, retest readiness,
  regression/improvement indicators, confidence/uncertainty signals.
- **Wire the data flow both ways:** skill tree (WS-03) feeds journey branches and Today (WS-01)
  recommendations; journey stage feeds Today caps and the dashboard player card (WS-02);
  profile intelligence (WS-04) is the shared memory layer all of them read.
- **Connect/update:** athlete journey, Today recommendations, player dashboard, player profile,
  skill tree, reports, plans, retests, session history, upload flow (incl. friend-assigned
  sessions from WS-06 appearing in the right athlete's journey/history), onboarding, profile
  completion, notifications/reminders if present, admin visibility if present, analytics events,
  permission/privacy logic, and empty/loading/error states.
- Ensure friend-assigned sessions (WS-06) flow into the **receiving athlete's** journey, skill
  tree, and history — not the uploader's.

### Analytics
`athlete_journey_updated` with `{ sport, stage, momentum_band, confidence }`. Coordinate with WS-10.

### Tests
- Journey reflects skill-tree changes; retest readiness/regression surface; friend-assigned
  session attributed to athlete; deterministic. Extend `athletic-journey/__tests__`.

## Acceptance
- Skill tree connects to Today + journey; journey reflects all signals; cross-system loop works;
  friend-assigned sessions attributed correctly; tsc/eslint/jest green; no broken routes.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
