// ============================================================
// SwingVantage — Golf Research & Benchmark Evolution System
// Core data types for the 90-day research cycle.
//
// Design principles:
//  • Every benchmark change must have evidence
//  • Every research run is fully logged
//  • No benchmark is silently overwritten
//  • LLM is a processor, not an authority
//  • User data is never exposed in research logs
// ============================================================

import type { ClubCategory, SkillLevel } from '../types';

// ──────────────────────────────────────────────────────────────
// Research Run
// ──────────────────────────────────────────────────────────────

export type ResearchRunStatus =
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ResearchScope =
  | 'launch_monitor_benchmarks'
  | 'biomechanics'
  | 'practice_science'
  | 'equipment_technology'
  | 'drill_library'
  | 'full';

export interface ResearchRun {
  id: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: ResearchRunStatus;
  scope: ResearchScope[];
  sources_reviewed: number;
  sources_accepted: number;
  sources_rejected: number;
  proposals_created: number;
  proposals_approved: number;
  proposals_rejected: number;
  model_used: string | null;
  prompt_version: string;
  errors: string[];
  summary: string | null;
  triggered_by: 'cron' | 'admin' | 'manual';
  next_scheduled_at: string | null;
}

// ──────────────────────────────────────────────────────────────
// Evidence Source
// ──────────────────────────────────────────────────────────────

export type SourceType =
  | 'peer_reviewed_research'
  | 'sports_biomechanics_journal'
  | 'motor_learning_research'
  | 'governing_body'            // USGA, R&A, PGA, LPGA
  | 'launch_monitor_manufacturer'
  | 'coaching_organization'
  | 'tour_statistics'
  | 'equipment_research'
  | 'golf_instruction'
  | 'technology_documentation'
  | 'other';

export type SourceCredibility = 'high' | 'medium' | 'low' | 'unverified';

