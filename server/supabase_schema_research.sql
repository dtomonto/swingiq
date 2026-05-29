-- ============================================================
-- SwingIQ — Research & Benchmark Evolution Schema
-- Apply after: supabase_schema.sql, supabase_schema_video.sql
-- ============================================================

-- ============================================================
-- 1. BENCHMARK VERSIONS
-- Tracks every published benchmark standard set.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.benchmark_versions (
  id                TEXT        PRIMARY KEY,           -- e.g. 'v1_baseline', 'v1_1_0'
  version           TEXT        NOT NULL UNIQUE,        -- semver: '1.0.0', '1.1.0'
  title             TEXT        NOT NULL,
  description       TEXT,
  status            TEXT        NOT NULL DEFAULT 'draft'  -- 'draft' | 'active' | 'superseded' | 'deprecated'
                    CHECK (status IN ('draft', 'active', 'superseded', 'deprecated')),
  effective_date    DATE        NOT NULL,
  superseded_by     TEXT        REFERENCES public.benchmark_versions(id),
  change_summary    TEXT[],                            -- bullet-point summary of what changed
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        TEXT,                              -- 'research_workflow' | admin user id
  published_at      TIMESTAMPTZ
);

-- Metric overrides applied by each non-baseline version
CREATE TABLE IF NOT EXISTS public.benchmark_version_metrics (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id        TEXT        NOT NULL REFERENCES public.benchmark_versions(id) ON DELETE CASCADE,
  club_type         TEXT        NOT NULL,              -- 'driver' | 'iron_7' | 'wedge' etc.
  metric_key        TEXT        NOT NULL,              -- 'carry_distance' | 'ball_speed' etc.
  window_key        TEXT        NOT NULL,              -- e.g. 'beginner_male_lt80' (target window ID)
  old_min           NUMERIC,
  old_max           NUMERIC,
  new_min           NUMERIC,
  new_max           NUMERIC,
  unit              TEXT,
  rationale         TEXT,
  source_ids        TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bvm_version ON public.benchmark_version_metrics(version_id);
CREATE INDEX IF NOT EXISTS idx_bvm_club_metric ON public.benchmark_version_metrics(club_type, metric_key);

-- ============================================================
-- 2. RESEARCH RUNS
-- One row per scheduled or manually triggered research cycle.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.research_runs (
  id                TEXT        PRIMARY KEY DEFAULT ('run_' || gen_random_uuid()::text),
  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  status            TEXT        NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'running', 'completed', 'failed', 'cancelled')),
  scope             TEXT[]      NOT NULL DEFAULT ARRAY['benchmark_values'],
  sources_reviewed  INT         NOT NULL DEFAULT 0,
  sources_accepted  INT         NOT NULL DEFAULT 0,
  sources_rejected  INT         NOT NULL DEFAULT 0,
  proposals_created INT         NOT NULL DEFAULT 0,
  proposals_approved INT        NOT NULL DEFAULT 0,
  proposals_rejected INT        NOT NULL DEFAULT 0,
  model_used        TEXT,                              -- 'gpt-4o' | 'claude-3-5-sonnet' etc.
  prompt_version    TEXT        NOT NULL DEFAULT '1.0.0',
  errors            JSONB       NOT NULL DEFAULT '[]',
  summary           TEXT,
  triggered_by      TEXT        NOT NULL DEFAULT 'cron',  -- 'cron' | 'manual' | 'api'
  triggered_by_user TEXT,                             -- admin user id if manual
  next_scheduled_at TIMESTAMPTZ,
  is_dry_run        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_runs_status ON public.research_runs(status);
