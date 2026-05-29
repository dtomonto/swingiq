-- ============================================================
-- SwingIQ — Video Analysis Supabase Schema
-- Run this in your Supabase SQL editor after applying
-- the base schema (supabase_schema.sql).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- swing_video_analyses
-- Main table for analysis results.
-- Note: actual video files are stored in Supabase Storage,
--       not this table. This stores analysis metadata only.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS swing_video_analyses (
  id                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  video_id              TEXT        NOT NULL,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id            UUID        REFERENCES sessions(id) ON DELETE SET NULL,
  camera_angle          TEXT        NOT NULL DEFAULT 'unknown',
  overall_visual_score  INTEGER     NOT NULL DEFAULT 50 CHECK (overall_visual_score BETWEEN 0 AND 100),
  detected_issues       JSONB       NOT NULL DEFAULT '[]',
  drill_recommendations JSONB       NOT NULL DEFAULT '[]',
  phase_segments        JSONB       NOT NULL DEFAULT '[]',
  primary_issue         JSONB,
  ai_narrative          TEXT,
  is_fully_estimated    BOOLEAN     NOT NULL DEFAULT true,
  analysis_version      TEXT        NOT NULL DEFAULT '1.0.0',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- swing_video_metadata
-- File metadata extracted browser-side.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS swing_video_metadata (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id            TEXT        NOT NULL REFERENCES swing_video_analyses(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name              TEXT        NOT NULL,
  file_size_bytes        BIGINT      NOT NULL,
  mime_type              TEXT        NOT NULL,
  duration_seconds       DOUBLE PRECISION NOT NULL,
  width                  INTEGER,
  height                 INTEGER,
  frame_rate_estimated   DOUBLE PRECISION,
  storage_path           TEXT,       -- path in Supabase Storage (if uploaded)
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- analysis_feedback
-- User feedback on analysis quality.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analysis_feedback (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id           TEXT        NOT NULL REFERENCES swing_video_analyses(id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating        SMALLINT    NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  most_useful_insight   TEXT,
  least_useful_insight  TEXT,
  free_text             TEXT,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- recommendation_interactions
-- Tracks how users engage with drill recommendations.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recommendation_interactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id      TEXT        NOT NULL,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id   TEXT        NOT NULL REFERENCES swing_video_analyses(id) ON DELETE CASCADE,
  outcome       TEXT        NOT NULL CHECK (outcome IN ('felt_helpful','too_hard','too_easy','irrelevant','not_tried')),
  tried_at      TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- user_learning_profiles
-- Personalisation data. One row per user.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_learning_profiles (
  user_id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_level               TEXT        NOT NULL DEFAULT 'beginner'
                              CHECK (skill_level IN ('beginner','intermediate','advanced','elite')),
  preferred_cue_style       TEXT        NOT NULL DEFAULT 'mixed'
                              CHECK (preferred_cue_style IN ('visual','feel','technical','mixed')),
  responded_well_to_issues  TEXT[]      NOT NULL DEFAULT '{}',
  persistent_issues         TEXT[]      NOT NULL DEFAULT '{}',
  completed_drills          TEXT[]      NOT NULL DEFAULT '{}',
  skipped_drills            TEXT[]      NOT NULL DEFAULT '{}',
  average_feedback_rating   DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_analyses            INTEGER     NOT NULL DEFAULT 0,
  last_updated              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- prompt_evaluation_logs
-- Tracks AI prompt calls for quality monitoring.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prompt_evaluation_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id     TEXT        NOT NULL REFERENCES swing_video_analyses(id) ON DELETE CASCADE,
  prompt_version  TEXT        NOT NULL,
  model_used      TEXT        NOT NULL,
  input_tokens    INTEGER     NOT NULL DEFAULT 0,
  output_tokens   INTEGER     NOT NULL DEFAULT 0,
  latency_ms      INTEGER     NOT NULL DEFAULT 0,
  user_rating     SMALLINT    CHECK (user_rating BETWEEN 1 AND 5),
  flagged         BOOLEAN     NOT NULL DEFAULT false,
  flag_reason     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_swing_video_analyses_user_id
  ON swing_video_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_swing_video_analyses_session_id
  ON swing_video_analyses(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_swing_video_metadata_user_id
  ON swing_video_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_feedback_user_id
  ON analysis_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_interactions_user_id
  ON recommendation_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_evaluation_logs_user_id
  ON prompt_evaluation_logs(user_id);

-- ──────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- Users can only access their own data.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE swing_video_analyses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE swing_video_metadata        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_feedback           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evaluation_logs      ENABLE ROW LEVEL SECURITY;

-- swing_video_analyses
CREATE POLICY "Users can manage their own analyses"
  ON swing_video_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- swing_video_metadata
CREATE POLICY "Users can manage their own video metadata"
  ON swing_video_metadata FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- analysis_feedback
CREATE POLICY "Users can manage their own feedback"
  ON analysis_feedback FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recommendation_interactions
CREATE POLICY "Users can manage their own interactions"
  ON recommendation_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_learning_profiles
CREATE POLICY "Users can manage their own learning profile"
  ON user_learning_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prompt_evaluation_logs
CREATE POLICY "Users can read their own prompt logs"
  ON prompt_evaluation_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert prompt logs
CREATE POLICY "Service role can insert prompt logs"
  ON prompt_evaluation_logs FOR INSERT
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- Updated_at trigger
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_swing_video_analyses_updated_at
  BEFORE UPDATE ON swing_video_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
