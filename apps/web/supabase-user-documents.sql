-- ============================================================
-- SwingVantage — user_documents (cloud mirror for secondary stores)
--
-- ADDITIVE migration — run AFTER supabase-relational-schema.sql.
-- ⚠️ Do NOT re-run the main schema file; it would drop your populated
-- tables. This one only ADDS the user_documents table, so it is safe.
--
-- A handful of self-contained feature stores keep small, document-shaped
-- per-user state (retest dismissals, drill-effectiveness feedback, AGI
-- history / commitments / insight verdicts, celebration ledger, saved
-- video-analysis history, Motion Lab sessions + roster, guide + start-here
-- state). Each is mirrored here as one JSON document per (user, key) —
-- the same jsonb-row pattern already used for community_state /
-- tutorial_progress / agent_state. One row per feature, RLS owner-only.
--
-- HOW TO APPLY (one-time, ~10s): Supabase → SQL Editor → New query →
-- paste this file → Run. Idempotent (safe to re-run).
-- ============================================================

create table if not exists public.user_documents (
  user_id    uuid not null references auth.users (id) on delete cascade,
  doc_key    text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_key)
);

comment on table public.user_documents is
  'Per-user document store for self-contained feature state (one row per feature key).';

-- Row Level Security: a user can only ever touch their own documents.
alter table public.user_documents enable row level security;

drop policy if exists "owner_all" on public.user_documents;
create policy "owner_all" on public.user_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reuse the shared updated_at trigger fn from the main schema; define a
-- fallback in case this file is ever run standalone.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_documents_updated_at on public.user_documents;
create trigger trg_user_documents_updated_at
  before update on public.user_documents
  for each row execute function public.set_updated_at();
