# WS-08 — Data model additions & migrations (FOUNDATION)

> **Paste this entire file into a fresh Claude Code session.** You are implementing one
> workstream of the SwingVantage "Player Experience Overhaul" (see
> `docs/plans/player-experience-overhaul/README.md`). This is the **foundation** — land it
> before WS-03/04/05/06/07.

## Operating rules (do not skip)
- Work in your own worktree: `npm run wt create data-model` → `cd ../swiq-agents/data-model` → `npm install`.
- Stage explicit paths; commit with a pathspec (`git commit -m "…" -- path/a path/b`). Never `git add -A`.
- After commit, `git show --stat HEAD` must list only your files. Never `--force`/`--no-verify`.
- Commit trailer: project `Co-Authored-By`. Add `Dev-Update:` for the schema milestone.
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint .`.
- **Never fabricate data.** Honor `DataSource` labels.

## Stack facts
- Supabase/Postgres. Migrations are **idempotent SQL files at `apps/web/*.sql`** named
  `supabase-<feature>.sql`, applied manually via the Supabase SQL editor. Use
  `create table if not exists` / `add column if not exists` guards.
- DB TypeScript types are hand-maintained inline in `apps/web/src/lib/supabase.ts`
  (`Database['public']['Tables']` with Row/Insert/Update). There is NO generated types file.
- Store↔DB mapping lives in `apps/web/src/lib/db/projection.ts` + `cloud-repo.ts`.
- RLS pattern (`apps/web/supabase-rls.sql`): every table has `user_id`, policies
  `using (auth.uid() = user_id)` for select/insert/update/delete.
- Existing core tables: `golfer_profiles`, `sport_profiles`, `clubs`, `sessions`, `shots`,
  `video_analyses`, `training_progress`, `app_settings`, `community_state`,
  `tutorial_progress`, `agent_state`.

## Objective
Add the schema + TypeScript types that later workstreams build on, **additively** and
**idempotently**, without breaking existing tables or sync. Prefer typed/structured columns
for anything used in permissions, querying, analytics, or product logic; JSON only for
genuinely free-form blobs.

## Deliverables (new migration files at `apps/web/`)

1. `supabase-player-profile.sql` — `player_profiles` table (canonical intelligence hub; WS-04):
   `id uuid pk default gen_random_uuid()`, `user_id uuid not null`, `display_name text`,
   `primary_sport text`, `sports text[]`, `skill_level text`, `player_type text`,
   `goals jsonb`, `common_issues jsonb`, `preferences jsonb`,
   `profile_intelligence_summary jsonb`, `journey_state jsonb`, `skill_tree_state jsonb`,
   `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
   Index on `user_id`. Full RLS (owner-only) + a SELECT policy that also allows accepted
   friends per privacy (see note below — gate behind a `is_friend_with(...)` SQL helper that
   WS-05 will define; until then, owner-only).

2. `supabase-skill-tree.sql` — `skill_tree_nodes` table (WS-03):
   `id uuid pk`, `player_profile_id uuid not null`, `user_id uuid not null`, `sport text`,
   `category text`, `name text`, `description text`, `status text` (locked|available|active|
   improving|mastered|needs_attention|regressed), `level int`, `progress_score numeric`,
   `confidence_score numeric`, `evidence_summary jsonb`, `source_session_ids text[]`,
   `source_report_ids text[]`, `retest_dates jsonb`, `last_updated_at timestamptz`.
   Index `(player_profile_id, sport)`. RLS owner-only (+ friend-read via helper later).

3. `supabase-friends.sql` — `friendships` table (WS-05):
   `id uuid pk`, `requester_user_id uuid not null`, `receiver_user_id uuid not null`,
   `status text` (pending|accepted|declined|blocked), `permissions jsonb` (e.g.
   `{ "view_profile": true, "view_reports": false, "allow_upload_for_me": false }`),
   `created_at`, `updated_at`. Unique on the unordered pair (use a generated `least/greatest`
   pair column or a unique index on `(least(requester,receiver), greatest(requester,receiver))`).
   RLS: a row is visible/updatable only to the two participants
   (`auth.uid() in (requester_user_id, receiver_user_id)`), with WITH CHECK constraints so a
   requester can only create rows where `requester_user_id = auth.uid()`. Define a SQL helper
   `public.is_friend_with(other uuid) returns boolean` (security definer, stable) returning
   true when an `accepted` friendship exists between `auth.uid()` and `other`. This helper is
   the hook other tables' friend-read policies use.

4. `supabase-session-ownership.sql` — additive columns on `sessions` and `video_analyses`
   (WS-06) — all `add column if not exists`, nullable, backfill-safe:
   `athlete_user_id uuid`, `athlete_profile_id uuid`, `uploaded_by_user_id uuid`,
   `assigned_by_user_id uuid`, `upload_context text` (self|friend|coach|parent; default 'self'),
   `permission_status text` (default 'self_owned'), `audit_metadata jsonb`.
   **Do not change existing `user_id` semantics** — keep it as the legacy owner; new code
   reads `athlete_user_id ?? user_id`. Update RLS so the athlete AND an authorized uploader
   can see the row, and a friend-with-permission can insert a row assigned to the athlete
   (server enforces; RLS is defense-in-depth). Add an append-only
   `upload_audit_log` table (`id, actor_user_id, athlete_user_id, session_id, action,
   context, permission_status, metadata jsonb, created_at`) — insert-only RLS for participants,
   no update/delete.

5. `supabase-today-recommendations.sql` — OPTIONAL `today_recommendations` cache table (WS-01).
   The Today engine is computed client-side from the store today; only add this table if you
   also wire server persistence. If unsure, **stub the SQL but leave it commented** and let
   WS-01 decide. Columns: `id, user_id, player_profile_id, priority int, category text,
   title text, reason text, source text, action_url text, collapsed_detail jsonb,
   expires_at timestamptz, created_at`.

6. **TypeScript types** in `apps/web/src/lib/supabase.ts`: add Row/Insert/Update entries for
   each new table to `Database['public']['Tables']`, matching the SQL exactly. Add shared
   enum string-literal types (e.g. `FriendshipStatus`, `SkillNodeStatus`, `UploadContext`,
   `PermissionStatus`) in a new `apps/web/src/lib/db/shared-enums.ts` and re-export, so feature
   workstreams import one source of truth.

7. **Projection stubs** in `apps/web/src/lib/db/projection.ts`: add row-builder functions
   (`playerProfileRow()`, `skillTreeNodeRow()`, `friendshipRow()`, etc.) following existing
   patterns, so cloud sync can persist these when feature WS wire them up. Keep them pure.

## RLS / security notes (critical)
- Friend-read access on `player_profiles` / `skill_tree_nodes` MUST go through the
  `is_friend_with()` helper AND respect a per-row/per-friendship permission flag — never blanket.
- All new tables: `enable row level security` + explicit policies. No table left open.
- Never trust client-supplied `athlete_user_id`/`assigned_by_user_id`; document that the
  server action (WS-06) sets these from `auth.uid()` + a verified friendship.

## Analytics
None fired here. Add the event-name constants other WS need to
`packages/core/src/analytics/events.ts` only if WS-10 hasn't yet (coordinate; WS-10 owns that file).

## Acceptance
- All new SQL is idempotent (safe to run twice) and additive (no `drop`, no destructive `alter`).
- `npx tsc --noEmit` passes with the new types; `projection.ts` compiles.
- Existing sync (`relational-sync-provider`) still type-checks and is untouched in behavior.
- `npm run check:rls` (root script) passes if it inspects new tables.
- Document in the PR exactly which `.sql` files must be run in Supabase and in what order.

## Definition of done
See "Shared definitions of done" in `docs/plans/player-experience-overhaul/README.md`.
Output a short note listing migrations to run + new shared types so downstream WS can import them.
</content>