export interface EvidenceSource {
  id: string;
  research_run_id: string;
  title: string;
  url: string;
  publisher: string;
  author: string | null;
  publication_date: string | null;   // ISO date string
  retrieval_date: string;
  source_type: SourceType;
  credibility: SourceCredibility;
  credibility_score: number;         // 0–100
  summary: string;                   // our summary, not copied text
  key_claims: string[];              // bullet points only
  related_categories: ResearchCategory[];
  confidence_level: number;          // 0–1
  citation_text: string;
  copyright_note: string;            // e.g. "Summary only — not reproducing full text"
  is_usable: boolean;                // false if terms prohibit use
  rejection_reason: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Benchmark System
// ──────────────────────────────────────────────────────────────

export type ResearchCategory =
  | 'face_to_path'
  | 'club_path'
  | 'attack_angle'
  | 'dynamic_loft'
  | 'spin_loft'
  | 'smash_factor'
  | 'spin_rate'
  | 'launch_angle'
  | 'carry_distance'
  | 'ball_speed'
  | 'club_speed'
  | 'lateral_dispersion'
  | 'descent_angle'
  | 'apex_height'
  | 'impact_location'
  | 'low_point'
  | 'swing_plane'
  | 'sequencing'
  | 'weight_transfer'
  | 'drill_effectiveness'
  | 'practice_methodology'
  | 'biomechanics_general'
  | 'equipment_fitting'
  | 'injury_prevention';

export type BenchmarkVersionStatus = 'draft' | 'review' | 'active' | 'superseded' | 'rejected';

export interface BenchmarkVersion {
  id: string;
  version: string;                   // semver: "1.0.0", "1.1.0", etc.
  title: string;
  description: string;
  effective_date: string;
  created_at: string;
  created_by: string;                // "cron_job" | "admin:name" | "manual"
  research_run_id: string | null;
  status: BenchmarkVersionStatus;
  change_summary: string[];          // human-readable list of changes
  metrics_changed: number;
  parent_version_id: string | null;  // previous version this was based on
}

export type MetricCategory =
  | 'ball_flight'
  | 'club_delivery'
  | 'strike_quality'
  | 'consistency'
  | 'biomechanics';

export type SexCategory = 'all' | 'male' | 'female' | 'junior';
export type AgeRange = 'all' | 'u18' | '18_35' | '36_50' | '51_65' | '65plus';
export type SwingSpeedCategory = 'all' | 'slow' | 'medium' | 'fast' | 'tour';
export type HandicapRange = 'all' | '0_5' | '6_15' | '16_25' | '26plus';

export interface BenchmarkMetric {
  id: string;
  version_id: string;
  metric_name: string;               // e.g. "face_to_path"
  category: MetricCategory;
  club_type: ClubCategory | 'all';
  skill_level: SkillLevel | 'all';
  handicap_range: HandicapRange;
  age_range: AgeRange;
  sex_category: SexCategory;
  swing_speed_category: SwingSpeedCategory;
  lower_bound: number;
  target_value: number;
  upper_bound: number;
  unit: string;
  context: string;                   // plain-English explanation
  source_ids: string[];
  confidence_score: number;          // 0–100, how confident we are in this range
  is_segmented: boolean;             // true if this differs from the "all" benchmark
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// Benchmark Change Proposals
// ──────────────────────────────────────────────────────────────

export type ChangeType =
  | 'adjust_range'       // change lower/upper/target values
  | 'add_segment'        // add a new skill/age/sex segmentation
  | 'remove_segment'     // deprecate a segment
  | 'add_metric'         // entirely new metric
  | 'retire_metric'      // remove a metric
  | 'update_context'     // only update the explanation text
  | 'update_drill_map';  // update which drills are recommended

export type RiskLevel = 'low' | 'medium' | 'high';

export type ProposalReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deferred'
  | 'auto_approved';    // only for low-risk + high-confidence from trusted sources

export interface BenchmarkChangeProposal {
  id: string;
  research_run_id: string;
  benchmark_metric_id: string | null; // null if adding a new metric
  proposed_change_type: ChangeType;
  metric_name: string;
  club_type: ClubCategory | 'all';
  skill_level: SkillLevel | 'all';
  // Current values (null if adding new)
  current_lower: number | null;
  current_target: number | null;
  current_upper: number | null;
  // Proposed values
  proposed_lower: number | null;
  proposed_target: number | null;
  proposed_upper: number | null;
  proposed_context: string | null;
  rationale: string;
  evidence_source_ids: string[];
  confidence_score: number;          // 0–100
  risk_level: RiskLevel;
  conflicting_evidence: string[];    // descriptions of conflicting sources
  review_status: ProposalReviewStatus;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  applied_to_version_id: string | null;
}

// ──────────────────────────────────────────────────────────────
// LLM Research Layer
// ──────────────────────────────────────────────────────────────

export interface ResearchPromptTemplate {
  id: string;
  version: string;
  name: string;
  scope: ResearchScope;
  system_prompt: string;
  user_prompt_template: string;     // uses {{variables}}
  expected_output_schema: string;   // JSON schema description
  created_at: string;
}

export interface LLMResearchCall {
  id: string;
  research_run_id: string;
  prompt_template_id: string;
  prompt_version: string;
  model_used: string;
  input_summary: string;            // NOT raw user data
  output_summary: string;
  raw_output: string | null;        // stored temporarily, not user PII
  parsed_successfully: boolean;
  errors: string[];
  confidence: number;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Responsible Learning — User Outcomes (privacy-safe)
// ──────────────────────────────────────────────────────────────

export type ImprovementResult = 'improved' | 'no_change' | 'regressed' | 'not_measured';

export interface RecommendationOutcome {
  id: string;
  user_id: string;
  recommendation_id: string;
  benchmark_version: string;
  golfer_segment: string;           // e.g. "beginner_mid_iron" — not PII
  issue_category: string;
  drill_type: string;
  user_rating: number | null;       // 1–5
  completed: boolean;
  reported_improvement: ImprovementResult;
  follow_up_metric_change: number | null; // e.g. face_to_path delta
  created_at: string;
}

export interface LearningInsight {
  id: string;
  insight_type: 'drill_effectiveness' | 'benchmark_validation' | 'segment_pattern' | 'engagement';
  segment: string;
  source_type: 'internal_feedback' | 'research_run';
  evidence_level: 'anecdotal' | 'preliminary' | 'moderate' | 'strong';
  summary: string;
  recommended_action: string | null;
  related_benchmark_version: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// User Benchmark Profile
// ──────────────────────────────────────────────────────────────

export interface UserBenchmarkProfile {
  user_id: string;
  active_benchmark_version: string;
  golfer_segment: string;
  skill_level: SkillLevel;
  handicap_goal: number | null;
  swing_speed_category: SwingSpeedCategory;
  age_range: AgeRange;
  sex_category: SexCategory;
  equipment_profile: string | null;
  last_updated: string;
}

// ──────────────────────────────────────────────────────────────
// API Response shapes
// ──────────────────────────────────────────────────────────────

export interface ResearchRunSummary {
  run: ResearchRun;
  sources: Pick<EvidenceSource, 'id' | 'title' | 'publisher' | 'credibility' | 'source_type' | 'is_usable'>[];
  proposals: Pick<BenchmarkChangeProposal, 'id' | 'metric_name' | 'proposed_change_type' | 'risk_level' | 'confidence_score' | 'review_status'>[];
  version_created: BenchmarkVersion | null;
}

export interface ActiveBenchmarkInfo {
  version: BenchmarkVersion;
  metrics_count: number;
  last_updated: string;
  sources_count: number;
}
