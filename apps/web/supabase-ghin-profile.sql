-- ============================================================
-- GHIN handicap integration — golfer_profiles columns
-- ------------------------------------------------------------
-- Adds GHIN identity + handicap provenance to the existing golf profile.
-- Idempotent: safe to run on a live database (IF NOT EXISTS guards).
-- Run once in the Supabase SQL editor (or psql) after deploying the code.
--
--   ghin_number          — the golfer's GHIN/USGA id (6–10 digits)
--   handicap_source      — where `handicap` came from
--                          ('self_reported' | 'ghin_verified')
--   handicap_verified_at — timestamp of the last successful GHIN lookup
-- ============================================================

alter table public.golfer_profiles
  add column if not exists ghin_number          text,
  add column if not exists handicap_source      text not null default 'self_reported',
  add column if not exists handicap_verified_at  timestamptz;

-- Keep the source column to the two known values.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'golfer_profiles_handicap_source_chk'
  ) then
    alter table public.golfer_profiles
      add constraint golfer_profiles_handicap_source_chk
      check (handicap_source in ('self_reported', 'ghin_verified'));
  end if;
end $$;
