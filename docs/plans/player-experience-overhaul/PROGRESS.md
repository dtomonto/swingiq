# Player Experience Overhaul — PROGRESS & HANDOFF

> **Pick up here in a new session.** This tracks what's shipped, what remains, and exactly
> how to resume. Source of truth for the overall plan is `README.md` in this folder; the
> 13 workstreams are `WS-01…WS-13`.

Branch: `claude/busy-pascal-5cteca` (all work pushed). Open PR: `claude/busy-pascal-5cteca → master`.

---

## Status at a glance (11 of 13 workstreams shipped)

| WS | Title | Status | Commit |
| --- | --- | --- | --- |
| WS-08 | Data model & migrations (foundation) | ✅ done | `706e94e` |
| WS-10 | Analytics events | ✅ done | `706e94e` |
| WS-04 | Player profile intelligence hub | ✅ done | `9afaa4e` |
| WS-05 | Friends foundation (by handle) | ✅ done | `9afaa4e` |
| WS-03 | Auto-generated skill tree | ✅ done | `4b1c95b` |
| WS-06 | Upload-for-friend workflow | ✅ done | `4b1c95b` |
| WS-01 | Focused Today | ✅ done | `cb137e6` |
| WS-02 | Dashboard player card | ✅ done | `cb137e6` |
| WS-07 | Journey integration (capstone) | ✅ done | (this branch) |
| WS-09 | Services/components hygiene | ⏳ TODO (cross-cutting) | — |
| WS-11 | Production-readiness audit | ⏳ TODO (cross-cutting) | — |
| WS-12 | Acceptance-criteria QA | ⏳ TODO (closeout) | — |
| WS-13 | Final delivery report | ⏳ TODO (closeout) | — |

Plan docs (`docs/plans/player-experience-overhaul/`) committed in `a63132d` / `045177c`.

---

## Environment notes (read before resuming)

- Develop on `claude/busy-pascal-5cteca`; commit with **explicit pathspecs** (never `git add -A`).
- Fresh container needs: `npm install` (root) + `npm run build --workspace=@swingiq/core`
  **before** `tsc`/`jest` (jest maps `@swingiq/core` → its built `dist`).
- Verify from `apps/web`: `npx tsc --noEmit` · `npx eslint .` · `npx jest <area> --runInBand --cacheDirectory ./.jest-cache-<area>`.
- There is a recurring tooling artifact where a stray trailing `</content>` line lands at the
  end of newly-written files. After writing files, strip it:
  `for f in $(grep -rln "^</content>" apps/web/src 2>/dev/null); do sed -i '${/^<\/content>$/d}' "$f"; done`

## Migrations to run in Supabase (in order)

Run once in the Supabase SQL editor (idempotent + additive):
1. `apps/web/supabase-friends.sql` (defines `is_friend_with` / `friend_can` helpers — run first)
2. `apps/web/supabase-player-profile.sql`
3. `apps/web/supabase-skill-tree.sql`
4. `apps/web/supabase-session-ownership.sql`
5. `apps/web/supabase-today-recommendations.sql` (optional cache)
6. `apps/web/supabase-player-handle.sql` (adds unique `handle` to `player_profiles`)

No new environment variables required. Friends/upload-for-friend features are **cloud-only**
(gated on `authMode() === 'cloud'`); local/device mode shows sign-in states.

---

## What shipped — where the code lives

**Foundation (WS-08/WS-10)**
- Migrations: `apps/web/supabase-{friends,player-profile,skill-tree,session-ownership,today-recommendations,player-handle}.sql`
- Types: `apps/web/src/lib/supabase.ts` (new tables + `handle`), `apps/web/src/lib/db/shared-enums.ts`
- Projection builders: `apps/web/src/lib/db/projection.ts` (`playerProfileRow`, `skillTreeNodeRow`, `friendshipRow`, `uploadAuditRow`)
- Events: `packages/core/src/analytics/events.ts` (today_*, dashboard_player_card_viewed, skill_tree_*, friend_*, upload_for_friend_*, athlete_journey_updated, player_profile_intelligence_updated)

**WS-04 Player profile hub** — `apps/web/src/lib/player-profile/` (`types`, `archetype`, `intelligence`,
`usePlayerProfileIntelligence`), UI `apps/web/src/components/profile/ProfileIntelligenceHub.tsx`,
mounted in `apps/web/src/app/(app)/profile/page.tsx`.

**WS-05 Friends** — `apps/web/src/lib/friends/` (`types`, `authz` ← the seam WS-06 uses, `service`),
API `apps/web/src/app/api/friends/**` + `apps/web/src/app/api/player-profile/handle/route.ts`,
hook `apps/web/src/hooks/useFriends.ts`, UI `apps/web/src/components/friends/*` + `apps/web/src/app/(app)/friends/page.tsx`.

**WS-03 Skill tree** — `apps/web/src/lib/skill-tree/` (`generate`, `useSkillTree`),
UI `apps/web/src/components/skill-tree/SkillTreeGrid.tsx` (surfaced in the profile hub detail).

