-- ============================================================
-- Player Experience Overhaul — Auto-generated athlete skill tree (WS-03)
-- ------------------------------------------------------------
-- Per-player skill-tree nodes with status, scores, and structured
-- evidence (source sessions/reports/retests + confidence + summary).
-- Owner-only by default; accepted friends with 'view_profile' may read.
--
-- Idempotent + additive. RUN ORDER: run supabase-friends.sql first
-- (defines public.friend_can(), used by the friend-read policy below).
-- ============================================================

create table if not exists public.skill_tree_nodes (
  id                  uuid primary key default gen_random_uuid(),
  player_profile_id   uuid not null,
  user_id             uuid not null references auth.users(id) on delete cascade,
  sport               text not null,
  category            text,
  name                text not null,
  description         text,
  -- locked | available | active | improving | mastered | needs_attention | regressed
  status              text not null default 'locked',
  level               integer not null default 0,
  progress_score      numeric,
  confidence_score    numeric,
  evidence_summary    jsonb not null default '{}'::jsonb,
  source_session_ids  text[] not null default '{}',
  source_report_ids   text[] not null default '{}',
  retest_dates        jsonb not null default '[]'::jsonb,
  last_updated_at     timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  constraint skill_tree_nodes_status_chk
    check (status in ('locked','available','active','improving','mastered','needs_attention','regressed'))
);

create index if not exists skill_tree_nodes_profile_sport_idx
  on public.skill_tree_nodes (player_profile_id, sport);
create index if not exists skill_tree_nodes_user_idx on public.skill_tree_nodes (user_id);

alter table public.skill_tree_nodes enable row level security;

drop policy if exists "Owner can view skill nodes" on public.skill_tree_nodes;
create policy "Owner can view skill nodes" on public.skill_tree_nodes
  for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert skill nodes" on public.skill_tree_nodes;
create policy "Owner can insert skill nodes" on public.skill_tree_nodes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update skill nodes" on public.skill_tree_nodes;
create policy "Owner can update skill nodes" on public.skill_tree_nodes
  for update using (auth.uid() = user_id);

drop policy if exists "Owner can delete skill nodes" on public.skill_tree_nodes;
create policy "Owner can delete skill nodes" on public.skill_tree_nodes
  for delete using (auth.uid() = user_id);

-- Accepted friends with 'view_profile' permission: read-only (guarded).
do $$
begin
  if exists (select 1 from pg_proc where proname = 'friend_can') then
    drop policy if exists "Friends can view shared skill nodes" on public.skill_tree_nodes;
    execute 'create policy "Friends can view shared skill nodes" on public.skill_tree_nodes '
         || 'for select using (public.friend_can(user_id, ''view_profile''))';
  end if;
end $$;
