# WS-06 — Upload-for-friend video workflow

> **Paste this entire file into a fresh Claude Code session.** One workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Dependencies
- **WS-05 (friends):** depends on `apps/web/src/lib/friends/authz.ts`
  (`areAcceptedFriends`, `assertCanReceiveUploadFrom`) and friend permissions
  (`allow_upload_for_me`). Do not re-implement friendship checks — import them.
- **WS-08 (data model):** session/video ownership columns (`athlete_user_id`,
  `athlete_profile_id`, `uploaded_by_user_id`, `assigned_by_user_id`, `upload_context`,
  `permission_status`, `audit_metadata`) + `upload_audit_log` table + RLS.

## Operating rules
- Worktree: `npm run wt create upload-for-friend` → `cd ../swiq-agents/upload-for-friend` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Add `Update:` (athlete-facing). Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest upload-for-friend --runInBand --cacheDirectory ./.jest-cache-uff`.

## What already exists (AUDIT FIRST)
Inspect the current upload/recording flow before changing it (the exploration of these paths is
in this plan's working notes; confirm in code):
- Upload/record UI: `apps/web/src/components/video/`, `apps/web/src/components/record-assist/`,
  and the upload route under `apps/web/src/app/(app)/` (e.g. an upload/analyze page).
- Session/video creation + types: `apps/web/src/store/slices/{sessions,video}.ts`,
  `apps/web/src/store/types.ts` (`LocalSession`, `LocalVideoAnalysis`), DB rows `sessions` /
  `video_analyses` in `apps/web/src/lib/supabase.ts`, mapping in `apps/web/src/lib/db/projection.ts`.
- Server upload/analysis route handlers under `apps/web/src/app/api/` (find where a session/video
  record is created server-side).
**Backward compatibility is mandatory** — the default "upload for me" path must behave exactly as
today. `athlete_user_id` defaults to the legacy `user_id`.

## Objective
When User A uploads a swing/video for User B, allow assigning it to User B **only if** B is in A's
accepted friends list AND B's permission allows upload-for-me. The session/video is created under
**User B's** athlete profile, with a durable audit trail of who/whom/when/why/status.

## Deliverables

### Domain (`apps/web/src/lib/upload-for-friend/`)
- `types.ts` — `UploadContext` (self|friend|coach|parent), `UploadAssignment`
  (`athlete_user_id`, `athlete_profile_id`, `uploaded_by_user_id`, `assigned_by_user_id`,
  `upload_context`, `permission_status`, `audit_metadata`), `UploadStatus`
  (pending|processing|completed|failed).
- `authz.ts` — `resolveUploadTarget({ actorUserId, requestedAthleteUserId })`: validates the
  friendship + `allow_upload_for_me` **server-side** via WS-05 `friends/authz.ts`; returns the
  verified target or throws 403. **Never** trust a client-supplied athlete id without this check.
- `service.ts` — create the session/video under the verified athlete, set ownership columns,
  write an append-only `upload_audit_log` row, fire analytics. Idempotent + auditable.

### API (extend/guard the existing upload route handler)
- Accept an optional `assignToFriendUserId`; server resolves via `authz.ts` from `auth.uid()`.
- Reject (403) if not accepted friends or permission off; (400) on self-assign mismatch.
- Set `uploaded_by_user_id = auth.uid()`, `assigned_by_user_id = auth.uid()`,
  `athlete_user_id = verified target`, `upload_context = 'friend'`, `permission_status`, and
  `audit_metadata` (timestamp, reason, friendship id). Surface status: pending/processing/
  completed/failed.

### UI (extend the upload flow)
- "Upload for me" vs "Upload for a friend" toggle. Friend selector shows **only eligible**
  friends (accepted + `allow_upload_for_me`). Confirmation dialog before assigning to another
  user, clearly showing ownership/privacy. Status display (pending/processing/completed/failed).
- Receiving friend is notified / the session surfaces in **their** Today/journey/history (WS-07).
  Make ownership + permissions visually clear. Mobile-first, accessible; loading/empty/error/
  permission-denied states.

### Analytics
`upload_for_friend_started`, `upload_for_friend_confirmed`, `upload_for_friend_completed`,
`upload_for_friend_failed`, `uploaded_session_received` with
`{ upload_context, permission_status, sport, source_type }`. Coordinate with WS-10.

### Tests (`apps/web/src/lib/upload-for-friend/__tests__/`)
- **Authorization (critical):** non-friend → rejected; friend without `allow_upload_for_me` →
  rejected; accepted friend with permission → allowed; client-supplied arbitrary athlete id is
  ignored in favor of server resolution; self-upload unaffected.
- Ownership columns set correctly; audit-log row written; session attributed to athlete not uploader.

## Security / production-readiness
- Server-side validation of friendship + permission on every assignment. RLS as defense-in-depth.
- No arbitrary user-id assignment from client. No access to private videos/reports/sessions
  without permission. Durable, append-only audit metadata. Backward compatible with existing flow.

## Acceptance
- Friend uploads allowed only under permission rules; friend-assigned videos stored under the
  correct athlete profile; audit metadata complete; existing self-upload flow unchanged.
- tsc/eslint/jest green; no broken routes.

## Definition of done
See `docs/plans/player-experience-overhaul/README.md` → "Shared definitions of done".
</content>
