-- ============================================================
-- Player Experience Overhaul — public handle on player_profiles (WS-04/05)
-- ------------------------------------------------------------
-- Adds a unique, case-insensitive public handle so users can find and
-- friend each other by handle (the chosen add-friend mechanism). The
-- handle is the ONLY publicly-resolvable identifier; resolution happens
-- server-side (admin client, exact match, rate-limited) — never via a
-- client-side scan of player_profiles.
--
-- Idempotent + additive. RUN ORDER: after supabase-player-profile.sql.
-- ============================================================

alter table public.player_profiles
  add column if not exists handle text;

-- Case-insensitive uniqueness (one handle per person, no case collisions).
create unique index if not exists player_profiles_handle_uidx
  on public.player_profiles (lower(handle));

-- Format guard: lowercase letters, digits, underscore; 3–20 chars.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'player_profiles_handle_format_chk') then
    alter table public.player_profiles add constraint player_profiles_handle_format_chk
      check (handle is null or handle ~ '^[a-z0-9_]{3,20}$');
  end if;
end $$;
