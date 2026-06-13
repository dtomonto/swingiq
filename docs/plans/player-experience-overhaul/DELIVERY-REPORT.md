# Player Experience Overhaul — Delivery Report (WS-13)

Branch `claude/busy-pascal-5cteca` · PR #80 → `master`. Delivered 12 of 13 workstreams
(WS-08, WS-10, WS-04, WS-05, WS-03, WS-06, WS-01, WS-02, WS-07, WS-09, WS-11, WS-12); WS-13 is this
report.

## Summary of what changed
SwingVantage's player experience was rebuilt as a lower-noise, intelligence-driven loop:
- **Profile** became a structured *intelligence hub* (archetype + strengths + current focus +
  confidence), composed from existing engines.
- A **skill tree** is auto-generated per player and updates from journey/session/retest signals,
  with regression flowing in from the athletic journey.
- **Today** is now focused and capped by user type, with secondary depth collapsed.
- The **dashboard** leads with a premium player-selection card.
- A secure **friends** foundation (by handle) plus an authorized, audited **upload-for-friend**
  workflow were added net-new.

Everything composes existing intelligence (no recomputation), never fabricates (missing data →
`unknown`/null + basis), and enforces authorization server-side with RLS as defense-in-depth.

## Files (by workstream)
- **WS-08/10 foundation:** `apps/web/supabase-{friends,player-profile,skill-tree,session-ownership,today-recommendations,player-handle}.sql`; `apps/web/src/lib/supabase.ts`; `apps/web/src/lib/db/shared-enums.ts`; `apps/web/src/lib/db/projection.ts`; `packages/core/src/analytics/events.ts`
- **WS-04 profile hub:** `apps/web/src/lib/player-profile/*`; `apps/web/src/components/profile/ProfileIntelligenceHub.tsx`; `apps/web/src/app/(app)/profile/page.tsx`
- **WS-05 friends:** `apps/web/src/lib/friends/*`; `apps/web/src/app/api/friends/**`; `apps/web/src/app/api/player-profile/handle/route.ts`; `apps/web/src/hooks/useFriends.ts`; `apps/web/src/components/friends/*`; `apps/web/src/app/(app)/friends/page.tsx`
- **WS-03 skill tree:** `apps/web/src/lib/skill-tree/*`; `apps/web/src/components/skill-tree/SkillTreeGrid.tsx`
- **WS-06 upload-for-friend:** `apps/web/src/lib/upload-for-friend/*`; `apps/web/src/app/api/uploads/for-friend/route.ts`; `apps/web/src/hooks/useUploadForFriend.ts`; `apps/web/src/components/upload/UploadForFriendPicker.tsx`
- **WS-01 Today:** `apps/web/src/lib/today/*`; `apps/web/src/components/today/TodayView.tsx`; `apps/web/src/app/(app)/today/page.tsx`
- **WS-02 dashboard card:** `apps/web/src/components/dashboard/DashboardPlayerCard.tsx`; `apps/web/src/app/(app)/dashboard/page.tsx`
- **WS-07 integration:** `apps/web/src/lib/skill-tree/regression.ts`; `useSkillTree.ts`; `today/useToday.ts`; `AthleticJourneyDashboard.tsx`
- **WS-09/11/12/13 docs:** this folder (`INTEGRATION-NOTES.md`, `PROD-READINESS-AUDIT.md`, `ACCEPTANCE-REPORT.md`, `DELIVERY-REPORT.md`, `PROGRESS.md`)

## DB / schema changes (run in Supabase, in order)
1. `supabase-friends.sql` — `friendships` + `is_friend_with()` / `friend_can()` helpers (run first)
2. `supabase-player-profile.sql` — `player_profiles`
3. `supabase-skill-tree.sql` — `skill_tree_nodes`
4. `supabase-session-ownership.sql` — athlete-ownership cols on `sessions`/`video_analyses` + append-only `upload_audit_log`
5. `supabase-today-recommendations.sql` — optional Today cache
6. `supabase-player-handle.sql` — unique, case-insensitive `handle` on `player_profiles`

All idempotent + additive. **No new environment variables.**

