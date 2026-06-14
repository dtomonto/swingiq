# WS-04 — Player profile as the organized intelligence hub

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-08 (data model):** `player_profiles` table + types in `apps/web/src/lib/supabase.ts`.
- Feeds **WS-03 (skill tree)** and **WS-02 (dashboard)** — keep your exported types stable.

## Operating rules
- Worktree: `npm run wt create player-profile` → `cd ../swiq-agents/player-profile` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest player-profile --runInBand --cacheDirectory ./.jest-cache-pp`.
- **Never fabricate data** — every derived field carries an honest `DataSource`-style basis.

## What already exists (reuse, don't rebuild)
- Profile basics: store slice `apps/web/src/store/slices/profile.ts` (`GolferProfileInput`),
  sport profiles, `app_settings`.
- Journey signals already normalize profile+activity: `apps/web/src/lib/athletic-journey/types.ts`
  (`JourneyProfileSignals`, `ActivitySignals`, `JourneySignals`) and
  `apps/web/src/lib/athletic-journey/adapters/from-store.ts` (`buildSignalsFromStore`).
- Recommendations / archetype-ish logic: `apps/web/src/lib/agi/` and `apps/web/src/lib/agents/`.
- Priority/confidence: `apps/web/src/lib/priority/`.

## Objective
Make the player profile the **canonical, structured intelligence memory layer** per athlete —
a clean data model + service + UI that organizes (not dumps) everything the system knows.

## Deliverables

### Domain (`apps/web/src/lib/player-profile/`)
- `types.ts` — `PlayerProfile` aggregate organizing: identity/basics, sports + primary sport,
  skill level, player type/archetype, goals, common misses/issues, equipment refs, preferences,
  session history refs, reports refs, active plans, retests, **skill_tree_state ref**,
  **journey_state ref**, saved insights, recurring patterns, confidence/uncertainty notes,
  system recommendations, user notes, social/friend permissions ref, coach/parent/team/facility
  metadata. Use typed sub-structures; JSON only for genuinely free-form notes.
- `archetype.ts` — deterministic player-archetype derivation from signals (e.g.
  "Power Developer", "Consistency Seeker", "Technician") with evidence + confidence. Pure
  function; deterministic fallback when AI unavailable. Reuse journey category scores.
- `intelligence.ts` — `buildProfileIntelligence(signals): ProfileIntelligenceSummary`:
  top strengths, current focus/weakness, recurring patterns, confidence notes, recommended next
  step. Reuse `buildJourneyDashboard` + priority engine outputs; **do not duplicate** their math —
  compose them. Pure + tested.
- `service.ts` — read/assemble the `PlayerProfile` from store (local-first) and persist the
  structured summary to `player_profiles` via projection (WS-08). One-way derive on session/
  report/retest change. Emits `player_profile_intelligence_updated`.

### UI (`apps/web/src/app/(app)/profile/` + `apps/web/src/components/profile/`)
- A clean, sectioned profile **intelligence hub** (progressive disclosure): Identity, Sports,
  Intelligence summary (strengths / focus / patterns / confidence), Goals & issues, History
  (sessions/reports/retests collapsed), Skill-tree state preview (from WS-03), Social/permissions.
- Default view is scannable; deep data expands on demand. Mobile-first, accessible.
- States: loading, empty (new user → complete-profile CTA), error.

### Analytics
`player_profile_intelligence_updated` with `{ sport, skill_level, archetype, confidence_score }`.
Add the name to `packages/core/src/analytics/events.ts` (coordinate with WS-10).

### Tests (`apps/web/src/lib/player-profile/__tests__/`)
- archetype determinism + fallback; intelligence summary composition; empty/low-data graceful
  handling; no fabricated values when signals missing (returns `unknown`/null + basis).

## Acceptance
- Profile reads as an organized hub, not a data dump; expands into meaningful detail.
- Exposes `skill_tree_state`/`journey_state` refs for WS-03/WS-02/WS-07.
- Deterministic without AI; tests green; tsc/eslint green; no broken routes.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
