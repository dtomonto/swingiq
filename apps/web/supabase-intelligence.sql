-- ============================================================
-- SwingVantage — analysis_logs (GAI Intelligence observability)
--
-- ADDITIVE migration — run AFTER the main schema. Records ONE row per analysis
-- route decision made by the GAI Intelligence Router (lib/intelligence), so the
-- admin Operating Mode dashboard can show the heuristic/hybrid/full-AI split,
-- cache-hit rate, fallback rate, estimated spend, and estimated cost avoided.
--
-- Written best-effort by the service-role client (lib/intelligence/log.ts); the
-- app degrades to a no-op when Supabase isn't configured, so this table is
-- OPTIONAL — install it only when you want durable, cross-instance observability.
--
-- HOW TO APPLY (one-time, ~10s): Supabase → SQL Editor → New query → paste this
-- file → Run. Idempotent (safe to re-run). Additive only — do NOT re-run the
-- main schema file.
--
-- Example rollups once data flows in:
--   select route, count(*) from analysis_logs group by route order by count desc;
--   select sum(cost_avoided_cents) from analysis_logs where uses_ai = false;
-- ============================================================

create table if not exists public.analysis_logs (
  id                  bigint generated always as identity primary key,
  at                  timestamptz not null default now(),
  tier                text not null,
  route               text not null,
  source_mode         text not null,
  sport               text not null default '',
  issue               text not null default '',
  operating_mode      text not null default '',
  user_plan           text not null default 'free',
  uses_ai             boolean not null default false,
  confidence          numeric(4,3) not null default 0,
  cost_estimate_cents integer not null default 0,
  cost_avoided_cents  integer not null default 0,
  reason              text not null default '',
  user_id             uuid references auth.users (id) on delete set null
);

comment on table public.analysis_logs is
  'One row per GAI route decision. Powers the admin Operating Mode observability rollup (route split, cache/fallback rate, estimated spend vs cost avoided).';

create index if not exists analysis_logs_at_idx       on public.analysis_logs (at desc);
create index if not exists analysis_logs_route_idx    on public.analysis_logs (route);
create index if not exists analysis_logs_sport_idx    on public.analysis_logs (sport);

alter table public.analysis_logs enable row level security;

-- No client policies: this is an admin/observability table written ONLY by the
-- service-role key (which bypasses RLS) and read ONLY through admin-gated server
-- code. With RLS enabled and no policy, anon/auth clients can neither read nor
-- write it — exactly what we want for an internal intelligence surface.
