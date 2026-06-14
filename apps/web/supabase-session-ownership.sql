-- ============================================================
-- Player Experience Overhaul — Session/video ownership + audit (WS-06)
-- ------------------------------------------------------------
-- Additive athlete-ownership + audit columns so a video/session can be
-- uploaded by one user FOR another (a friend), while staying fully
-- backward compatible:
--   * Existing `user_id` keeps its legacy "owner" meaning.
--   * New code reads the athlete as `athlete_user_id` (falls back to user_id).
--   * Every assignment is recorded in an append-only upload_audit_log.
--
-- Idempotent + additive (all `add column if not exists`, nullable). RUN
-- ORDER: run supabase-friends.sql first (defines public.friend_can(),
-- used by the friend-insert policy below).
-- ============================================================

-- ── sessions ─────────────────────────────────────────────────
alter table public.sessions
  add column if not exists athlete_user_id     uuid,
  add column if not exists athlete_profile_id  uuid,
  add column if not exists uploaded_by_user_id uuid,
  add column if not exists assigned_by_user_id uuid,
  add column if not exists upload_context      text not null default 'self',
  add column if not exists permission_status   text not null default 'self_owned',
  add column if not exists audit_metadata      jsonb not null default '{}'::jsonb;

-- ── video_analyses ───────────────────────────────────────────
alter table public.video_analyses
  add column if not exists athlete_user_id     uuid,
  add column if not exists athlete_profile_id  uuid,
  add column if not exists uploaded_by_user_id uuid,
  add column if not exists assigned_by_user_id uuid,
  add column if not exists upload_context      text not null default 'self',
  add column if not exists permission_status   text not null default 'self_owned',
  add column if not exists audit_metadata      jsonb not null default '{}'::jsonb;

-- upload_context: self | friend | coach | parent  (enforced in app + check)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sessions_upload_context_chk') then
    alter table public.sessions add constraint sessions_upload_context_chk
      check (upload_context in ('self','friend','coach','parent'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'video_analyses_upload_context_chk') then
    alter table public.video_analyses add constraint video_analyses_upload_context_chk
      check (upload_context in ('self','friend','coach','parent'));
  end if;
end $$;

-- ── Append-only audit log ────────────────────────────────────
create table if not exists public.upload_audit_log (
  id                 uuid primary key default gen_random_uuid(),
  actor_user_id      uuid not null,   -- who performed the action (auth.uid())
  athlete_user_id    uuid not null,   -- who the session belongs to
  session_id         text,
  video_analysis_id  text,
  action             text not null,   -- e.g. upload_for_friend, self_upload
  context            text not null default 'self',
  permission_status  text,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create index if not exists upload_audit_log_athlete_idx on public.upload_audit_log (athlete_user_id);
create index if not exists upload_audit_log_actor_idx on public.upload_audit_log (actor_user_id);

alter table public.upload_audit_log enable row level security;

-- Participants can read their own audit trail; rows are insert-only
-- (no update/delete policy → immutable by design).
drop policy if exists "Participants can view audit log" on public.upload_audit_log;
create policy "Participants can view audit log" on public.upload_audit_log
  for select using (auth.uid() in (actor_user_id, athlete_user_id));

drop policy if exists "Actor can append audit log" on public.upload_audit_log;
create policy "Actor can append audit log" on public.upload_audit_log
  for insert with check (auth.uid() = actor_user_id);

-- ── Extra RLS on sessions/video_analyses for shared ownership ──
-- These are ADDITIONAL permissive policies (Postgres ORs them with the
-- existing owner policies in supabase-rls.sql), so the legacy self-upload
-- path is unchanged. Server-side authorization remains the primary gate;
-- RLS here is defense-in-depth.

drop policy if exists "Athlete can view assigned sessions" on public.sessions;
create policy "Athlete can view assigned sessions" on public.sessions
  for select using (auth.uid() = athlete_user_id);

drop policy if exists "Uploader can view sessions they created" on public.sessions;
create policy "Uploader can view sessions they created" on public.sessions
  for select using (auth.uid() = uploaded_by_user_id);

drop policy if exists "Athlete can view assigned analyses" on public.video_analyses;
create policy "Athlete can view assigned analyses" on public.video_analyses
  for select using (auth.uid() = athlete_user_id);

drop policy if exists "Uploader can view analyses they created" on public.video_analyses;
create policy "Uploader can view analyses they created" on public.video_analyses
  for select using (auth.uid() = uploaded_by_user_id);

-- A friend with 'allow_upload_for_me' may insert a row assigned to the
-- athlete (the server still validates first). Guarded on friend_can().
do $$
begin
  if exists (select 1 from pg_proc where proname = 'friend_can') then
    drop policy if exists "Friend can upload session for athlete" on public.sessions;
    execute 'create policy "Friend can upload session for athlete" on public.sessions '
         || 'for insert with check (auth.uid() = uploaded_by_user_id '
         || 'and public.friend_can(athlete_user_id, ''allow_upload_for_me''))';

    drop policy if exists "Friend can upload analysis for athlete" on public.video_analyses;
    execute 'create policy "Friend can upload analysis for athlete" on public.video_analyses '
         || 'for insert with check (auth.uid() = uploaded_by_user_id '
         || 'and public.friend_can(athlete_user_id, ''allow_upload_for_me''))';
  end if;
end $$;
