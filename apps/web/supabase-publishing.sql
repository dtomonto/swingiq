-- ============================================================
-- PublishingOS — Supabase schema
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor to enable DURABLE, production-safe
-- publishing. Until you run it, PublishingOS still works on an in-process store
-- (keyless-first) — this just makes publish decisions persist across deploys and
-- serverless invocations, which is what makes "publish in production" real.
--
-- Single-table design (mirrors growth_records): every PublishingOS record —
-- a publishable entity, an audit event, or a publish-state override — is stored
-- as JSONB tagged by `kind`. This matches lib/publishing/store.ts.
--
-- SECURITY: RLS is ENABLED with NO anon/authenticated policies, so the table is
-- unreadable/unwritable by the public anon key. PublishingOS reaches it only via
-- the service-role admin client, which bypasses RLS and is itself only used
-- behind the requireAdmin() guard. No GitHub/deploy tokens are ever stored here.
-- ============================================================

create table if not exists public.publishing_records (
  id          text primary key,         -- `${kind}:${entityType}:${entityId}` or `event:<uid>`
  kind        text not null,            -- 'entity' | 'event' | 'override'
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Hot-path indexes. The spec calls for indexes on entityType/slug/status/
-- publishedAt/updatedAt; with the JSONB design we expose them as expression
-- indexes on the `data` payload so queries stay fast as volume grows.
create index if not exists publishing_records_kind_idx
  on public.publishing_records (kind);
create index if not exists publishing_records_updated_idx
  on public.publishing_records (updated_at desc);
create index if not exists publishing_records_entitytype_idx
  on public.publishing_records ((data->>'entityType'));
create index if not exists publishing_records_status_idx
  on public.publishing_records ((data->>'status'));
create index if not exists publishing_records_slug_idx
  on public.publishing_records ((data->>'slug'));
create index if not exists publishing_records_publishedat_idx
  on public.publishing_records ((data->>'publishedAt') desc);

-- Enable RLS and add NO public policies → anon/authenticated are denied.
-- The service-role key (server-only) bypasses RLS for trusted admin writes.
alter table public.publishing_records enable row level security;

-- Keep updated_at fresh on direct SQL updates.
create or replace function public.publishing_records_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists publishing_records_touch on public.publishing_records;
create trigger publishing_records_touch
  before update on public.publishing_records
  for each row execute function public.publishing_records_touch_updated_at();

-- Setup: PublishingOS durable persistence
