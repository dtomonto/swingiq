-- ============================================================
-- SwingVantage — BodySync relational schema (Phase 2+ target)
--
-- ADDITIVE. This is the normalized, vendor-neutral health-performance data
-- model for when real device data flows at scale (Apple Health import,
-- Health Connect, wearable OAuth). It is NOT required for Phase 1 — manual
-- wellness + scoring + coaching already work and sync today via the
-- document mirror (user_documents → key 'swingiq-bodysync-v1').
--
-- PRIVACY BY DESIGN:
--   • Every table is RLS owner-only (a user only ever sees their own rows).
--   • We store NORMALIZED summaries, never raw device payloads. The only
--     pointer to anything external is health_metric_events.raw_ref (a
--     reference, not the data) — kept null unless a provider truly requires it.
--   • Granular consent lives in user_health_permissions; ingestion code must
--     check it before writing a category.
--
-- HOW TO APPLY (when you start Phase 2): Supabase → SQL Editor → paste → Run.
-- Idempotent. Do NOT re-run the main schema file.
-- ============================================================

-- ── Connections (one row per connected provider) ────────────
create table if not exists public.health_connections (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null,
  status       text not null default 'not_connected',
  method       text not null default 'manual',
  connected_at text,
  last_sync_at text,
  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists health_connections_user_idx on public.health_connections (user_id);

-- ── Granular per-user consent ───────────────────────────────
create table if not exists public.user_health_permissions (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  recovery   boolean not null default false,
  activity   boolean not null default false,
  cardio     boolean not null default false,
  mobility   boolean not null default false,
  wellness   boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── Manual wellness check-ins (one per user per day) ────────
create table if not exists public.manual_wellness_checkins (
  id                 text primary key,
  user_id            uuid not null references auth.users (id) on delete cascade,
  date               text not null,
  sleep_hours        numeric(4,1),
  sleep_quality      integer,
  energy             integer,
  soreness           integer,
  pain               integer,
  pain_areas         jsonb not null default '[]'::jsonb,
  stress             integer,
  hydration          integer,
  mental_focus       integer,
  warmup_quality     integer,
  practice_intensity integer,
  illness            boolean not null default false,
  travel_fatigue     boolean not null default false,
  alcohol            boolean not null default false,
  notes              text not null default '',
  created_at         timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists wellness_user_date_idx on public.manual_wellness_checkins (user_id, date desc);

-- ── Normalized metric events (the ingestion pipeline target) ─
create table if not exists public.health_metric_events (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null,
  device       text,
  category     text not null,
  metric_type  text not null,
  value        numeric not null,
  unit         text not null default '',
  confidence   text not null default 'moderate',
  window_start text,
  window_end   text,
  ts           timestamptz not null default now(),
  raw_ref      text,             -- pointer ONLY (never the raw payload)
  created_at   timestamptz not null default now()
);
create index if not exists hme_user_type_ts_idx on public.health_metric_events (user_id, metric_type, ts desc);

-- ── Daily rolled-up summaries (data minimization) ───────────
create table if not exists public.health_daily_summaries (
  id              text primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  date            text not null,
  category        text not null,
  metric_type     text not null,
  value           numeric,
  unit            text not null default '',
  confidence      text not null default 'moderate',
  source_provider text not null default 'manual',
  created_at      timestamptz not null default now(),
  unique (user_id, date, metric_type)
);
create index if not exists hds_user_date_idx on public.health_daily_summaries (user_id, date desc);

-- ── Derived score tables (one row per user per day each) ────
create table if not exists public.readiness_scores (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         text not null,
  score        integer not null,
  zone         text not null,
  confidence   text not null default 'moderate',
  contributors jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  unique (user_id, date)
);
create table if not exists public.recovery_scores (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         text not null,
  score        integer not null,
  confidence   text not null default 'moderate',
  contributors jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  unique (user_id, date)
);
create table if not exists public.training_load_scores (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         text not null,
  score        integer not null,
  acute        numeric,
  chronic      numeric,
  confidence   text not null default 'moderate',
  created_at   timestamptz not null default now(),
  unique (user_id, date)
);

-- ── Injury-risk flags ───────────────────────────────────────
create table if not exists public.injury_risk_flags (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null,
  level      text not null default 'none',
  reasons    jsonb not null default '[]'::jsonb,
  regions    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists irf_user_date_idx on public.injury_risk_flags (user_id, date desc);

-- ── AI insights (persisted, so they accrue over time) ───────
create table if not exists public.health_ai_insights (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  confidence text not null default 'low',
  category   text not null default 'performance',
  created_at timestamptz not null default now()
);
create index if not exists hai_user_idx on public.health_ai_insights (user_id, created_at desc);

-- ── Sync logs (audit trail; no private values, just status) ─
create table if not exists public.health_sync_logs (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  provider    text not null,
  status      text not null,
  message     text not null default '',
  records     integer not null default 0,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists hsl_user_idx on public.health_sync_logs (user_id, created_at desc);

-- ── Row Level Security: owner-only on every BodySync table ──
do $$
declare t text;
begin
  foreach t in array array[
    'health_connections','user_health_permissions','manual_wellness_checkins',
    'health_metric_events','health_daily_summaries','readiness_scores',
    'recovery_scores','training_load_scores','injury_risk_flags',
    'health_ai_insights','health_sync_logs'
  ] loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('drop policy if exists "owner_all" on public.%1$s;', t);
    execute format(
      'create policy "owner_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
