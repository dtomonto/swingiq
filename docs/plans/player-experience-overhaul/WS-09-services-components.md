# WS-09 — Shared services/components hygiene (cross-cutting)

> **Paste this entire file into a fresh Claude Code session.** Cross-cutting workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Role
This workstream is a **living guide + reviewer**, not a big feature drop. Its job is to prevent
duplicated business logic between frontend and backend across WS-01..WS-08, and to provide the
small shared abstractions everyone reuses. Best run by the same person coordinating the waves,
or as a short pass after Wave 2.

## Operating rules
- Worktree: `npm run wt create shared-hygiene` → `cd ../swiq-agents/shared-hygiene` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint .`.

## Deliverables
- **Single source of truth for shared types/enums:** ensure WS-08's
  `apps/web/src/lib/db/shared-enums.ts` is the only place statuses/contexts are defined; refactor
  any duplicate string-literal unions to import from it.
- **Authorization contract:** `apps/web/src/lib/friends/authz.ts` (WS-05) is the only place that
  decides cross-user access; WS-06 and any friend-read UI import it — no re-implemented checks.
- **Derive-once intelligence:** profile intelligence (WS-04), journey (`buildJourneyDashboard`),
  priority engine, and Today engine (WS-01) compose rather than re-derive each other's math.
  Flag and fix any copy-pasted scoring.
- **Reusable UI:** the WS-02 player card is the canonical card; WS-05 `FriendCard` reuses it.
  Shared states (loading/empty/error/permission-denied) live as reusable components in
  `apps/web/src/components/ui` or `apps/web/src/components/common`.
- **Data access:** all Supabase reads/writes go through `apps/web/src/lib/db` projection +
  repo patterns; no ad-hoc table queries scattered in components.
- Maintain a short `INTEGRATION-NOTES.md` in this plan dir capturing the agreed shared
  interfaces (type names, function signatures) so parallel agents stay compatible.

## Acceptance
- No duplicated scoring/authz logic; shared enums/types imported from one place; player card
  reused; data access centralized; tsc/eslint green.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
