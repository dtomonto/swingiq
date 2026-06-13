# Live-DB smoke test — Player Experience Overhaul

Run this against a real Supabase project (the parts unit tests can't exercise: RLS policies,
friend-insert, handle uniqueness, audit immutability). ~15 minutes. Use **two browser profiles**
(or two browsers) so you can be signed in as two athletes at once — call them **A** and **B**.

## 0. Prerequisites
- Apply the 6 migrations in the Supabase SQL editor, in this order (idempotent + additive):
  1. `apps/web/supabase-friends.sql`  2. `apps/web/supabase-player-profile.sql`
  3. `apps/web/supabase-skill-tree.sql`  4. `apps/web/supabase-session-ownership.sql`
  5. `apps/web/supabase-today-recommendations.sql`  6. `apps/web/supabase-player-handle.sql`
- App configured for cloud auth (`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` set). Friends features are
  hidden in local/device mode by design.
- Two confirmed accounts (A, B). Note their `auth.users.id` from Supabase → Authentication.

## 1. Profile intelligence hub (WS-04)
- As A, open `/profile`. New account → expect the **"intelligence hub almost ready"** empty state
  (no fabricated numbers). After logging a session/upload, expect archetype + strengths + current
  focus + a confidence note; "Skill tree & why this" expands to the node grid.

## 2. Claim handles (WS-04/05)
- As A, `/friends` → **Your handle** → claim `alpha_test`. As B → claim `bravo_test`.
- Negative checks: try `AB` (too short) and `Has Space` → rejected client-side. Try claiming
  `alpha_test` as B → **409 "already taken"** (handle uniqueness via DB index).

## 3. Friends: request / accept / privacy (WS-05)
- As A, `/friends` → add `bravo_test` → expect neutral **"Request sent … (if that handle exists)"**.
- Enumeration check: add `nobody_xyz` (unused) → **same neutral message** (no leak).
- Self check: add `alpha_test` (yourself) → **"You can't add yourself."**
- As B, `/friends` → **Requests** tab shows A's incoming → **Accept**. Both now see each other under
  **Friends**. B's card for A shows only public fields until permission is granted.
- Remove check: from either side, **Remove** → disappears for both.

## 4. Upload-for-friend authorization + audit (WS-06)
- Re-friend A↔B (accept again). On A's `/friends`, the **"Upload a swing for a friend"** card should
  be **empty** ("a friend must enable…") because B hasn't granted upload yet.
- As B, on B's friend card for A, toggle **"Let them upload videos for me"** ON.
- As A, the picker now lists B. Pick B → **Confirm** → expect success ("Sent to …").
- As B, the assigned analysis appears under **B's** history (`/profile` / motion-lab history), not A's.

### SQL spot-checks (Supabase SQL editor)
```sql
-- The row is owned by the ATHLETE (B), uploaded/assigned by A, context friend.
select id, user_id, athlete_user_id, uploaded_by_user_id, assigned_by_user_id,
       upload_context, permission_status
from public.video_analyses
order by created_at desc limit 3;

-- An immutable audit entry ties actor (A) → athlete (B).
select actor_user_id, athlete_user_id, action, context, permission_status, created_at
from public.upload_audit_log order by created_at desc limit 3;
```
Expect: `athlete_user_id = user_id = B`, `uploaded_by_user_id = assigned_by_user_id = A`,
`upload_context = 'friend'`; audit row `action = 'upload_for_friend'`.

### Negative authorization checks (must FAIL)
- As B, toggle upload permission **OFF**, then as A try the picker → friend no longer eligible; if
  you force the call, the API returns **403 "has not enabled friend uploads."**
- Direct API probe (as A, while NOT friends with some user X):
  `POST /api/uploads/for-friend {"athleteUserId":"<X-uuid>"}` → **403** (never writes a row).
- RLS belt-and-suspenders — as B (no upload grant), in SQL with B's session this insert must be
  rejected by policy:
  ```sql
  insert into public.video_analyses (id, user_id, athlete_user_id, uploaded_by_user_id, upload_context)
  values ('probe1', '<A-uuid>', '<A-uuid>', auth.uid(), 'friend'); -- expect: RLS violation
  ```

## 5. Today (WS-01) + dashboard card (WS-02) + skill tree (WS-03/07)
- As A with some data, `/today`: a small **capped** primary list (varies by user type); secondary
  sections **collapsed**, expanding into real items. A due/overdue retest shows a **Retest** item.
- `/dashboard`: the **player card** leads (archetype, stage, confidence, momentum, skill snapshot)
  for golf and a non-golf sport.
- Trigger a regression (a worsening fault / quiet period) → a skill-tree node should show
  **Regressed**, and it should surface in Today's skill-focus.

## 6. Backward-compatibility
- Do a **normal self** upload via Motion Lab → still lands in your own history exactly as before
  (`upload_context` defaults to `self`). No existing route should 404 or error.

## Analytics (optional)
In your analytics tool, confirm events fire: `player_profile_intelligence_updated`,
`dashboard_player_card_viewed`, `skill_tree_viewed`, `friend_request_sent/accepted`,
`upload_for_friend_completed`, `today_item_viewed`, `athlete_journey_updated`.

## Pass criteria
All positive flows work; **all negative authorization checks fail closed**; SQL shows correct
ownership + an immutable audit row; self-upload unchanged. Then PR #80 is safe to merge.
