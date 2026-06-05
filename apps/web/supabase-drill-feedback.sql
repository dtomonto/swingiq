-- ============================================================
-- SwingVantage — drill_feedback (promoted columned table)
--
-- ADDITIVE migration — run AFTER the main schema. Promotes the
-- "did this drill help?" signal out of the user_documents JSON blob into
-- its OWN columned, queryable table, so it can power cross-user analytics
-- and a "most-effective drills" leaderboard. One row per recorded verdict.
--
-- HOW TO APPLY (one-time, ~10s): Supabase → SQL Editor → New query →
-- paste this file → Run. Idempotent (safe to re-run). Additive only —
-- do NOT re-run the main schema file.
--
-- Example analytics once data flows in:
--   select drill_id, value, count(*)
--   from drill_feedback group by drill_id, value order by count desc;
--   -- "helped" share per drill = the effectiveness leaderboard.
-- ============================================================

create table if not exists public.drill_feedback (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  drill_id    text not null,
  fault_id    text not null default '',
  sport       text not null default '',
  value       text not null check (value in ('helped', 'no_change', 'hurt')),
  notes       text not null default '',
  recorded_at text not null default '',
  created_at  timestamptz not null default now()
);

comment on table public.drill_feedback is
  'One row per "did this drill help?" verdict. Queryable for drill-effectiveness analytics.';

create index if not exists drill_feedback_user_idx      on public.drill_feedback (user_id);
create index if not exists drill_feedback_drill_idx     on public.drill_feedback (drill_id);
create index if not exists drill_feedback_analytics_idx on public.drill_feedback (sport, value);

alter table public.drill_feedback enable row level security;

drop policy if exists "owner_all" on public.drill_feedback;
create policy "owner_all" on public.drill_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
