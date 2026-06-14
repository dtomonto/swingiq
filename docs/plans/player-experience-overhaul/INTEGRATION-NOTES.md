# WS-09 — Services / components integration notes

Cross-cutting hygiene record for the Player Experience Overhaul. Confirms the shared
contracts are single-sourced and there's no duplicated business logic between layers.

## Single sources of truth (import from here — don't re-declare)

| Concern | Canonical location | Consumers |
| --- | --- | --- |
| DB enums / statuses | `apps/web/src/lib/db/shared-enums.ts` (`FriendshipStatus`, `SkillNodeStatus`, `UploadContext`, `PermissionStatus`, `UploadStatus`, `FriendPermissionKey`) | friends, skill-tree, upload-for-friend, supabase types |
| Cross-user authorization | `apps/web/src/lib/friends/authz.ts` (`areAcceptedFriends`, `assertCanUploadForAthlete`, `isAcceptedFriendshipRow`, `rowGrants`) | friends service + API, upload-for-friend service + API |
| STATE→ROW projection | `apps/web/src/lib/db/projection.ts` (`playerProfileRow`, `skillTreeNodeRow`, `friendshipRow`, `uploadAuditRow`) | cloud writes |
| Analytics event names | `packages/core/src/analytics/events.ts` | every feature surface via `track()` |
| Sport identity | `@swingiq/core` `getSportConfig` (accent/emoji/name) | dashboard player card |

## "Compose, never recompute" — verified

The new intelligence layers are thin composers over the pre-existing engines; none reimplement
scoring:
- `player-profile/intelligence.ts` composes `JourneyDashboard` + `PriorityResult` (+ optional AGI
  world model). Archetype (`player-profile/archetype.ts`) reads journey category scores / AGI
  capabilities — it does not compute new scores.
- `skill-tree/generate.ts` maps `JourneyDashboard.branches` → nodes; `skill-tree/regression.ts`
  reads `journey.regressionRisk` + `developmentGaps`.
- `today/engine.ts` selects/ranks pre-computed candidates (agent next-best-action, priority top,
  profile intelligence, skill-tree nodes, retest target). No scoring duplicated.

Each pure builder (`buildProfileIntelligence`, `derivePlayerArchetype`, `buildSkillTree`,
`buildTodayView`, friends helpers, upload-for-friend helpers) is unit-tested; the `use*` hooks are
thin wiring to the store + existing hooks (`useAthleticJourney`, `usePriorityResult`,
`useAgentInsights`, `useRetests`).

## UI reuse

- Shared states use existing primitives: `ui/Card`, `ui/Button`, `ui/Badge`, `ui/EmptyState`,
  `ui/LoadingSkeleton`. No new one-off design system introduced.
- `initialsFrom` (friends/service) is reused by the dashboard player card for the avatar
  placeholder.
- Player-card styling and `FriendCard` are intentionally separate components today (different
  data + density). A future refactor could extract a shared `<AthleteCardFrame>`; not required for
  this scope (noted, not blocking).

## Data access

All cross-user reads/writes go through the RLS-scoped server client (or the admin client for
exact handle resolution only), inside `src/app/api/**` route handlers — no ad-hoc Supabase queries
in components. Local-first store remains the source for single-user product logic.

## Result
No duplicated scoring or authorization logic found. Shared enums/types/contracts are imported from
one place. `tsc` + `eslint` clean.
