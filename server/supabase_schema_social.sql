-- ============================================================
-- SwingVantage — Blog-to-Social schema (OPTIONAL persistence)
-- ============================================================
--
-- IN PLAIN ENGLISH (start here):
--   The Social Studio works WITHOUT a database — it generates, edits,
--   copies, and exports in the browser. Run this file ONLY when you want
--   to *save* generated posts, track approvals, keep version history, and
--   record performance metrics over time.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste ALL of this → Run.
--
-- SAFE TO RE-RUN: every statement is idempotent.
--
-- SECURITY MODEL:
--   These tables hold INTERNAL marketing data, not user data. RLS is
--   enabled with NO public policies, so anon/logged-in users can't touch
--   them — only the server-side service-role client (lib/supabase-admin)
--   can read/write. Wire a real Supabase admin role later if you move
--   admin auth off ADMIN_SECRET (see docs/BLOG_TO_SOCIAL.md).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── One generation run for a blog post ──────────────────────
create table if not exists social_generations (
  id uuid primary key default uuid_generate_v4(),
  blog_slug text not null,
  blog_url text not null,
  source text not null default 'fallback' check (source in ('ai', 'fallback')),
  model text not null default 'deterministic',
  prompt_version text not null default 'social-v1',
  options jsonb not null default '{}'::jsonb,
  analysis jsonb not null default '{}'::jsonb,
  creative jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_social_generations_slug on social_generations (blog_slug);

-- ── One platform/variation post ─────────────────────────────
create table if not exists social_posts (
  id uuid primary key default uuid_generate_v4(),
  generation_id uuid references social_generations(id) on delete cascade,
  blog_slug text not null,
  platform text not null,
  variation_type text not null,
  generated_text text not null,           -- original engine/AI output
  edited_text text,                       -- admin edit, if any
  final_text text,                        -- what was actually used
  utm_url text not null default '',
  hashtags text[] not null default '{}',
  hook_type text,
  cta_type text,
  audience_segment text,
  brand_voice text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'scheduled', 'published')),
  quality_score int,
  warnings jsonb not null default '[]'::jsonb,
  rationale text,
  scheduled_at timestamptz,
  published_at timestamptz,
  generation_model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_social_posts_generation on social_posts (generation_id);
create index if not exists idx_social_posts_status on social_posts (status);
create index if not exists idx_social_posts_platform on social_posts (platform);

-- ── Edit history (version history per post) ──────────────────
create table if not exists social_post_versions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references social_posts(id) on delete cascade not null,
  text text not null,
  note text,
  edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_social_post_versions_post on social_post_versions (post_id);

-- ── Performance metrics (analytics-ready; see docs to ingest) ─
create table if not exists social_post_metrics (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references social_posts(id) on delete cascade not null,
  platform text not null,
  impressions int not null default 0,
  clicks int not null default 0,
  ctr numeric(6,4),
  engagements int not null default 0,
  shares int not null default 0,
  saves int not null default 0,
  comments int not null default 0,
  conversions int not null default 0,
  source text not null default 'manual',  -- 'manual' | 'utm_analytics' | 'platform_api'
  captured_at timestamptz not null default now()
);
create index if not exists idx_social_post_metrics_post on social_post_metrics (post_id);

-- ── keep updated_at fresh on social_posts ───────────────────
create or replace function social_posts_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_social_posts_updated_at on social_posts;
create trigger trg_social_posts_updated_at
  before update on social_posts
  for each row execute function social_posts_touch_updated_at();

-- ── RLS: server-only (service role) until an admin role exists ─
alter table social_generations   enable row level security;
alter table social_posts         enable row level security;
alter table social_post_versions enable row level security;
alter table social_post_metrics  enable row level security;
-- (No policies on purpose → anon/authenticated are denied; the service
--  role bypasses RLS and is the only accessor. See docs to add an admin role.)
