-- ============================================================
-- SwingVantage — FEATURE EDUCATION ENGINE schema
--
-- IN PLAIN ENGLISH (start here):
--   These tables let the Feature Education Engine durably remember the
--   Feature Registry, every generated learning asset (tutorials, manuals,
--   how-tos, admin guides, FAQs, troubleshooting, onboarding, in-app help,
--   video briefs, release notes, support docs, SEO articles, course
--   modules), their version history, drift findings, and the audit trail.
--
--   Until you run this, the app still works — the registry is read from the
--   committed snapshot (apps/web/src/data/feature-registry.json) and
--   generated assets are kept in memory, with the admin panel honestly
--   saying "not durably saved yet".
--
--   Design mirrors supabase-video-studio.sql: every table is a text `id`,
--   a few indexed columns for filtering, a `data` JSONB blob with the full
--   record, and timestamps. The repo (lib/feature-education/repo.ts)
--   reads/writes this shape.
--
-- SECURITY: admin-owned. RLS ENABLED with NO public policies, so only the
--   service-role key (server-side) touches these tables.
--
-- HOW TO APPLY (one-time, ~20s): Supabase → SQL Editor → New query →
--   paste this whole file → Run. Idempotent (safe to re-run).
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Feature Registry ─────────────────────────────────────────
create table if not exists public.feature_records (
  id          text primary key,
  slug        text not null default '',
  category    text not null default 'new-feature',
  status      text not null default 'active',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists feature_records_category_idx on public.feature_records (category);
create index if not exists feature_records_status_idx on public.feature_records (status);

-- ── Education assets ─────────────────────────────────────────
create table if not exists public.feature_education_assets (
  id          text primary key,
  feature_id  text not null default '',
  type        text not null default 'tutorial',
  status      text not null default 'draft',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists fe_assets_feature_idx on public.feature_education_assets (feature_id);
create index if not exists fe_assets_status_idx on public.feature_education_assets (status);

-- ── Asset version history ────────────────────────────────────
create table if not exists public.feature_education_versions (
  id          text primary key,
  asset_id    text not null default '',
  version     integer not null default 1,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists fe_versions_asset_idx on public.feature_education_versions (asset_id);

-- ── Drift findings ───────────────────────────────────────────
create table if not exists public.feature_education_drift (
  id          text primary key,
  feature_id  text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists fe_drift_feature_idx on public.feature_education_drift (feature_id);

-- ── Audit log ────────────────────────────────────────────────
create table if not exists public.feature_education_audit (
  id          text primary key,
  action      text not null default '',
  target_id   text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists fe_audit_created_idx on public.feature_education_audit (created_at desc);

-- ── updated_at triggers ──────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'feature_records','feature_education_assets','feature_education_versions',
    'feature_education_drift','feature_education_audit'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ── Row Level Security: admin-owned, no public policies ──────
do $$
declare t text;
begin
  foreach t in array array[
    'feature_records','feature_education_assets','feature_education_versions',
    'feature_education_drift','feature_education_audit'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
