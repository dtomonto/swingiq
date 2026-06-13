# WS-10 — Analytics events (foundation-ish, cross-cutting)

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Role
**Owns `packages/core/src/analytics/events.ts`.** Lands the full set of new event names early
so feature workstreams (WS-01..WS-07) can import constants and just call `track()`. Feature WS
fire the events; this WS defines the names + property conventions + (optionally) a typed helper.

## Dependencies
- None to start (do this in Wave 1 alongside WS-08). Feature WS depend on the constants here.

## Operating rules
- Worktree: `npm run wt create analytics-events` → `cd ../swiq-agents/analytics-events` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify: `cd apps/web && npx tsc --noEmit`.

## What already exists (REUSE)
- `track(event, props)` + `trackPageView`, `identifyUser`, `resetUser` in
  `apps/web/src/lib/analytics.ts` (routes to GA4 / PostHog / Plausible / Clarity).
- Event-name registry: `packages/core/src/analytics/events.ts` (`ANALYTICS_EVENTS`,
  `AnalyticsEventName`). 100+ existing events — match the naming style (snake_case).

## Deliverables
Add these constants to `ANALYTICS_EVENTS` (keep alphabetized within their section; match style):
- Today: `today_item_viewed`, `today_item_expanded`, `today_item_completed`
- Dashboard: `dashboard_player_card_viewed`
- Skill tree: `skill_tree_viewed`, `skill_tree_node_opened`, `skill_tree_node_updated`
- Friends: `friend_request_sent`, `friend_request_accepted`, `friend_request_declined`, `friend_removed`
- Upload-for-friend: `upload_for_friend_started`, `upload_for_friend_confirmed`,
  `upload_for_friend_completed`, `upload_for_friend_failed`, `uploaded_session_received`
- Journey/profile: `athlete_journey_updated`, `player_profile_intelligence_updated`

**Property conventions** (document in a comment near the new block): include where meaningful
`sport`, `user_role`, `skill_level`, `recommendation_category`, `source_type`,
`confidence_score`, `upload_context`, `permission_status`.

Optionally add a thin typed wrapper in `apps/web/src/lib/analytics.ts` (e.g.
`trackTodayItem(...)`) only if it reduces duplication — keep it minimal.

## Acceptance
- All listed events exist in the registry with consistent naming; `AnalyticsEventName` compiles;
  feature WS can import constants. tsc green. No behavior change to existing events.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
