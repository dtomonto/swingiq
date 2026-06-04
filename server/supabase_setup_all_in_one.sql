-- ============================================================
-- SwingIQ — ALL-IN-ONE Supabase setup (paste this ONE file)
-- ============================================================
--
-- WHAT THIS IS:
--   The required database setup in a single copy-paste. It merges
--   server/supabase_schema.sql (tables) with the stricter per-user
--   security rules from apps/web/supabase-rls.sql (hardening), so you
--   don't have to run two files.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste ALL of this →
--   Run. Wait for "Success." That's it.
--
-- SAFE TO RE-RUN: every statement is idempotent (uses
--   "if not exists" / "create or replace" / "drop ... if exists"),
--   so running it twice will not error or duplicate anything.
--
-- WHAT IT DOES NOT DO: nothing in here exposes your proprietary
--   technology — these are tables for USER data only (profiles,
--   sessions, shots). Your engines live in your code, not the database.
--
-- Optional extras you can run later (not required to go live):
--   • server/supabase_schema_video.sql     — cloud video-analysis history
--   • server/supabase_schema_research.sql  — admin benchmark research
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES  (Supabase Auth manages users in auth.users)
-- ============================================================

-- ── Golfer Profiles ──────────────────────────────────────────
create table if not exists golfer_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  handedness text not null default 'right' check (handedness in ('right', 'left')),
  handicap numeric(5,1),
  scoring_average numeric(5,1),
  low_round numeric(5,1),
  primary_goal text not null default '',
  current_miss text not null default '',
  desired_shot_shape text not null default 'straight',
  practice_frequency text not null default 'weekly',
  practice_environment text not null default 'outdoor_range',
  launch_monitor_owned text,
  home_simulator boolean not null default false,
  indoor_outdoor text not null default 'outdoor' check (indoor_outdoor in ('indoor', 'outdoor')),
  ball_used text not null default '',
  mat_or_grass text not null default 'mat' check (mat_or_grass in ('mat', 'grass')),
  skill_level text not null default 'intermediate' check (skill_level in ('beginner', 'intermediate', 'advanced', 'elite')),
  coaching_style text not null default 'balanced' check (coaching_style in ('data_first', 'feel_first', 'balanced')),
  data_sophistication text not null default 'beginner' check (data_sophistication in ('beginner', 'intermediate', 'advanced', 'elite')),
  injury_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Golf Bags ─────────────────────────────────────────────────
