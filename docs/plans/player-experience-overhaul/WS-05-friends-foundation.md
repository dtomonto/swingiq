# WS-05 — Secure friends / social foundation

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-08 (data model)** must land first: it provides the `friendships` table, the
  `public.is_friend_with(other uuid)` SQL helper, and shared enums
  (`FriendshipStatus`) in `apps/web/src/lib/db/shared-enums.ts`. If WS-08 isn't merged,
  create the `friendships` migration here using the spec in WS-08 and flag the overlap in your PR.

## Operating rules (do not skip)
- Worktree: `npm run wt create friends` → `cd ../swiq-agents/friends` → `npm install`.
- Stage explicit paths; pathspec commits; never `git add -A`; never `--force`/`--no-verify`.
- Commit trailer: project `Co-Authored-By`. Add `Update:` (friends list is athlete-facing).
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest friends --runInBand --cacheDirectory ./.jest-cache-friends`.

## Stack facts
- Auth: Supabase Auth + local fallback. Server: `apps/web/src/lib/supabase-server.ts`
  (`getAuthenticatedUser()`, `createSupabaseServerClient()`). Browser: `apps/web/src/lib/supabase.ts`.
- API routes: Next.js App Router route handlers under `apps/web/src/app/api/`.
- RLS pattern: per-user `auth.uid() = user_id`. Friendship rows are visible to both
  participants only. Privacy placeholders today: `apps/web/src/lib/community/types.ts`
  (`ProfileVisibility`, `allowFollowers`) — supersede/extend these, don't fork them.
- Analytics: `track(event, props)` in `apps/web/src/lib/analytics.ts`; events registry in
  `packages/core/src/analytics/events.ts`.
- Design system: shadcn/ui in `apps/web/src/components/ui` (Card, Button, Badge, Dialog,
  Tabs, Avatar/placeholder). Mobile-first.

## Objective
Ship a **secure, focused MVP friends system** — request / accept / decline / remove / list /
view friend summary — with privacy controls and clean extension points (messaging, shared
reports, challenges, teams, coach review) WITHOUT building a full social network.

## Deliverables

### Backend / domain (`apps/web/src/lib/friends/`)
- `types.ts` — `Friendship`, `FriendshipStatus`, `FriendPermissions`
  (`view_profile`, `view_reports`, `allow_upload_for_me`, extensible), `FriendSummary`
  (privacy-filtered player card: display name, primary sport, level/stage, archetype,
  avatar placeholder — NO private data unless permission grants it).
- `service.ts` — pure-ish domain logic + Supabase calls:
  `sendRequest`, `acceptRequest`, `declineRequest`, `removeFriend`, `listFriends`,
  `listPendingIncoming`, `listPendingOutgoing`, `getFriendSummary`, `updatePermissions`,
  `getFriendshipBetween(a,b)`. **All cross-user reads/writes validated server-side.**
- `authz.ts` — `assertCanViewProfile`, `assertCanReceiveUploadFrom`, `areFriends` — single
  source of truth used by WS-06 too. Export `areAcceptedFriends(uid, other)` that calls the
  `is_friend_with` helper / queries `friendships`.
- Guardrails: cannot friend yourself; one friendship per unordered pair (handle existing
  pending/accepted gracefully — re-request, idempotent accept); decline/remove transitions;
  block status reserved for future. Safe privacy default: new friendships grant
  `view_profile: true` only; everything else off.

### API routes (`apps/web/src/app/api/friends/`)
- `POST /api/friends/requests` (send), `POST /api/friends/requests/[id]/accept`,
  `POST /api/friends/requests/[id]/decline`, `DELETE /api/friends/[id]` (remove),
  `GET /api/friends` (list), `GET /api/friends/pending`, `PATCH /api/friends/[id]/permissions`.
- Every handler: `getAuthenticatedUser()` first; **never** trust a client-supplied actor id;
  derive requester/actor from `auth.uid()`; validate participation; return 401/403/404
  appropriately. Look up target users by a safe identifier (email or a public handle) — NOT by
  raw arbitrary UUID guessing; confirm the lookup path matches existing patterns.

### UI (`apps/web/src/app/(app)/friends/` + `apps/web/src/components/friends/`)
- Friends page: tabs for Friends / Incoming / Outgoing; add-friend input; friend cards using
  the design system; accept/decline/remove actions with optimistic UI + confirmation on remove.
- `FriendCard` shows the privacy-filtered `FriendSummary` (reuse dashboard player-card styling
  from WS-02 if available; otherwise a clean Card). Avatar placeholder.
- Privacy controls UI (per-friend permissions toggle: allow profile view / allow upload-for-me).
- **States:** loading skeletons, empty ("No friends yet — add one"), error, permission-denied.
  Mobile-first, accessible (keyboard, contrast, semantic). Hook for data:
  `apps/web/src/hooks/useFriends.ts` (React Query — repo already uses `@tanstack/react-query`).

### Analytics (add names to `packages/core/src/analytics/events.ts`, fire via `track()`)
`friend_request_sent`, `friend_request_accepted`, `friend_request_declined`, `friend_removed`.
Props: `{ source_type, has_permission }` where sensible. (Coordinate event-registry edits with WS-10.)

### Tests (`apps/web/src/lib/friends/__tests__/`)
- `service.test.ts` / `authz.test.ts`: cannot friend self; duplicate request idempotency;
  accept flips status; decline; remove; `areAcceptedFriends` true only for accepted;
  permission defaults safe; non-participant cannot mutate. Mock Supabase per existing test patterns.

## Security / production-readiness
- Server-side authorization on every mutation; RLS as defense-in-depth.
- No arbitrary user-id assignment from client. Safe privacy defaults (least access).
- Do not expose private profile/report/session data through `FriendSummary` unless the
  friendship permission explicitly allows it.
- This `authz.ts` is the contract WS-06 (upload-for-friend) depends on — keep it stable & exported.

## Acceptance
- Request/accept/decline/remove/list all work end-to-end; RLS enforced; tests pass.
- `areAcceptedFriends` + permission helpers are exported for WS-06.
- tsc/eslint/jest green. No existing route broken.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
