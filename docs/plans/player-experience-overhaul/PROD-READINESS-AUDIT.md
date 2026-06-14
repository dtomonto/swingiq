# WS-11 — Production-readiness audit

Audit of the Player Experience Overhaul (Waves 1–4 + WS-07). Evidence captured 2026-06-13 on
branch `claude/busy-pascal-5cteca`.

## Automated checks (all passing)

| Check | Command | Result |
| --- | --- | --- |
| RLS coverage | `npm run check:rls` | ✅ 90 tables across 27 schema files — all have RLS enabled |
| Honesty copy | `npm run check:honesty` | ✅ report + upload honesty markers intact |
| Custom security | `npm run security:check` | ✅ 0 findings (0 critical, 0 warnings) |
| Type-check | `apps/web` `npx tsc --noEmit` | ✅ clean |
| Lint | `npx eslint` (changed dirs) | ✅ clean (1 pre-existing unrelated warning in AthleticJourneyDashboard narrative refiner) |
| Unit tests | `npx jest <overhaul areas>` | ✅ 65/65 |

## Authorization / privacy

- ✅ **Server-side authz** for friend upload (`assertCanUploadForAthlete`) and friend access — the
  client never assigns an athlete id; `resolveUploadTarget` derives + validates it from the session.
- ✅ **RLS defense-in-depth**: friend-read on `player_profiles` / `skill_tree_nodes` gated by
  `friend_can(user_id,'view_profile')`; friend INSERT on `sessions`/`video_analyses` gated by
  `friend_can(athlete,'allow_upload_for_me')`; `upload_audit_log` is insert-only (no update/delete
  policy → immutable).
- ✅ **No arbitrary user-id from client**: friend requests derive requester from `auth.uid()`
  (also enforced by RLS `with check`); upload target resolved server-side.
- ✅ **Safe privacy defaults**: new friendships grant `view_profile` only; `view_reports` +
  `allow_upload_for_me` default off. `FriendSummary` hides extended fields unless `view_profile`.
- ✅ **Handle enumeration guard**: lookup is admin-client exact-match; the send-request API returns
  a neutral `{status:'sent'}` for both success and unknown handle; rate-limited.
- ✅ **Audit trail**: `upload_audit_log` records actor, athlete, action, context, permission_status,
  metadata, timestamp.

## Reliability / compatibility

- ✅ **Backward compatible**: all migrations additive + idempotent; legacy `user_id` semantics
  unchanged (new code reads `athlete_user_id ?? user_id`); new columns nullable with safe defaults.
- ✅ **No existing routes changed**; `/today` is new; Motion Lab self-upload flow untouched.
- ✅ Friends/upload features gated on `authMode() === 'cloud'`; local/device mode shows sign-in
  states (no crash).

## UX quality

- ✅ Loading / empty / error / permission-denied (sign-in) states on the friends surface; loading
  + no-data states on profile hub, skill tree, Today, player card.
- ✅ Mobile-first layouts; semantic/ARIA on tabs (`role="tablist"`), buttons, `aria-expanded`
  disclosures, `aria-hidden` on decorative icons; theme tokens (no white-on-white).
- ✅ Honest data: missing signals render `—`/`unknown`/"not enough data" with a basis — never
  fabricated numbers.

## Tests present for the security-critical paths

- ✅ prioritization/Today (`today/__tests__`), skill-tree updates (`skill-tree/__tests__`),
  friends authz (`friends/__tests__`), upload-for-friend authorization
  (`upload-for-friend/__tests__`).

## Follow-ups (non-blocking)

- The single pre-existing eslint warning (narrative refiner setState-in-effect) is unrelated to
  this work; left untouched.
- Manual end-to-end against a live Supabase (run the 6 migrations) recommended before GA — the
  friend INSERT RLS policies and handle uniqueness can only be exercised against a real DB.
- Optional: extract a shared `<AthleteCardFrame>` for player card + FriendCard (cosmetic).

## Verdict
No blocking authorization, privacy, RLS, honesty, or security-scan issues. Production-ready pending
the live-DB migration run + a manual smoke test.