create table if not exists golf_bags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Bag',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Clubs ─────────────────────────────────────────────────────
create table if not exists clubs (
  id uuid primary key default uuid_generate_v4(),
  bag_id uuid references golf_bags(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  club_name text not null,
  club_category text not null check (club_category in (
    'driver', 'fairway_wood', 'hybrid', 'long_iron', 'mid_iron', 'short_iron', 'wedge', 'putter'
  )),
  brand text not null default '',
  model text not null default '',
  loft numeric(5,2),
  lie_angle numeric(5,2),
  length numeric(5,2),
  shaft text not null default '',
  shaft_flex text check (shaft_flex in ('ladies', 'senior', 'regular', 'stiff', 'x_stiff', 'tour_x')),
  shaft_weight numeric(6,2),
  grip text not null default '',
  typical_carry numeric(6,1),
  typical_total numeric(6,1),
  confidence_score integer not null default 50 check (confidence_score >= 0 and confidence_score <= 100),
  dispersion_score integer not null default 50 check (dispersion_score >= 0 and dispersion_score <= 100),
  current_primary_miss text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Sessions ─────────────────────────────────────────────────
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  date_time timestamptz not null default now(),
  launch_monitor_brand text not null default 'manual',
  launch_monitor_model text not null default '',
  software_source text not null default '',
  indoor_outdoor text not null default 'outdoor' check (indoor_outdoor in ('indoor', 'outdoor')),
  mat_or_grass text not null default 'mat' check (mat_or_grass in ('mat', 'grass')),
  ball_type text not null default '',
  weather_condition text not null default '',
  altitude numeric(8,2),
  temperature numeric(5,1),
  wind_speed numeric(6,1),
  wind_direction text not null default '',
  notes text not null default '',
  shot_count integer not null default 0,
  clubs_used text[] not null default '{}',
  primary_diagnosis_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Shots ─────────────────────────────────────────────────────
create table if not exists shots (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  club_id uuid references clubs(id) on delete set null,
  club_name text not null,
  club_category text not null default 'mid_iron',
  shot_number integer not null default 1,
  date_time timestamptz not null default now(),
  swing_type text not null default 'full',
  intended_shot_shape text,
  actual_shot_shape text,
  is_outlier boolean not null default false,
  user_notes text not null default '',
  ball_data jsonb not null default '{}',
  club_data jsonb not null default '{}',
  strike_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Diagnoses ─────────────────────────────────────────────────
create table if not exists diagnoses (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  club_id uuid references clubs(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  primary_issue text not null,
  supporting_data jsonb not null default '[]',
  likely_swing_cause text not null default '',
  confidence_score integer not null default 50,
  score_impact numeric(4,2) not null default 0,
  urgency text not null default 'medium',
  practice_priority integer not null default 1,
  drill_categories text[] not null default '{}',
  retest_protocol jsonb not null default '{}',
  what_improvement_looks_like text not null default '',
  is_swing_issue boolean not null default true,
  is_strike_issue boolean not null default false,
  is_equipment_concern boolean not null default false,
  is_setup_issue boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Swing Videos ─────────────────────────────────────────────
create table if not exists swing_videos (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_url text not null,
  camera_angle text not null default 'down_the_line',
  frame_rate integer not null default 30,
  duration_seconds numeric(8,2) not null default 0,
  thumbnail_url text,
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'processing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

-- ── Swing Phase Grades ────────────────────────────────────────
create table if not exists swing_phase_grades (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references swing_videos(id) on delete cascade not null,
  phase text not null,
  phase_label text not null,
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  score integer not null check (score >= 0 and score <= 100),
  timestamp_seconds numeric(8,3) not null default 0,
  what_looks_good text[] not null default '{}',
  potential_issues text[] not null default '{}',
  supporting_data_points text[] not null default '{}',
  recommended_drill text not null default '',
  youtube_search_url text not null default '',
  retest_metric text not null default '',
  is_estimated boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ── Saved Drills ─────────────────────────────────────────────
create table if not exists saved_drills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  drill_id text not null,
  drill_name text not null,
  youtube_url text not null,
  is_helpful boolean,
  diagnosis_category text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ── Practice Logs ─────────────────────────────────────────────
create table if not exists practice_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references sessions(id) on delete set null,
  diagnosis_id uuid references diagnoses(id) on delete set null,
  routine_name text not null,
  completed_at timestamptz not null default now(),
  ball_count integer not null default 0,
  duration_minutes integer not null default 0,
  notes text not null default '',
  felt_helpful boolean
);

-- ── Progress Snapshots ────────────────────────────────────────
create table if not exists progress_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  snapshot_date date not null default current_date,
  period text not null default '30_day' check (period in ('7_day', '30_day', '90_day')),
  overall_score integer not null default 50,
  driver_score integer not null default 50,
  iron_score integer not null default 50,
  wedge_score integer not null default 50,
  face_control_score integer not null default 50,
  path_control_score integer not null default 50,
  strike_quality_score integer not null default 50,
  distance_control_score integer not null default 50,
  consistency_score integer not null default 50,
  most_improved_metric text not null default '',
  most_regressed_metric text not null default '',
  primary_weakness text not null default '',
  session_count integer not null default 0,
  total_shots integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── User Goals ────────────────────────────────────────────────
create table if not exists user_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_type text not null,
  target_metric text not null,
  target_value numeric not null,
  current_value numeric,
  target_date date,
  is_achieved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Coach Notes ──────────────────────────────────────────────
create table if not exists coach_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  coach_id uuid references auth.users(id) on delete set null,
  session_id uuid references sessions(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================

create index if not exists shots_session_id_idx on shots(session_id);
create index if not exists shots_user_id_idx on shots(user_id);
create index if not exists shots_club_name_idx on shots(club_name);
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_date_time_idx on sessions(date_time desc);
create index if not exists diagnoses_user_id_idx on diagnoses(user_id);
create index if not exists diagnoses_session_id_idx on diagnoses(session_id);
create index if not exists clubs_bag_id_idx on clubs(bag_id);
create index if not exists clubs_user_id_idx on clubs(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TIMESTAMPS
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists golfer_profiles_updated_at on golfer_profiles;
create trigger golfer_profiles_updated_at before update on golfer_profiles
  for each row execute function update_updated_at();

drop trigger if exists golf_bags_updated_at on golf_bags;
create trigger golf_bags_updated_at before update on golf_bags
  for each row execute function update_updated_at();

drop trigger if exists clubs_updated_at on clubs;
create trigger clubs_updated_at before update on clubs
  for each row execute function update_updated_at();

drop trigger if exists sessions_updated_at on sessions;
create trigger sessions_updated_at before update on sessions
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — every user sees ONLY their own data
-- ============================================================
-- Turn RLS on for every table (no-op if already on).

alter table golfer_profiles    enable row level security;
alter table golf_bags          enable row level security;
alter table clubs              enable row level security;
alter table sessions           enable row level security;
alter table shots              enable row level security;
alter table diagnoses          enable row level security;
alter table swing_videos       enable row level security;
alter table swing_phase_grades enable row level security;
alter table saved_drills       enable row level security;
alter table practice_logs      enable row level security;
alter table progress_snapshots enable row level security;
alter table user_goals         enable row level security;
alter table coach_notes        enable row level security;

-- ── Core tables: explicit per-operation policies (hardened) ──
-- golfer_profiles
drop policy if exists "Users manage own profile"     on golfer_profiles;
drop policy if exists "Users can view own profile"   on golfer_profiles;
drop policy if exists "Users can insert own profile" on golfer_profiles;
drop policy if exists "Users can update own profile" on golfer_profiles;
drop policy if exists "Users can delete own profile" on golfer_profiles;
create policy "Users can view own profile"   on golfer_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on golfer_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on golfer_profiles for update using (auth.uid() = user_id);
create policy "Users can delete own profile" on golfer_profiles for delete using (auth.uid() = user_id);

-- golf_bags
drop policy if exists "Users manage own bags"          on golf_bags;
drop policy if exists "Users can view own golf bags"   on golf_bags;
drop policy if exists "Users can insert own golf bags" on golf_bags;
drop policy if exists "Users can update own golf bags" on golf_bags;
drop policy if exists "Users can delete own golf bags" on golf_bags;
create policy "Users can view own golf bags"   on golf_bags for select using (auth.uid() = user_id);
create policy "Users can insert own golf bags" on golf_bags for insert with check (auth.uid() = user_id);
create policy "Users can update own golf bags" on golf_bags for update using (auth.uid() = user_id);
create policy "Users can delete own golf bags" on golf_bags for delete using (auth.uid() = user_id);

-- clubs
drop policy if exists "Users manage own clubs"     on clubs;
drop policy if exists "Users can view own clubs"   on clubs;
drop policy if exists "Users can insert own clubs" on clubs;
drop policy if exists "Users can update own clubs" on clubs;
drop policy if exists "Users can delete own clubs" on clubs;
create policy "Users can view own clubs"   on clubs for select using (auth.uid() = user_id);
create policy "Users can insert own clubs" on clubs for insert with check (auth.uid() = user_id);
create policy "Users can update own clubs" on clubs for update using (auth.uid() = user_id);
create policy "Users can delete own clubs" on clubs for delete using (auth.uid() = user_id);

-- sessions
drop policy if exists "Users manage own sessions"     on sessions;
drop policy if exists "Users can view own sessions"   on sessions;
drop policy if exists "Users can insert own sessions" on sessions;
drop policy if exists "Users can update own sessions" on sessions;
drop policy if exists "Users can delete own sessions" on sessions;
create policy "Users can view own sessions"   on sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on sessions for delete using (auth.uid() = user_id);

-- shots
drop policy if exists "Users manage own shots"     on shots;
drop policy if exists "Users can view own shots"   on shots;
drop policy if exists "Users can insert own shots" on shots;
drop policy if exists "Users can update own shots" on shots;
drop policy if exists "Users can delete own shots" on shots;
create policy "Users can view own shots"   on shots for select using (auth.uid() = user_id);
create policy "Users can insert own shots" on shots for insert with check (auth.uid() = user_id);
create policy "Users can update own shots" on shots for update using (auth.uid() = user_id);
create policy "Users can delete own shots" on shots for delete using (auth.uid() = user_id);

-- ── Remaining tables: single per-user policy ────────────────
drop policy if exists "Users manage own diagnoses" on diagnoses;
create policy "Users manage own diagnoses" on diagnoses for all using (auth.uid() = user_id);

drop policy if exists "Users manage own videos" on swing_videos;
create policy "Users manage own videos" on swing_videos for all using (auth.uid() = user_id);

drop policy if exists "Users manage own phase grades" on swing_phase_grades;
create policy "Users manage own phase grades" on swing_phase_grades for all
  using (video_id in (select id from swing_videos where user_id = auth.uid()));

drop policy if exists "Users manage own saved drills" on saved_drills;
create policy "Users manage own saved drills" on saved_drills for all using (auth.uid() = user_id);

drop policy if exists "Users manage own practice logs" on practice_logs;
create policy "Users manage own practice logs" on practice_logs for all using (auth.uid() = user_id);

drop policy if exists "Users manage own progress" on progress_snapshots;
create policy "Users manage own progress" on progress_snapshots for all using (auth.uid() = user_id);

drop policy if exists "Users manage own goals" on user_goals;
create policy "Users manage own goals" on user_goals for all using (auth.uid() = user_id);

drop policy if exists "Users manage own coach notes" on coach_notes;
create policy "Users manage own coach notes" on coach_notes for all
  using (auth.uid() = user_id or coach_id = auth.uid());

-- ============================================================
-- DONE. You should see "Success. No rows returned."
-- Seed data is intentionally omitted — rows are created by the app
-- once a real user signs up via Supabase Auth.
-- ============================================================
