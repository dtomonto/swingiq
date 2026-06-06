-- ============================================================
-- SwingVantage — community analytics tables (badges + challenges)
--
-- ADDITIVE migration — run AFTER the main schema. Promotes individual
-- badge unlocks and per-challenge progress OUT of the community_state
-- JSON document into their own COLUMNED tables, so they can power
-- cross-user analytics: badge rarity, challenge completion rates, etc.
--
-- These are derived projections of each user's synced community_state
-- (which stays the source of truth) — one row per (user, badge) and per
-- (user, challenge). The app never reads them back; they exist purely so
-- aggregate queries are fast and queryable.
--
-- HOW TO APPLY (one-time, ~10s): Supabase → SQL Editor → New query →
-- paste this file → Run. Idempotent. Additive only — do NOT re-run the
-- main schema file.
--
-- Cross-user aggregates run server-side with the service role (RLS below
-- scopes each user to their own rows). Examples:
--   -- badge rarity (rarest first):
--   select badge_id, count(*) as unlocked_by
--   from badge_unlocks group by badge_id order by unlocked_by asc;
--   -- challenge completion rate:
--   select challenge_id,
--     count(*) filter (where status = 'completed')::float / nullif(count(*),0)
--       as completion_rate
--   from challenge_progress group by challenge_id;
-- ============================================================

create table if not exists public.badge_unlocks (
  id         text primary key,                 -- '<user_id>:<badge_id>'
  user_id    uuid not null references auth.users (id) on delete cascade,
  badge_id   text not null,
  earned_at  text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists badge_unlocks_user_idx  on public.badge_unlocks (user_id);
create index if not exists badge_unlocks_badge_idx on public.badge_unlocks (badge_id);

create table if not exists public.challenge_progress (
  id           text primary key,               -- '<user_id>:<challenge_id>'
  user_id      uuid not null references auth.users (id) on delete cascade,
  challenge_id text not null,
  status       text not null default 'active' check (status in ('active', 'completed')),
  joined_at    text,
  completed_at text,
  progress     numeric(6,2) not null default 0,
  xp_earned    integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists challenge_progress_user_idx      on public.challenge_progress (user_id);
create index if not exists challenge_progress_challenge_idx on public.challenge_progress (challenge_id);
create index if not exists challenge_progress_status_idx    on public.challenge_progress (challenge_id, status);

-- Row Level Security: each user can only touch their own rows.
-- (Cross-user analytics run server-side with the service role.)
do $$
declare t text;
begin
  foreach t in array array['badge_unlocks', 'challenge_progress'] loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('drop policy if exists "owner_all" on public.%1$s;', t);
    execute format(
      'create policy "owner_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
