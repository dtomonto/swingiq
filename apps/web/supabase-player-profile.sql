-- ============================================================
-- Player Experience Overhaul — Player profile intelligence hub (WS-04)
-- ------------------------------------------------------------
-- The canonical, structured "intelligence memory layer" per athlete.
-- Owner-only by default; accepted friends with the 'view_profile'
-- permission get a read-only view of the row.
--
-- Idempotent + additive. RUN ORDER: run supabase-friends.sql first
-- (defines public.friend_can(), used by the friend-read policy below).
-- ============================================================

create table if not exists public.player_profiles (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references auth.users(id) on delete cascade,
  display_name                  text,
  primary_sport                 text,
  sports                        text[] not null default '{}',
  skill_level                   text,
  player_type                   text,          -- archetype
  goals                         jsonb not null default '[]'::jsonb,
  common_issues                 jsonb not null default '[]'::jsonb,
  preferences                   jsonb not null default '{}'::jsonb,
  profile_intelligence_summary  jsonb not null default '{}'::jsonb,
  journey_state                 jsonb not null default '{}'::jsonb,
  skill_tree_state              jsonb not null default '{}'::jsonb,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create unique index if not exists player_profiles_user_idx on public.player_profiles (user_id);

alter table public.player_profiles enable row level security;

-- Owner: full access.
drop policy if exists "Owner can view player profile" on public.player_profiles;
create policy "Owner can view player profile" on public.player_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert player profile" on public.player_profiles;
create policy "Owner can insert player profile" on public.player_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update player profile" on public.player_profiles;
create policy "Owner can update player profile" on public.player_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Owner can delete player profile" on public.player_profiles;
create policy "Owner can delete player profile" on public.player_profiles
  for delete using (auth.uid() = user_id);

-- Accepted friends with explicit 'view_profile' permission: read-only.
-- Guarded so this file still runs if supabase-friends.sql hasn't been
-- applied yet (the friend-read policy is simply skipped until then).
do $$
begin
  if exists (select 1 from pg_proc where proname = 'friend_can') then
    drop policy if exists "Friends can view shared player profile" on public.player_profiles;
    execute 'create policy "Friends can view shared player profile" on public.player_profiles '
         || 'for select using (public.friend_can(user_id, ''view_profile''))';
  end if;
end $$;
