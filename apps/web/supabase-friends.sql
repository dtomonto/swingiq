-- ============================================================
-- Player Experience Overhaul — Friends / social foundation (WS-05)
-- ------------------------------------------------------------
-- Secure MVP friends graph: request / accept / decline / remove, with
-- per-friendship permissions and the SQL helpers other tables use to grant
-- carefully-scoped cross-user reads.
--
-- Idempotent: safe to run on a live database (IF NOT EXISTS / guarded
-- policy creation). Additive: creates new objects only.
--
-- RUN ORDER: run this file BEFORE supabase-player-profile.sql and
-- supabase-skill-tree.sql — it defines public.is_friend_with() and
-- public.friend_can(), which their friend-read policies reference.
-- ============================================================

create table if not exists public.friendships (
  id                  uuid primary key default gen_random_uuid(),
  requester_user_id   uuid not null references auth.users(id) on delete cascade,
  receiver_user_id    uuid not null references auth.users(id) on delete cascade,
  -- pending | accepted | declined | blocked
  status              text not null default 'pending',
  -- least-access defaults; receiver opts in to more. Keys:
  --   view_profile, view_reports, allow_upload_for_me  (extensible)
  permissions         jsonb not null default '{"view_profile": true, "view_reports": false, "allow_upload_for_me": false}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint friendships_no_self check (requester_user_id <> receiver_user_id),
  constraint friendships_status_chk
    check (status in ('pending', 'accepted', 'declined', 'blocked'))
);

-- One friendship per unordered pair (direction-independent uniqueness).
create unique index if not exists friendships_unique_pair
  on public.friendships (
    least(requester_user_id, receiver_user_id),
    greatest(requester_user_id, receiver_user_id)
  );

create index if not exists friendships_receiver_idx on public.friendships (receiver_user_id);
create index if not exists friendships_requester_idx on public.friendships (requester_user_id);

-- ── Cross-user access helpers ────────────────────────────────
-- SECURITY DEFINER so the function can read friendships regardless of the
-- caller's RLS view; STABLE because it only reads. These are the ONLY
-- sanctioned way other tables grant friend reads.

create or replace function public.is_friend_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_user_id = auth.uid() and f.receiver_user_id = other)
        or
        (f.receiver_user_id = auth.uid() and f.requester_user_id = other)
      )
  );
$$;

-- True when the current user is an accepted friend of `other` AND that
-- friendship grants the named permission (e.g. 'view_profile').
create or replace function public.friend_can(other uuid, perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and coalesce((f.permissions ->> perm)::boolean, false) = true
      and (
        (f.requester_user_id = auth.uid() and f.receiver_user_id = other)
        or
        (f.receiver_user_id = auth.uid() and f.requester_user_id = other)
      )
  );
$$;

-- ── RLS: a friendship row is visible/mutable only to its two participants ──
alter table public.friendships enable row level security;

drop policy if exists "Participants can view friendship" on public.friendships;
create policy "Participants can view friendship" on public.friendships
  for select using (auth.uid() in (requester_user_id, receiver_user_id));

-- A requester may only create rows where they are the requester (no
-- impersonation / no arbitrary requester id from the client).
drop policy if exists "Requester can create friendship" on public.friendships;
create policy "Requester can create friendship" on public.friendships
  for insert with check (auth.uid() = requester_user_id);

-- Either participant may update (accept/decline/permission changes); the
-- application layer constrains which transitions each side may perform.
drop policy if exists "Participants can update friendship" on public.friendships;
create policy "Participants can update friendship" on public.friendships
  for update using (auth.uid() in (requester_user_id, receiver_user_id));

drop policy if exists "Participants can delete friendship" on public.friendships;
create policy "Participants can delete friendship" on public.friendships
  for delete using (auth.uid() in (requester_user_id, receiver_user_id));
