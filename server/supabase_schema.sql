-- ============================================================
-- SwingIQ — Supabase PostgreSQL Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Users (managed by Supabase Auth) ─────────────────────────
-- No separate users table needed — Supabase auth.users handles this.

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

  -- Ball data (JSONB for flexibility)
  ball_data jsonb not null default '{}',
  -- Structure: { carry_distance, total_distance, roll_distance, ball_speed,
  --   launch_angle_vertical, launch_direction_horizontal, spin_rate, spin_axis,
  --   apex_height, descent_angle, side_carry, lateral_offline, curve,
  --   flight_time, shot_shape, smash_factor }

  -- Club delivery data
  club_data jsonb not null default '{}',
  -- Structure: { club_speed, attack_angle, club_path, face_angle_to_target,
  --   face_to_path, dynamic_loft, spin_loft, low_point_position, ... }

  -- Strike data
  strike_data jsonb not null default '{}',
  -- Structure: { impact_location_lateral, impact_location_vertical }

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
-- Indexes for performance
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
-- Row Level Security (RLS) — Users only see their own data
-- ============================================================

alter table golfer_profiles enable row level security;
alter table golf_bags enable row level security;
alter table clubs enable row level security;
alter table sessions enable row level security;
alter table shots enable row level security;
alter table diagnoses enable row level security;
alter table swing_videos enable row level security;
alter table swing_phase_grades enable row level security;
alter table saved_drills enable row level security;
alter table practice_logs enable row level security;
alter table progress_snapshots enable row level security;
alter table user_goals enable row level security;
alter table coach_notes enable row level security;

-- RLS Policies
create policy "Users manage own profile"
  on golfer_profiles for all using (auth.uid() = user_id);

create policy "Users manage own bags"
  on golf_bags for all using (auth.uid() = user_id);

create policy "Users manage own clubs"
  on clubs for all using (auth.uid() = user_id);

create policy "Users manage own sessions"
  on sessions for all using (auth.uid() = user_id);

create policy "Users manage own shots"
  on shots for all using (auth.uid() = user_id);

create policy "Users manage own diagnoses"
  on diagnoses for all using (auth.uid() = user_id);

create policy "Users manage own videos"
  on swing_videos for all using (auth.uid() = user_id);

create policy "Users manage own phase grades"
  on swing_phase_grades for all
  using (video_id in (select id from swing_videos where user_id = auth.uid()));

create policy "Users manage own saved drills"
  on saved_drills for all using (auth.uid() = user_id);

create policy "Users manage own practice logs"
  on practice_logs for all using (auth.uid() = user_id);

create policy "Users manage own progress"
  on progress_snapshots for all using (auth.uid() = user_id);

create policy "Users manage own goals"
  on user_goals for all using (auth.uid() = user_id);

create policy "Users manage own coach notes"
  on coach_notes for all using (auth.uid() = user_id or coach_id = auth.uid());

-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger golfer_profiles_updated_at before update on golfer_profiles
  for each row execute function update_updated_at();

create trigger golf_bags_updated_at before update on golf_bags
  for each row execute function update_updated_at();

create trigger clubs_updated_at before update on clubs
  for each row execute function update_updated_at();

create trigger sessions_updated_at before update on sessions
  for each row execute function update_updated_at();

-- ============================================================
-- Sample seed data (remove before production)
-- ============================================================

-- Seed data must be inserted AFTER a real user is created via Supabase Auth.
-- See BEGINNER_START_HERE.md for instructions.

-- ============================================================
-- Subscriptions / entitlements
-- Written ONLY by the Stripe webhook (service role). Users may read
-- their own row to see their plan; they can never write it.
-- ============================================================
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro', 'team')),
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on subscriptions(stripe_customer_id);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);
