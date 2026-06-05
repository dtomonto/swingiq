// ============================================================
// SwingVantage — Benchmark Change Proposal Engine
// Compares current benchmarks against research evidence
// and generates BenchmarkChangeProposal records.
//
// Safety rules enforced here:
//  • High-risk proposals never auto-approve
//  • Low confidence evidence never triggers change
//  • Conflicting evidence always flags as medium/high risk
//  • New benchmarks without multiple sources → high risk
// ============================================================

import type {
  BenchmarkChangeProposal,
  BenchmarkMetric,
  EvidenceSource,
  RiskLevel,
  ChangeType,
  ProposalReviewStatus,
} from './types';
import type { ClubCategory } from '../types';
import type { BenchmarkComparisonOutput } from './llm-prompts';

// ──────────────────────────────────────────────────────────────
// Risk assessment
// ──────────────────────────────────────────────────────────────

interface RiskInput {
  confidence_score: number;
  source_count: number;
  has_conflicting_evidence: boolean;
  change_type: ChangeType;
  change_magnitude: number;  // absolute change in target value
  is_new_metric: boolean;
}

export function assessRisk(input: RiskInput): RiskLevel {
  // High risk conditions
  if (input.is_new_metric) return 'high';
  if (input.change_type === 'retire_metric') return 'high';
  if (input.has_conflicting_evidence && input.change_magnitude > 2) return 'high';
  if (input.source_count < 2) return 'high';
  if (input.confidence_score < 50) return 'high';

  // Medium risk conditions
  if (input.change_magnitude > 3) return 'medium';
  if (input.has_conflicting_evidence) return 'medium';
  if (input.source_count < 3 && input.change_magnitude > 1) return 'medium';
  if (input.confidence_score < 70) return 'medium';

  return 'low';
}

// ──────────────────────────────────────────────────────────────
// Auto-approval rules
// Only applies to low-risk, high-confidence, context-only updates
// ──────────────────────────────────────────────────────────────

const AUTO_APPROVE_ENABLED =
  process.env.RESEARCH_AUTO_APPROVE_LOW_RISK === 'true';

export function shouldAutoApprove(
  risk: RiskLevel,
  confidence: number,
  change_type: ChangeType,
): ProposalReviewStatus {
  if (!AUTO_APPROVE_ENABLED) return 'pending';
  if (risk === 'low' && confidence >= 80 && change_type === 'update_context') {
    return 'auto_approved';
  }
  return 'pending';
}

// ──────────────────────────────────────────────────────────────
// Build a proposal from LLM comparison output
// ──────────────────────────────────────────────────────────────

export interface ProposalBuildInput {
  research_run_id: string;
  existing_metric: BenchmarkMetric | null;  // null = new metric
  metric_name: string;
  club_type: ClubCategory | 'all';
  llm_output: BenchmarkComparisonOutput;
  evidence_sources: EvidenceSource[];
  accepted_source_ids: string[];
}

export function buildProposal(input: ProposalBuildInput): BenchmarkChangeProposal | null {
  const { llm_output, existing_metric, metric_name, club_type, research_run_id } = input;

  if (!llm_output.should_update) return null;

  const isNew = !existing_metric;
  const changeType: ChangeType = isNew ? 'add_metric' : 'adjust_range';

  const changeMagnitude = existing_metric && llm_output.proposed_target !== null
    ? Math.abs(llm_output.proposed_target - existing_metric.target_value)
    : 999;

  const risk = assessRisk({
    confidence_score: llm_output.confidence * 100,
    source_count: input.accepted_source_ids.length,
    has_conflicting_evidence: llm_output.conflicting_evidence.length > 0,
    change_type: changeType,
    change_magnitude: changeMagnitude,
    is_new_metric: isNew,
  });

  const review_status = shouldAutoApprove(
    risk,
    llm_output.confidence * 100,
    changeType,
  );

  return {
    id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    research_run_id,
    benchmark_metric_id: existing_metric?.id ?? null,
    proposed_change_type: changeType,
    metric_name,
    club_type,
    skill_level: existing_metric?.skill_level ?? 'all',
    current_lower: existing_metric?.lower_bound ?? null,
    current_target: existing_metric?.target_value ?? null,
    current_upper: existing_metric?.upper_bound ?? null,
    proposed_lower: llm_output.proposed_lower,
    proposed_target: llm_output.proposed_target,
    proposed_upper: llm_output.proposed_upper,
    proposed_context: llm_output.caveat,
    rationale: llm_output.rationale,
    evidence_source_ids: input.accepted_source_ids,
    confidence_score: Math.round(llm_output.confidence * 100),
    risk_level: risk,
    conflicting_evidence: llm_output.conflicting_evidence,
    review_status,
    reviewer_notes: null,
    created_at: new Date().toISOString(),
    reviewed_at: null,
    applied_to_version_id: null,
  };
}

// ──────────────────────────────────────────────────────────────
// Generate human-readable proposal description
// ──────────────────────────────────────────────────────────────

export function describeProposal(proposal: BenchmarkChangeProposal): string {
  const { metric_name, club_type, current_target, proposed_target } = proposal;
  const unit = ''; // unit would come from metric context

  if (proposal.proposed_change_type === 'add_metric') {
    return `New metric: ${metric_name} for ${club_type} — proposed range ${proposal.proposed_lower}–${proposal.proposed_upper}${unit}`;
  }

  if (proposal.proposed_change_type === 'retire_metric') {
    return `Retire metric: ${metric_name} for ${club_type}`;
  }

  if (proposal.proposed_change_type === 'update_context') {
    return `Update description for: ${metric_name} (${club_type}) — no value change`;
  }

  if (current_target !== null && proposed_target !== null) {
    const direction = proposed_target > current_target ? '↑ increase' : '↓ decrease';
    const delta = Math.abs(proposed_target - current_target).toFixed(2);
    return `${metric_name} (${club_type}): target ${direction} by ${delta}${unit} ` +
      `(${current_target} → ${proposed_target})`;
  }

  return `Update ${metric_name} for ${club_type}`;
}

// ──────────────────────────────────────────────────────────────
// Apply a batch of approved proposals to create a new version
// ──────────────────────────────────────────────────────────────

export interface VersionApplication {
  new_version_number: string;
  applied_proposals: BenchmarkChangeProposal[];
  skipped_proposals: Array<{ id: string; reason: string }>;
  metrics_changed: number;
  change_summary: string[];
}

export function planVersionApplication(
  proposals: BenchmarkChangeProposal[],
  current_version: string,
): VersionApplication {
  const approvedProposals = proposals.filter(
    (p) => p.review_status === 'approved' || p.review_status === 'auto_approved',
  );

  const skipped = proposals
    .filter((p) => p.review_status !== 'approved' && p.review_status !== 'auto_approved')
    .map((p) => ({ id: p.id, reason: `Status: ${p.review_status}` }));

  // Increment minor version
  const [major, minor, patch] = current_version.split('.').map(Number);
  const new_version_number = `${major}.${(minor ?? 0) + 1}.${patch ?? 0}`;

  const change_summary = approvedProposals.map(describeProposal);

  return {
    new_version_number,
    applied_proposals: approvedProposals,
    skipped_proposals: skipped,
    metrics_changed: approvedProposals.length,
    change_summary,
  };
}
