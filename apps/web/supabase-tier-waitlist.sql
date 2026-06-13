-- ============================================================
-- SwingVantage — tier_waitlist (GAI tier rollout interest)
--
-- ADDITIVE migration — run AFTER the main schema. While a paid analysis tier
-- (AI Swing Report, Premium Retest Plan) is on `waitlist` rollout, a signed-in
-- user can register interest with one tap. ONE row per (user, tier) lets the
-- owner count distinct interested athletes and decide when to flip a tier to
-- full rollout from /admin/operating-mode.
--
-- HOW TO APPLY (one-time, ~10s): Supabase → SQL Editor → New query → paste this
-- file → Run. Idempotent (safe to re-run). Additive only — do NOT re-run the
-- main schema file.
--
-- Example rollout signal once data flows in:
--   select tier, count(*) from tier_waitlist group by tier order by count desc;
-- ============================================================

create table if not exists public.tier_waitlist (
  user_id    uuid not null references auth.users (id) on delete cascade,
  tier       text not null check (tier in ('AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN')),
  created_at timestamptz not null default now(),
  primary key (user_id, tier)
);

comment on table public.tier_waitlist is
  'One row per signed-in user who registered interest in a GAI tier while it was on waitlist. Powers the admin rollout decision (distinct interested users per tier).';

create index if not exists tier_waitlist_tier_idx on public.tier_waitlist (tier);

alter table public.tier_waitlist enable row level security;

-- A user may join/leave and see only their own interest rows. Aggregate counts
-- for the admin dashboard are read with the service-role key (bypasses RLS).
drop policy if exists "owner_all" on public.tier_waitlist;
create policy "owner_all" on public.tier_waitlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
