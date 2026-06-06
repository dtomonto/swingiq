-- ============================================================
-- SwingVantage — Player Recruiting Hub: cloud schema (OPTIONAL)
--
-- In Plain English (start here):
--   The Recruiting Hub works fully WITHOUT this file — it runs local-first
--   on the athlete's device (localStorage key `swingvantage-recruiting`).
--   Apply this schema only when you want recruiting profiles to be shareable
--   ACROSS devices (so a coach on their own phone can open a /player/<slug>
--   link) and to collect engagement on shared links centrally.
--
--   Until it's applied, the app keeps working and the coach view shows an
--   honest "opens on the device where it was created" notice for cross-device
--   links. Applying it is safe and idempotent (re-runnable).
--
-- HOW TO APPLY (one-time, ~30s): Supabase project → SQL Editor → New query →
--   paste this whole file → Run.
--
-- Security model:
--   • Athlete-owned tables are scoped to auth.uid() by Row Level Security.
--   • `recruiting_share_snapshots` is the ONLY publicly readable table — and
--     only the permission-filtered snapshot the athlete chose to publish.
--     A snapshot is readable by anyone with the slug, mirroring how a share
--     link works; nothing private is ever in it.
--   • Anonymous coaches may INSERT engagement + contact submissions for an
--     existing snapshot, but may never read other people's data.
-- ============================================================

-- Reuse the shared updated_at trigger if present; define if not.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profiles (one per athlete account) ───────────────────────
create table if not exists public.recruiting_profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  athlete_name       text not null default '',
  primary_sport      text not null default 'golf',
  player_type        text not null default 'high_school',
  graduation_year    int,
  recruiting_status  text not null default 'exploring',
  visibility         text not null default 'private',
  -- Full profile payload (sport profiles, contact, story, etc.) as JSON so the
  -- client shape can evolve without migrations. Sensitive fields are only ever
  -- exposed through a published snapshot, never this row.
  data               jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Film metadata (raw video stays in storage/CDN, not here) ─
create table if not exists public.recruiting_film (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  data        jsonb not null,
  visibility  text not null default 'link_only',
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists recruiting_film_user_idx on public.recruiting_film (user_id);

-- ── Metrics ──────────────────────────────────────────────────
create table if not exists public.recruiting_metrics (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  metric_key  text not null,
  sport       text not null,
  data        jsonb not null,
  visibility  text not null default 'link_only',
  updated_at  timestamptz not null default now()
);
create index if not exists recruiting_metrics_user_idx on public.recruiting_metrics (user_id);

-- ── Coach notes ──────────────────────────────────────────────
create table if not exists public.recruiting_coach_notes (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  data        jsonb not null,
  visibility  text not null default 'link_only',
  created_at  timestamptz not null default now()
);
create index if not exists recruiting_coach_notes_user_idx on public.recruiting_coach_notes (user_id);

-- ── Share links (owner-only metadata; password stored hashed) ─
create table if not exists public.recruiting_share_links (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  slug        text not null unique,
  kind        text not null,
  data        jsonb not null,
  active      boolean not null default true,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists recruiting_share_links_user_idx on public.recruiting_share_links (user_id);

-- ── Published snapshots (PUBLIC read by slug) ────────────────
-- This is exactly the permission-filtered CoachViewSnapshot. It is what the
-- /player/<slug> page reads. Anyone with the slug can read it (that's the
-- share link); only the owner can write it.
create table if not exists public.recruiting_share_snapshots (
  slug        text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  snapshot    jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ── Engagement events (anon insert for an existing snapshot) ─
create table if not exists public.recruiting_engagement_events (
  id          bigint generated always as identity primary key,
  slug        text not null references public.recruiting_share_snapshots (slug) on delete cascade,
  user_id     uuid not null,           -- denormalized owner for RLS read
  type        text not null,
  target_id   text,
  progress    real,
  region      text,
  at          timestamptz not null default now()
);
create index if not exists recruiting_engagement_slug_idx on public.recruiting_engagement_events (slug);
create index if not exists recruiting_engagement_owner_idx on public.recruiting_engagement_events (user_id);

-- ── Recruiter contact submissions (anon insert) ─────────────
create table if not exists public.recruiting_contact_submissions (
  id            bigint generated always as identity primary key,
  slug          text not null references public.recruiting_share_snapshots (slug) on delete cascade,
  user_id       uuid not null,
  from_name     text not null,
  from_org      text,
  from_email    text not null,
  message       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists recruiting_contact_owner_idx on public.recruiting_contact_submissions (user_id);

-- ── updated_at triggers ──────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'recruiting_profiles','recruiting_film','recruiting_metrics',
    'recruiting_share_snapshots'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.recruiting_profiles            enable row level security;
alter table public.recruiting_film                enable row level security;
alter table public.recruiting_metrics             enable row level security;
alter table public.recruiting_coach_notes         enable row level security;
alter table public.recruiting_share_links         enable row level security;
alter table public.recruiting_share_snapshots     enable row level security;
alter table public.recruiting_engagement_events   enable row level security;
alter table public.recruiting_contact_submissions enable row level security;

-- Owner-only tables: full CRUD scoped to auth.uid().
do $$
declare t text;
begin
  foreach t in array array[
    'recruiting_profiles','recruiting_film','recruiting_metrics',
    'recruiting_coach_notes','recruiting_share_links'
  ] loop
    execute format('drop policy if exists owner_all on public.%I', t);
    -- recruiting_profiles keys on user_id directly; others have a user_id col too.
    execute format($p$create policy owner_all on public.%I
      for all using (user_id = auth.uid()) with check (user_id = auth.uid())$p$, t);
  end loop;
end $$;

-- Snapshots: PUBLIC read (by slug), owner write.
drop policy if exists snapshot_public_read on public.recruiting_share_snapshots;
create policy snapshot_public_read on public.recruiting_share_snapshots
  for select using (true);
drop policy if exists snapshot_owner_write on public.recruiting_share_snapshots;
create policy snapshot_owner_write on public.recruiting_share_snapshots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Engagement: anyone may INSERT against an existing snapshot; only the owner reads.
drop policy if exists engagement_anon_insert on public.recruiting_engagement_events;
create policy engagement_anon_insert on public.recruiting_engagement_events
  for insert with check (
    exists (select 1 from public.recruiting_share_snapshots s
            where s.slug = recruiting_engagement_events.slug
              and s.user_id = recruiting_engagement_events.user_id)
  );
drop policy if exists engagement_owner_read on public.recruiting_engagement_events;
create policy engagement_owner_read on public.recruiting_engagement_events
  for select using (user_id = auth.uid());

-- Contact submissions: anyone may INSERT against an existing snapshot; owner reads/updates.
drop policy if exists contact_anon_insert on public.recruiting_contact_submissions;
create policy contact_anon_insert on public.recruiting_contact_submissions
  for insert with check (
    exists (select 1 from public.recruiting_share_snapshots s
            where s.slug = recruiting_contact_submissions.slug
              and s.user_id = recruiting_contact_submissions.user_id)
  );
drop policy if exists contact_owner_rw on public.recruiting_contact_submissions;
create policy contact_owner_rw on public.recruiting_contact_submissions
  for select using (user_id = auth.uid());
drop policy if exists contact_owner_update on public.recruiting_contact_submissions;
create policy contact_owner_update on public.recruiting_contact_submissions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Done. The app remains local-first; wiring the sync engine to these tables
-- (lib/db pattern) is the Phase 4 follow-up.