CREATE INDEX IF NOT EXISTS idx_research_runs_created ON public.research_runs(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_research_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS research_runs_updated_at ON public.research_runs;
CREATE TRIGGER research_runs_updated_at
  BEFORE UPDATE ON public.research_runs
  FOR EACH ROW EXECUTE FUNCTION update_research_runs_updated_at();

-- ============================================================
-- 3. EVIDENCE SOURCES
-- Tracks every source consulted during a research run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evidence_sources (
  id                TEXT        PRIMARY KEY DEFAULT ('src_' || gen_random_uuid()::text),
  research_run_id   TEXT        REFERENCES public.research_runs(id) ON DELETE SET NULL,
  url               TEXT        NOT NULL,
  title             TEXT,
  publisher         TEXT,
  source_type       TEXT        NOT NULL DEFAULT 'website'
                    CHECK (source_type IN (
                      'peer_reviewed', 'industry_report', 'equipment_manual',
                      'teaching_resource', 'tour_statistics', 'launch_monitor_data',
                      'expert_interview', 'governing_body', 'news_article', 'website'
                    )),
  published_date    DATE,
  -- NOTE: Only summaries and metadata stored — no copyrighted full text
  summary           TEXT,                             -- ≤500 word AI-generated summary
  citation          TEXT,
  credibility_score INT         NOT NULL DEFAULT 50 CHECK (credibility_score BETWEEN 0 AND 100),
  categories        TEXT[],                           -- ['launch_angle', 'ball_speed', ...]
  accepted          BOOLEAN     NOT NULL DEFAULT FALSE,
  rejection_reason  TEXT,
  robots_txt_ok     BOOLEAN     NOT NULL DEFAULT FALSE,
  terms_ok          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_sources_run ON public.evidence_sources(research_run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_type ON public.evidence_sources(source_type, accepted);

-- ============================================================
-- 4. BENCHMARK CHANGE PROPOSALS
-- Generated by LLM during research; require admin review before application.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.benchmark_change_proposals (
  id                TEXT        PRIMARY KEY DEFAULT ('prop_' || gen_random_uuid()::text),
  research_run_id   TEXT        NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  change_type       TEXT        NOT NULL
                    CHECK (change_type IN (
                      'update_range', 'update_context', 'add_metric', 'retire_metric',
                      'add_club_type', 'update_confidence', 'update_drill_mapping'
                    )),
  club_type         TEXT,
  metric_key        TEXT,
  current_value     JSONB,                            -- { min, max, unit, context }
  proposed_value    JSONB,                            -- { min, max, unit, context }
  rationale         TEXT        NOT NULL,
  confidence_score  INT         NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  risk_level        TEXT        NOT NULL DEFAULT 'high'
                    CHECK (risk_level IN ('low', 'medium', 'high')),
  source_ids        TEXT[]      NOT NULL DEFAULT '{}',
  supporting_quote  TEXT,                             -- ≤200 chars from source, cited
  evidence_summary  TEXT,
  review_status     TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN (
                      'pending', 'approved', 'rejected', 'deferred', 'auto_approved'
                    )),
  reviewer_notes    TEXT,
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       TEXT,                             -- admin user id
  applied_in_version TEXT       REFERENCES public.benchmark_versions(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_run ON public.benchmark_change_proposals(research_run_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.benchmark_change_proposals(review_status);
CREATE INDEX IF NOT EXISTS idx_proposals_risk ON public.benchmark_change_proposals(risk_level, review_status);

DROP TRIGGER IF EXISTS proposals_updated_at ON public.benchmark_change_proposals;
CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON public.benchmark_change_proposals
  FOR EACH ROW EXECUTE FUNCTION update_research_runs_updated_at();

-- ============================================================
-- 5. LLM RESEARCH CALLS
-- Audit log of every LLM invocation in the research workflow.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.llm_research_calls (
  id                TEXT        PRIMARY KEY DEFAULT ('llm_' || gen_random_uuid()::text),
  research_run_id   TEXT        NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  call_type         TEXT        NOT NULL,             -- 'source_summary' | 'benchmark_comparison' | 'drill_refresh' | 'run_summary'
  prompt_version    TEXT        NOT NULL DEFAULT '1.0.0',
  model             TEXT        NOT NULL,
  prompt_tokens     INT,
  completion_tokens INT,
  latency_ms        INT,
  success           BOOLEAN     NOT NULL DEFAULT FALSE,
  error_message     TEXT,
  -- NOTE: Prompt and response text intentionally NOT stored to avoid cost/privacy issues
  -- Store only structured output summary:
  output_summary    JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_calls_run ON public.llm_research_calls(research_run_id);

-- ============================================================
-- 6. RECOMMENDATION OUTCOMES (Aggregated / Anonymized)
-- Tracks drill/recommendation success at the segment level.
-- User IDs are never stored here — only segment keys.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recommendation_outcomes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_key       TEXT        NOT NULL,             -- 'beginner_driver', 'intermediate_iron_7', etc.
  drill_id          TEXT        NOT NULL,
  club_type         TEXT,
  outcome_type      TEXT        NOT NULL              -- 'completed' | 'skipped' | 'helped' | 'did_not_help' | 'too_hard' | 'too_easy'
                    CHECK (outcome_type IN ('completed', 'skipped', 'helped', 'did_not_help', 'too_hard', 'too_easy')),
  sample_count      INT         NOT NULL DEFAULT 1,   -- aggregated count for this segment
  recorded_week     DATE        NOT NULL DEFAULT DATE_TRUNC('week', NOW()),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_outcomes_segment ON public.recommendation_outcomes(segment_key, drill_id);
CREATE INDEX IF NOT EXISTS idx_rec_outcomes_week ON public.recommendation_outcomes(recorded_week DESC);

-- ============================================================
-- 7. LEARNING INSIGHTS
-- Derived insights from recommendation outcome analysis.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.learning_insights (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id   TEXT        REFERENCES public.research_runs(id) ON DELETE SET NULL,
  insight_type      TEXT        NOT NULL,             -- 'drill_effectiveness' | 'benchmark_gap' | 'segment_trend'
  segment_key       TEXT,
  drill_id          TEXT,
  metric_key        TEXT,
  description       TEXT        NOT NULL,
  data              JSONB,
  confidence        INT         NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  action_taken      TEXT,                             -- 'proposal_created' | 'informational' | 'deferred'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_run ON public.learning_insights(research_run_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.learning_insights(insight_type, created_at DESC);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- Research data is admin-only — never exposed to regular users.
-- ============================================================

ALTER TABLE public.benchmark_versions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_version_metrics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_sources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_change_proposals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_research_calls            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_outcomes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_insights             ENABLE ROW LEVEL SECURITY;

-- Public read-only: active benchmark version summary (for /api/research/benchmarks endpoint)
CREATE POLICY "Public can read active benchmark versions"
  ON public.benchmark_versions FOR SELECT
  USING (status = 'active');

-- All other tables: service_role only (used server-side, never from client)
-- No client-side policies needed — all writes happen via API routes with service_role key.

-- Helpful view: current active version with metric count
CREATE OR REPLACE VIEW public.active_benchmark_summary AS
SELECT
  bv.id,
  bv.version,
  bv.title,
  bv.effective_date,
  bv.change_summary,
  COUNT(bvm.id) AS metric_override_count
FROM public.benchmark_versions bv
LEFT JOIN public.benchmark_version_metrics bvm ON bv.id = bvm.version_id
WHERE bv.status = 'active'
GROUP BY bv.id;

-- ============================================================
-- 9. SEED: Register the baseline version
-- (Matches the BASELINE_VERSION constant in benchmark-registry.ts)
-- ============================================================

INSERT INTO public.benchmark_versions (
  id, version, title, description, status, effective_date,
  change_summary, created_by, published_at
) VALUES (
  'v1_baseline',
  '1.0.0',
  'SwingIQ Baseline Benchmarks',
  'Initial benchmark standards for SwingIQ v1. Values derived from TrackMan education, '
    'USGA equipment standards, PGA teaching resources, and established biomechanics literature. '
    'All values manually reviewed.',
  'active',
  '2024-01-01',
  ARRAY[
    'Initial release of SwingIQ benchmark standards',
    'Covers driver, 7-iron, and wedge metrics',
    'Segmented by handicap range and biological sex',
    'Includes launch angle, ball speed, carry distance, spin rate, smash factor, club path, face angle'
  ],
  'manual_baseline',
  '2024-01-01'::timestamptz
)
ON CONFLICT (id) DO NOTHING;
