-- ============================================================
-- SwingVantage — Migration: full analysis text on the profile
-- ------------------------------------------------------------
-- Adds a nullable `analysis` jsonb column to `video_analyses` so the COMPLETE
-- AI analysis pulled from a swing video (priorities, drills, quality, phases —
-- not just summary metadata) is stored durably on the user's account and
-- survives across devices / a browser clear.
--
-- Safe + additive:
--   • Nullable, no default — existing rows are untouched and stay valid.
--   • No new RLS surface: `video_analyses` already enforces owner-only access
--     (auth.uid() = user_id), which covers the new column automatically.
--   • The raw swing video is still NEVER stored; frames are processed on-device.
--     Only the validated text analysis (which the user already sees) is kept.
--
-- Idempotent: safe to run more than once.
-- Apply in the Supabase SQL editor (or your migration runner). Until applied,
-- video-analysis sync continues to work for metadata; the full `analysis`
-- payload simply isn't persisted server-side yet.
-- ============================================================

alter table public.video_analyses
  add column if not exists analysis jsonb;