**WS-06 Upload-for-friend** — `apps/web/src/lib/upload-for-friend/service.ts`,
route `apps/web/src/app/api/uploads/for-friend/route.ts`, hook `apps/web/src/hooks/useUploadForFriend.ts`,
UI `apps/web/src/components/upload/UploadForFriendPicker.tsx` (on the friends page). Motion Lab untouched.

**WS-01 Today** — `apps/web/src/lib/today/` (`engine`, `useToday`), UI `apps/web/src/components/today/TodayView.tsx`,
route `apps/web/src/app/(app)/today/page.tsx`.

**WS-02 Dashboard card** — `apps/web/src/components/dashboard/DashboardPlayerCard.tsx`,
mounted top of `apps/web/src/app/(app)/dashboard/page.tsx` (golf + non-golf).

### Tests (all passing: 62)
`apps/web/src/lib/{player-profile,friends,skill-tree,upload-for-friend,today}/__tests__/` +
`apps/web/src/lib/db/__tests__/projection-overhaul.test.ts`. Run all:
`cd apps/web && npx jest player-profile friends skill-tree upload-for-friend today projection-overhaul --runInBand --cacheDirectory ./.jest-cache-all`

---

## Architectural conventions established (reuse these)

- **Compose, never recompute.** Profile intelligence, skill tree, and Today all *compose* the
  existing engines (athletic-journey `buildJourneyDashboard`, priority `computeAthletePriorities`,
  agents `useAgentInsights`/next-best-action). Pure builder fns take pre-computed inputs and are
  unit-tested; thin `use*` hooks wire them to the store/journey hooks.
- **Honest data.** No fabrication — missing signals yield `unknown`/null with a `basis`.
- **Security.** `apps/web/src/lib/friends/authz.ts` is the single cross-user authz source
  (`areAcceptedFriends`, `assertCanUploadForAthlete`). Server derives actor ids from auth; RLS is
  defense-in-depth; handle lookup is admin-client exact-match + enumeration-safe.

---

## How to resume — remaining work

### WS-07 — Journey integration (capstone) — ✅ DONE
- `apps/web/src/lib/skill-tree/regression.ts` maps the journey's regression state onto skill-tree
  nodes; wired through `useSkillTree`, so `regressed` nodes now light up wherever the tree is
  consumed (dashboard card, profile hub, Today skill-focus). Pure + unit-tested.
- Today now consumes a **real retest-due** signal from `useRetests().topTarget` (`due`/`overdue`).
- `athlete_journey_updated` fires from `AthleticJourneyDashboard` alongside stage-calc analytics.
- Friend-assigned sessions already attribute to the athlete (row written under
  `athlete_user_id`/`user_id = athlete`; verified in WS-06 tests).
- Decision: did NOT add a duplicate skill-tree grid to the journey page — the journey already has
  its branch-based `SkillTree`; integration is in the shared data layer (regression + composition).

### WS-09 / WS-11 — cross-cutting (can run alongside) — next
- WS-09: confirm no duplicated scoring/authz; shared enums imported from `lib/db/shared-enums.ts`;
  player card reused for `FriendCard` where sensible. Write `INTEGRATION-NOTES.md` here.
- WS-11: run `npm run check:rls`, `npm run security:check`, `npm run check:honesty`; verify safe
  privacy defaults, audit immutability, a11y/states. Write `PROD-READINESS-AUDIT.md` here.

### WS-12 / WS-13 — closeout
- WS-12: verify every acceptance-criteria checkbox (see `WS-12-acceptance-qa.md`); write `ACCEPTANCE-REPORT.md`.
- WS-13: write `DELIVERY-REPORT.md` with real `tsc`/`eslint`/`jest`/build output.

### Known follow-ups / honest gaps
- Skill tree surfaces in the **profile hub** + dashboard snapshot + Today focus; regression now
  flows from the journey. A dedicated full-page skill-tree view is a nice-to-have (not built).
- `retestDue` in Today is now populated from `useRetests().topTarget` (due/overdue). ✓ (WS-07)
- WS-06 UI initiates from the friends page (assign latest local analysis). Deep integration into
  the Motion Lab record flow was deliberately deferred to avoid destabilizing the 567-line wizard.

---

## One-paragraph resume prompt (paste into a new session)

> Continue the SwingVantage "Player Experience Overhaul" on branch `claude/busy-pascal-5cteca`.
> Read `docs/plans/player-experience-overhaul/PROGRESS.md` for state. WS-08, WS-10, WS-04, WS-05,
> WS-03, WS-06, WS-01, WS-02, WS-07 are shipped, tested (65 passing), and pushed. Do the closeouts
> next: **WS-09** (services/components hygiene), **WS-11** (production-readiness audit), **WS-12**
> (acceptance QA), **WS-13** (delivery report) — see their `WS-*.md` files. Run `npm install` +
> `npm run build --workspace=@swingiq/core` first; verify with `tsc`/`eslint`/`jest` from
> `apps/web`; commit with explicit pathspecs + the project trailers.
