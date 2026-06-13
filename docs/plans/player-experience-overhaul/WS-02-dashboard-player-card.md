# WS-02 — Dashboard as a premium player-selection screen

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-04 (player profile)** — archetype, strengths, focus, confidence, skill level.
- **WS-03 (skill tree)** — skill-tree preview. Degrade gracefully if WS-03 not yet merged.
- **WS-05 (friends)** — optional friend/social activity strip (feature-flag if not ready).

## Operating rules
- Worktree: `npm run wt create dashboard-card` → `cd ../swiq-agents/dashboard-card` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Add `Update:` (athlete-facing). Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest dashboard --runInBand --cacheDirectory ./.jest-cache-dash`.

## What already exists (REUSE)
- Dashboard route: `apps/web/src/app/(app)/dashboard/page.tsx` (dispatches Golf
  `DashboardContent.tsx` vs `NonGolfDashboard`), `apps/web/src/components/dashboard/`
  (`PriorityPanel`, `DashboardNextAction`, `SecondaryPanels`).
- Journey outputs: `apps/web/src/lib/athletic-journey/` (stage, momentum, branches/skill tree,
  retest readiness) via `useAthleticJourney`.
- Design system: `apps/web/src/components/ui` (shadcn/ui — Card, Badge, Button, Tabs, Progress,
  Avatar placeholder, etc.). Sport config: `apps/web/src/lib/athletic-journey/config/`.

## Objective
Redesign the player dashboard to feel like a **premium sports-video-game player card /
player-selection screen** — game-like but not childish, confidence-building, mobile-first,
progressive-disclosure, sport-themed, consistent with the existing design system.

## Deliverables

### Player card (`apps/web/src/components/dashboard/PlayerCard/`)
A composable, reusable player card showing: athlete/player card frame, sport identity +
sport-specific visual treatment (use sport config + design tokens — no hard-coded one-offs),
avatar/profile-image placeholder, primary sport, current level/stage, player archetype,
top strengths, current weakness/focus, active plan, next retest, recent performance trend,
confidence score, journey progress, **skill-tree preview (WS-03)**, and an optional friend/
social activity strip (WS-05). Default view clean; expand for depth.
- Build sport theming via tokens/variants (CVA), not per-page styling. Keep card reusable so
  WS-05 `FriendCard` can reuse it.

### Integration
- Mount the player card at the top of `(app)/dashboard`, feeding it WS-04 profile intelligence +
  journey outputs. Keep existing panels (priority/next-action/secondary) but subordinate them
  under progressive disclosure so the card is the hero.
- Don't break Golf vs non-Golf dispatch; the card must work for all six sports (graceful when a
  sport's journey config is "in development").

### Analytics
`dashboard_player_card_viewed` with `{ sport, skill_level, archetype, confidence_score }`.
Add to `packages/core/src/analytics/events.ts` (coordinate with WS-10).

### Tests
- Card renders for each sport with/without data (new user → placeholders, not crashes);
  confidence/level/strengths display logic; snapshot or RTL render tests under `__tests__`.

## Acceptance
- Dashboard feels like a premium player-selection/player-card experience; mobile-first; clean
  default with expandable depth; sport-specific identity; consistent design system.
- tsc/eslint/jest green; no broken routes; empty/loading/error states.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
