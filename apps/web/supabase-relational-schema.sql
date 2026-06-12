-- ============================================================
-- SwingVantage — RELATIONAL Cloud Schema (account = source of truth)
--
-- This is the authoritative schema for cross-device, "never lose
-- progress" accounts. Every entity the app tracks gets a real row in a
-- real table, scoped to the owning account by Row Level Security.
--
-- WHY THIS REPLACES THE OLD CORE TABLES:
--   The earlier server/supabase_schema.sql defined golf-only tables
--   (golfer_profiles, clubs, sessions, shots, golf_bags) with uuid ids
--   and columns that DO NOT match the data the app actually stores
--   (multi-sport, string ids like "sess_…", swing_score, etc.). Nothing
--   in the app ever wrote to them — only the stubbed export/restore API
--   routes referenced them, and those returned 503. They are safe to
--   redefine. We drop + recreate those 5, aligned to the real store
--   shapes, and ADD the multi-sport + progress tables that were missing.
--
-- HOW TO APPLY (one-time, ~30s): open your Supabase project →
--   SQL Editor → New query → paste this whole file → Run. It is
--   idempotent (safe to re-run). Until it is applied the app keeps
--   working from its local cache and reports "saved on this device".
-- ============================================================

-- ── Safe teardown of the unused golf-only scaffolds ──────────
-- CASCADE only removes dependent FK constraints/policies, not your data
-- (these tables are empty). Children first.
drop table if exists public.shots           cascade;
drop table if exists public.clubs           cascade;
drop table if exists public.sessions        cascade;
drop table if exists public.golfer_profiles cascade;
drop table if exists public.golf_bags       cascade;

-- A reusable trigger to keep updated_at honest on every write.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PROFILES
-- ============================================================

-- One golf profile per user (singleton). Columns mirror GolferProfileInput.
create table public.golfer_profiles (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  name                text not null default '',
  handedness          text not null default 'right',
  handicap            numeric(5,1),
  ghin_number          text,                                    -- GHIN/USGA golfer id (6–10 digits)
  handicap_source      text not null default 'self_reported',   -- 'self_reported' | 'ghin_verified'
  handicap_verified_at timestamptz,                             -- last successful GHIN sync
  scoring_average     numeric(5,1),
  low_round           numeric(5,1),
  primary_goal        text not null default '',
  current_miss        text not null default '',
  desired_shot_shape  text not null default 'straight',
  practice_frequency  text not null default '',
  practice_environment text not null default '',
  launch_monitor_owned text,
  home_simulator      boolean not null default false,
  indoor_outdoor      text not null default 'outdoor',
  ball_used           text not null default '',
  mat_or_grass        text not null default 'mat',
  skill_level         text not null default 'intermediate',
  coaching_style      text not null default 'balanced',
  data_sophistication text not null default 'beginner',
  injury_notes        text not null default '',
  updated_at          timestamptz not null default now()
);

-- Non-golf player profiles (tennis / baseball / softball). The per-sport
-- profile shape is loose + evolving, so it is stored as a document keyed
-- by (user, sport). One row per sport the user has set up.
create table public.sport_profiles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  sport      text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, sport)
);

-- ============================================================
-- EQUIPMENT  (one row per item)
-- ============================================================

-- Golf clubs. Columns mirror the store LocalClub.
create table public.clubs (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default '',
  category      text not null default 'iron',
  brand         text not null default '',
  model         text not null default '',
  loft          numeric(5,2),
  typical_carry numeric(6,1),
  typical_total numeric(6,1),
  shaft_flex    text not null default '',
  notes         text not null default '',
  sort_order    integer not null default 0,
  created_at    text not null default '',
  updated_at    timestamptz not null default now()
);

create table public.tennis_rackets (
  id                  text primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  brand               text not null default '',
  model               text not null default '',
  year                text not null default '',
  head_size_sq_in     numeric(6,2),
  weight_strung_oz    numeric(6,2),
  balance_pts_hl      numeric(6,2),
  swingweight         numeric(6,2),
  stiffness_ra        numeric(6,2),
  string_pattern      text not null default '',
  grip_size           text not null default '',
  string_brand        text not null default '',
  string_tension_mains numeric(6,2),
  condition           text not null default 'good',
  notes               text not null default '',
  created_at          text not null default '',
  updated_at          timestamptz not null default now()
);

create table public.baseball_bats (
  id                  text primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  brand               text not null default '',
  model               text not null default '',
  year                text not null default '',
  length_in           numeric(6,2),
  weight_oz           numeric(6,2),
  bat_drop            numeric(6,2),   -- "drop" is a SQL keyword; mapped to bat.drop in code
  barrel_diameter_in  numeric(6,2),
  material            text not null default '',
  piece_construction  text not null default '',
  balance             text not null default '',
  certification       text not null default '',
  composite_broken_in boolean,
  condition           text not null default 'good',
  notes               text not null default '',
  created_at          text not null default '',
  updated_at          timestamptz not null default now()
);

