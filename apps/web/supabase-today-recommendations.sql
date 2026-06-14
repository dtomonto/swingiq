-- ============================================================
-- Player Experience Overhaul — Today recommendations cache (WS-01)
-- ------------------------------------------------------------
-- OPTIONAL. The Today engine is computed client-side from the store
-- today; this table only matters if WS-01 chooses to persist/serve a
-- precomputed Today view (e.g. for coach/parent/team roll-ups or
-- cross-device continuity). Safe to skip until then — creating it has no
-- effect on the client-only path.
--
-- Idempotent + additive. Owner-only RLS.
-- ============================================================

create table if not exists public.today_recommendations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  player_profile_id  uuid,
  priority           integer not null default 0,
  category           text,
  title              text not null,
  reason             text,
  source             text,
  action_url         text,
  collapsed_detail   jsonb not null default '{}'::jsonb,
  expires_at         timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists today_recommendations_user_idx on public.today_recommendations (user_id);

alter table public.today_recommendations enable row level security;

drop policy if exists "Owner can view today recs" on public.today_recommendations;
create policy "Owner can view today recs" on public.today_recommendations
  for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert today recs" on public.today_recommendations;
create policy "Owner can insert today recs" on public.today_recommendations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update today recs" on public.today_recommendations;
create policy "Owner can update today recs" on public.today_recommendations
  for update using (auth.uid() = user_id);

drop policy if exists "Owner can delete today recs" on public.today_recommendations;
create policy "Owner can delete today recs" on public.today_recommendations
  for delete using (auth.uid() = user_id);
