-- ============================================================
-- Keys & Secrets vault — durable, encrypted runtime key store
-- ------------------------------------------------------------
-- Backs the /admin/integrations Keys & Secrets manager. Values are stored
-- ENCRYPTED (AES-256-GCM, the `data` JSONB holds {v,iv,tag,data}) — the
-- plaintext is never written here. RLS is ENABLED with NO policies, so ONLY the
-- service-role key (used by the server-side admin client, behind requireAdmin +
-- security.manage) can read or write. The anon/auth roles can never touch it.
--
-- Run once:  psql "$DATABASE_URL" -f apps/web/supabase-secrets.sql
-- Also set SECRETS_ENCRYPTION_KEY (a 32-byte base64 string) in your host so the
-- vault can encrypt/decrypt. Without it the manager stays read-only.
-- ============================================================

create table if not exists public.app_secrets (
  name        text primary key,
  data        jsonb       not null,
  actor_email text,
  updated_at  timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
-- Intentionally NO policies: encrypted secrets are reachable only via the
-- service-role key (RLS-bypassing), never by anon/authenticated clients.

comment on table public.app_secrets is
  'Encrypted runtime secrets (AES-256-GCM). Service-role only; see lib/secrets.';
