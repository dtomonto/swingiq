-- ============================================================
-- First-Party Intelligence OS — Supabase schema
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor (or `psql "$DATABASE_URL" -f
-- apps/web/supabase-intelligence-os.sql`) to make the Intelligence OS durable.
-- Until you run it, the OS works on an in-process store (keyless-first) — this
-- just persists captured AI activity, knowledge, canonical answers, patterns,
-- the answer cache, evaluations, the token-savings ledger, action tasks/reports
-- and settings across deploys and serverless invocations.
--
-- Single-table design (mirrors growth_records / publishing_records): every
-- record — keyed by `kind` — is stored as JSONB. This matches
-- lib/intelligence-os/store.ts (RECORD_KINDS).
--
--   kind ∈ ai_event | knowledge | canonical_answer | pattern_memory |
--          answer_cache | evaluation | token_savings | action_task |
--          action_report | intelligence_settings
--
-- SECURITY: RLS is ENABLED with NO anon/authenticated policies, so the table is
-- unreadable/unwritable by the public anon key. The OS reaches it only via the
-- service-role admin client, which bypasses RLS and is itself only used behind
-- the requireAdmin() guard. No PII or secrets belong here — user ids are hashed
-- (lib/intelligence-os/privacy.ts) and prompts are redacted before capture.
-- ============================================================

create table if not exists public.intelligence_os_records (
  id          text primary key,
  kind        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Hot-path indexes. The JSONB facets the spec asks to index (severity,
-- priority, status, category, source, fingerprint, sport, confidence,
-- validation_status, usage_count, retention_tier, created_at) are exposed as
-- expression indexes on the `data` payload so queries stay fast as volume grows.
create index if not exists intel_records_kind_idx
  on public.intelligence_os_records (kind);
create index if not exists intel_records_updated_idx
  on public.intelligence_os_records (updated_at desc);
create index if not exists intel_records_fingerprint_idx
  on public.intelligence_os_records ((data->>'fingerprint'));
create index if not exists intel_records_semantic_fp_idx
  on public.intelligence_os_records ((data->>'semanticFingerprint'));
create index if not exists intel_records_severity_idx
  on public.intelligence_os_records ((data->>'severity'));
create index if not exists intel_records_status_idx
  on public.intelligence_os_records ((data->>'status'));
create index if not exists intel_records_category_idx
  on public.intelligence_os_records ((data->>'category'));
create index if not exists intel_records_provider_idx
  on public.intelligence_os_records ((data->>'provider'));
create index if not exists intel_records_feature_idx
  on public.intelligence_os_records ((data->>'feature'));
create index if not exists intel_records_sport_idx
  on public.intelligence_os_records ((data->>'sport'));
create index if not exists intel_records_validation_idx
  on public.intelligence_os_records ((data->>'validationStatus'));
create index if not exists intel_records_retention_idx
  on public.intelligence_os_records ((data->>'retentionTier'));
create index if not exists intel_records_archived_idx
  on public.intelligence_os_records ((data->>'archived'));

-- Enable RLS and add NO public policies → anon/authenticated are denied.
-- The service-role key (server-only) bypasses RLS for trusted admin writes.
alter table public.intelligence_os_records enable row level security;

-- Keep updated_at fresh on direct SQL updates.
create or replace function public.intelligence_os_records_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists intel_records_touch on public.intelligence_os_records;
create trigger intel_records_touch
  before update on public.intelligence_os_records
  for each row execute function public.intelligence_os_records_touch_updated_at();

comment on table public.intelligence_os_records is
  'First-Party Intelligence OS records (JSONB, kind-keyed). Service-role only; see lib/intelligence-os/store.ts. No PII/secrets — user ids hashed, prompts redacted.';
