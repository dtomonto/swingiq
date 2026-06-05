-- ============================================================
-- SwingVantage — VIDEO STUDIO schema (AI video department)
--
-- IN PLAIN ENGLISH (start here):
--   These tables let the AI video system durably remember what it found,
--   wrote, generated, placed, measured, and reassessed. Until you run
--   this, the app still works — it just keeps everything in memory and
--   honestly says "not saved yet" in the admin panel.
--
--   Design: every table uses the same simple shape — a text `id`, a few
--   indexed columns for fast filtering, a `data` JSONB blob holding the
--   full record, and timestamps. The app's repo (lib/video-studio/repo.ts)
--   reads/writes this shape, so there is almost no column mapping to break.
--
-- SECURITY:
--   All tables are admin-owned. Row Level Security is ENABLED with NO
--   public policies, so the anon/authenticated keys can't read or write
--   them. Only the service-role key (server-side, see supabase-admin.ts)
--   touches these tables — and published videos are served to end users
--   through a server route that filters to published rows. Never expose
--   the service-role key to the browser.
--
-- HOW TO APPLY (one-time, ~20s): Supabase → SQL Editor → New query →
--   paste this whole file → Run. Idempotent (safe to re-run).
-- ============================================================

-- Reuse-or-create the shared updated_at trigger (also defined by the
-- relational schema; create-or-replace keeps this file standalone).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Opportunities ────────────────────────────────────────────
create table if not exists public.video_opportunities (
  id          text primary key,
  surface_id  text not null default '',
  status      text not null default 'recommended',
  priority    numeric not null default 0,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_opportunities_status_idx on public.video_opportunities (status);
create index if not exists video_opportunities_priority_idx on public.video_opportunities (priority desc);

-- ── Creative briefs ──────────────────────────────────────────
create table if not exists public.video_briefs (
  id              text primary key,
  opportunity_id  text not null default '',
  version         integer not null default 1,
  data            jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists video_briefs_opportunity_idx on public.video_briefs (opportunity_id);

-- ── Generation jobs ──────────────────────────────────────────
create table if not exists public.video_jobs (
  id          text primary key,
  brief_id    text not null default '',
  status      text not null default 'queued',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_jobs_status_idx on public.video_jobs (status);

-- ── Assets (the finished/placeholder videos) ─────────────────
create table if not exists public.video_assets (
  id              text primary key,
  opportunity_id  text not null default '',
  published       boolean not null default false,
  lifecycle       text not null default 'experimental',
  data            jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists video_assets_published_idx on public.video_assets (published);

-- ── Placements ───────────────────────────────────────────────
create table if not exists public.video_placements (
  id          text primary key,
  surface_id  text not null default '',
  page        text not null default '',
  enabled     boolean not null default true,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_placements_page_idx on public.video_placements (page);

-- ── Analytics events (append-only) ───────────────────────────
create table if not exists public.video_events (
  id            text primary key,
  asset_id      text,
  placement_id  text not null default '',
  data          jsonb not null,
  created_at    timestamptz not null default now()
);
create index if not exists video_events_asset_idx on public.video_events (asset_id);

-- ── Rolled-up performance metrics ────────────────────────────
create table if not exists public.video_metrics (
  id            text primary key,
  asset_id      text not null default '',
  placement_id  text not null default '',
  data          jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Reassessments ────────────────────────────────────────────
create table if not exists public.video_reassessments (
  id          text primary key,
  asset_id    text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_reassessments_asset_idx on public.video_reassessments (asset_id);

-- ── Version history ──────────────────────────────────────────
create table if not exists public.video_versions (
  id          text primary key,
  asset_id    text not null default '',
  version     integer not null default 1,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_versions_asset_idx on public.video_versions (asset_id);

-- ── Audit log ────────────────────────────────────────────────
create table if not exists public.video_audit_logs (
  id          text primary key,
  action      text not null default '',
  target_id   text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists video_audit_logs_created_idx on public.video_audit_logs (created_at desc);

-- ── updated_at triggers (mutable tables only) ────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'video_opportunities','video_briefs','video_jobs','video_assets',
    'video_placements','video_metrics','video_reassessments','video_versions'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ── Row Level Security: admin-owned, no public policies ──────
-- With RLS enabled and no policies, anon/authenticated are denied; the
-- service-role key bypasses RLS for trusted server-side access only.
do $$
declare t text;
begin
  foreach t in array array[
    'video_opportunities','video_briefs','video_jobs','video_assets',
    'video_placements','video_events','video_metrics','video_reassessments',
    'video_versions','video_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