## New services / components
- Domain libs: `lib/player-profile`, `lib/friends`, `lib/skill-tree`, `lib/upload-for-friend`, `lib/today`
- Hooks: `usePlayerProfileIntelligence`, `useFriends`, `useSkillTree`, `useUploadForFriend`, `useToday`
- API routes: `/api/friends/**`, `/api/player-profile/handle`, `/api/uploads/for-friend`
- UI: profile intelligence hub, friends page (+ FriendCard, MyHandleCard, UploadForFriendPicker), skill-tree grid, Today view + `/today`, dashboard player card

## How Today prioritization works
`today/engine.ts` `buildTodayView` gathers candidates (critical alert from priority, real
retest-due from `useRetests`, new-user onboarding must-do, agent next-best-action, active plan,
skill-tree attention nodes, secondary insights), assigns a deterministic urgency per kind, sorts,
then caps the **primary** list by user type (`deriveUserType`: new 4 / beginner 3 / intermediate 4 /
advanced 6 / returning 4). Overflow goes to collapsed "Optional work" / "More insights".

## How skill-tree generation/update works
`buildSkillTree` maps each `JourneyDashboard` branch to a node and derives a status
(locked/available/active/improving/mastered/needs_attention/regressed) from score + evidence +
flags + regression. No data → a starter tree of `available` nodes (no fabricated scores). It
recomputes from current journey state (which folds in sessions/reports/retests), so it "updates"
automatically; `regression.ts` lights up `regressed` nodes when the journey flags risk. Evidence
(summary, confidence, source ids, last-updated) is attached per node.

## How player-profile intelligence is organized
`buildProfileIntelligence` composes journey (strengths/gaps/stage/confidence/momentum) + priority
(current focus + secondary) + optional AGI world model + activity into a `ProfileIntelligenceSummary`,
plus a deterministic `PlayerArchetype` (`archetype.ts`). Persisted to `player_profiles` via
`playerProfileRow`. Honest coverage levels (none/low/moderate/high) drive the empty-state.

## How friends + permissions work
Add by handle → server resolves via admin client (exact match, enumeration-safe) → `friendships`
row (`pending`). Accept/decline (receiver), remove (either party), per-friendship permissions
(`view_profile`, `view_reports`, `allow_upload_for_me`; safe defaults). `authz.ts` is the single
decision point; RLS limits rows to participants. Cloud-only (gated on `authMode`).

## How upload-for-friend works
`resolveUploadTarget` authorizes the athlete server-side via `assertCanUploadForAthlete` (accepted
friend + `allow_upload_for_me`). `/api/uploads/for-friend` writes the `video_analyses` row under the
athlete with `uploaded_by/assigned_by/upload_context/permission_status`, then appends an immutable
`upload_audit_log` entry. The client never assigns an arbitrary athlete id.

## Analytics events added
`today_item_viewed/expanded/completed`, `dashboard_player_card_viewed`,
`skill_tree_viewed/node_opened/node_updated`, `friend_request_sent/accepted/declined`,
`friend_removed`, `upload_for_friend_started/confirmed/completed/failed`,
`uploaded_session_received`, `athlete_journey_updated`, `player_profile_intelligence_updated`.

## Tests / build results (real)
- `apps/web` `npx tsc --noEmit` → **exit 0 (clean)**
- `npx jest player-profile friends skill-tree upload-for-friend today projection-overhaul` →
  **8 suites, 65 tests passed**
- `eslint` (changed dirs) → clean (1 pre-existing unrelated warning)
- `npm run check:rls` → **90 tables, all RLS-enabled** · `check:honesty` → pass ·
  `security:check` → **0 findings**

## Assumptions
- "Add friend by handle" (per product decision); handles `[a-z0-9_]{3,20}`.
- Friends/upload-for-friend are cloud-only; local/device users see sign-in states.
- Regression heuristic: at journey regression risk, current development-gap categories regress.
- Skill tree builds from live-journey sports (golf/tennis/pickleball/padel); others show "in development".

## Migrations / env required
6 SQL files above (no env vars). Run before exercising friends/upload in a live environment.

## Remaining recommended enhancements
- Coach/parent/team multi-athlete Today roll-ups.
- Populate `source_report_ids` from a report→node mapping.
- Deep-integrate the upload-for-friend picker into the Motion Lab record flow.
- Extract a shared `<AthleteCardFrame>` for player card + FriendCard.
- Live-DB manual smoke test of friend-insert RLS + handle uniqueness pre-GA.
