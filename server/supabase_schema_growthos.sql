-- ============================================================
-- GrowthOS — Supabase schema
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor to enable persistent storage
-- for GrowthOS (/admin/growth). Until you run it, GrowthOS still works on
-- in-process demo data — this just makes records persist.
--
-- Single-table design: every GrowthOS record (campaign, channel, content,
-- experiment, …) is stored as JSONB tagged by `kind`. This matches the
-- generic Repository<T> abstraction in apps/web/src/lib/growth/repository.ts.
--
-- SECURITY: RLS is ENABLED with NO anon/authenticated policies, so the
-- table is unreadable/unwritable by the public anon key. GrowthOS reaches
-- it only via the service-role admin client, which bypasses RLS and is
-- itself only used behind the ADMIN_SECRET guard.
-- ============================================================

create table if not exists public.growth_records (
  id          text primary key,
  kind        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists growth_records_kind_idx on public.growth_records (kind);
create index if not exists growth_records_updated_idx on public.growth_records (updated_at desc);

-- Enable RLS and add NO public policies → anon/authenticated are denied.
-- The service-role key (server-only) bypasses RLS for trusted admin writes.
alter table public.growth_records enable row level security;

-- Optional: keep updated_at fresh on direct SQL updates.
create or replace function public.growth_records_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists growth_records_touch on public.growth_records;
create trigger growth_records_touch
  before update on public.growth_records
  for each row execute function public.growth_records_touch_updated_at();

-- After running this, load starter data by POSTing to /api/growth/seed
-- with the x-admin-secret header (or just start adding your own records).
