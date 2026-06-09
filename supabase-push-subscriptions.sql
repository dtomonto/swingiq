-- ============================================================
-- SwingVantage — Web Push subscriptions
-- ------------------------------------------------------------
-- Stores browser PushSubscriptions so the server can send practice-reminder /
-- re-engagement notifications. Apply once in the Supabase SQL editor.
--
-- Writes happen only via the service-role server (see
-- lib/notifications/push-subscriptions.ts), so RLS denies all anon/authenticated
-- access by default — the service role bypasses RLS.
-- ============================================================

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
-- No policies => no anon/authenticated access. Only the service-role key (used
-- server-side) can read/write, which is exactly what we want.