-- Slow-pitch + fast-pitch softball bats share one table, split by discipline.
create table public.softball_bats (
  id                  text primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  discipline          text not null default 'slow',   -- 'slow' | 'fast'
  brand               text not null default '',
  model               text not null default '',
  year                text not null default '',
  length_in           numeric(6,2),
  weight_oz           numeric(6,2),
  end_load_oz         numeric(6,2),
  balance             text not null default '',
  barrel_length_in    numeric(6,2),
  compression_rating  numeric(6,2),
  material            text not null default '',
  certification_stamps text not null default '',
  break_in_status     text not null default '',
  condition           text not null default 'good',
  notes               text not null default '',
  created_at          text not null default '',
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- SESSIONS + SHOTS
-- ============================================================

-- A practice session (any sport). Shots live in their own table; the
-- computed diagnoses for the session are stored as a JSON array on the row.
create table public.sessions (
  id             text primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null default '',
  date           text not null default '',
  sport          text not null default 'golf',
  club_name      text not null default '',
  club_category  text not null default '',
  launch_monitor text not null default '',
  indoor_outdoor text not null default 'outdoor',
  mat_or_grass   text not null default 'mat',
  notes          text not null default '',
  shot_count     integer not null default 0,
  swing_score    numeric(6,2),
  diagnoses      jsonb not null default '[]'::jsonb,
  created_at     text not null default '',
  updated_at     timestamptz not null default now()
);

create index sessions_user_idx       on public.sessions (user_id);
create index sessions_user_sport_idx on public.sessions (user_id, sport);

-- Individual shots. The launch-monitor metric bags stay JSONB (sparse,
-- 40+ optional fields) but each shot is a real, queryable row.
create table public.shots (
  id                  text primary key,
  session_id          text not null references public.sessions (id) on delete cascade,
  user_id             uuid not null references auth.users (id) on delete cascade,
  club_id             text,
  club_name           text not null default '',
  club_category       text not null default '',
  shot_number         integer not null default 1,
  date_time           text not null default '',
  swing_type          text not null default 'full',
  intended_shot_shape text,
  actual_shot_shape   text,
  is_outlier          boolean not null default false,
  user_notes          text not null default '',
  ball_data           jsonb not null default '{}'::jsonb,
  club_data           jsonb not null default '{}'::jsonb,
  strike_data         jsonb not null default '{}'::jsonb,
  created_at          text not null default ''
);

create index shots_session_idx on public.shots (session_id);
create index shots_user_idx    on public.shots (user_id);

-- ============================================================
-- VIDEO ANALYSES  (one row per analysed swing video)
-- ============================================================

create table public.video_analyses (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_id    text,
  sport         text not null default 'golf',
  file_name     text not null default '',
  overall_score numeric(6,2) not null default 0,
  camera_angle  text not null default '',
  phases_count  integer not null default 0,
  issues_count  integer not null default 0,
  primary_issue text,
  -- Full validated AI analysis for the swing (durable per-profile history, not
  -- just summary metadata). Nullable: metadata-only rows stay valid. The raw
  -- swing video is never stored — frames are processed on-device.
  analysis      jsonb,
  created_at    text not null default ''
);

create index video_analyses_user_idx on public.video_analyses (user_id);

-- ============================================================
-- PROGRESS SINGLETONS  (one row per user)
-- Headline metrics are promoted to columns for server-side queries
-- (streaks, XP); the rest of each evolving object is kept as a document.
-- ============================================================

create table public.training_progress (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  active_diagnosis_id text,
  active_session_id   text,
  streak_days         integer not null default 0,
  last_practice_date  text,
  started_at          text,
  completed_steps     jsonb not null default '[]'::jsonb,
  drills_completed    jsonb not null default '{}'::jsonb,
  milestones_earned   jsonb not null default '[]'::jsonb,
  updated_at          timestamptz not null default now()
);

create table public.app_settings (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  units                   text not null default 'yards',
  theme                   text not null default 'light',
  color_theme             text not null default 'standard',
  show_estimated_warnings boolean not null default true,
  coaching_style          text not null default 'balanced',
  coaching_tone           text not null default 'beginner',
  default_club_for_diagnose text not null default 'Driver',
  onboarding_complete     boolean not null default false,
  language                text,
  usage_category          text,
  usage_category_set_at   text,
  updated_at              timestamptz not null default now()
);

-- Community / gamification: xp_total promoted for leaderboards; the full
-- badge/challenge/xp-event document is kept as JSONB.
create table public.community_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  xp_total   integer not null default 0,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index community_state_xp_idx on public.community_state (xp_total desc);

create table public.tutorial_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.agent_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at triggers (collections + singletons that have the column)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'golfer_profiles','sport_profiles','clubs','tennis_rackets','baseball_bats',
    'softball_bats','sessions','training_progress','app_settings','community_state',
    'tutorial_progress','agent_state'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY  — every table: a user can only touch their own rows
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'golfer_profiles','sport_profiles','clubs','tennis_rackets','baseball_bats',
    'softball_bats','sessions','shots','video_analyses','training_progress',
    'app_settings','community_state','tutorial_progress','agent_state'
  ] loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('drop policy if exists "owner_all" on public.%1$s;', t);
    execute format(
      'create policy "owner_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
