// ============================================================
// SwingIQ — Research & Benchmark Evolution System Tests
// Run with: cd packages/core && npx jest
// ============================================================

import { scoreSource, inferSourceCategories } from './source-evaluator';
import {
  benchmarkRegistry,
  BASELINE_VERSION,
  diffWindows,
} from './benchmark-registry';
import {
  assessRisk,
  shouldAutoApprove,
  planVersionApplication,
} from './proposal-engine';
import {
  computeNextScheduled,
  buildLLMConfig,
  CURATED_SOURCES,
} from './research-workflow';
import {
  buildSourceSummaryPrompt,
  buildBenchmarkComparisonPrompt,
  PROMPT_VERSION,
} from './llm-prompts';
import {
  createOutcome,
  analyzeSegment,
  anonymizeOutcomes,
} from './recommendation-outcome';
import type { BenchmarkChangeProposal, BenchmarkVersion } from './types';
import { TARGET_WINDOWS } from '../diagnostic/rules';

// ──────────────────────────────────────────────────────────────
// Source Evaluator
// ──────────────────────────────────────────────────────────────

describe('scoreSource', () => {
  test('gives high score to peer-reviewed research', () => {
    const result = scoreSource({
      source_type: 'peer_reviewed_research',
      publisher: 'Journal of Sports Sciences',
      publication_date: new Date().getFullYear().toString(),
      has_author: true,
      url: 'https://example.com/paper',
      key_claims_count: 5,
      is_quantitative: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.credibility).toMatch(/high|medium/);
  });

  test('gives low score to unknown other sources', () => {
    const result = scoreSource({
      source_type: 'other',
      publisher: 'unknown blog',
      publication_date: '2010-01-01',
      has_author: false,
      url: 'https://randomblog.com',
      key_claims_count: 0,
      is_quantitative: false,
    });
    expect(result.score).toBeLessThan(50);
    expect(result.recommendation).toBe('reject');
  });

  test('gives bonus for TrackMan publisher', () => {
    const withTrackMan = scoreSource({
      source_type: 'launch_monitor_manufacturer',
      publisher: 'TrackMan',
      publication_date: null,
      has_author: false,
      url: 'https://trackman.com/data',
      key_claims_count: 3,
      is_quantitative: true,
    });
    const withoutBonus = scoreSource({
      source_type: 'launch_monitor_manufacturer',
      publisher: 'Generic LM Company',
      publication_date: null,
      has_author: false,
      url: 'https://generic.com/data',
      key_claims_count: 3,
      is_quantitative: true,
    });
    expect(withTrackMan.score).toBeGreaterThan(withoutBonus.score);
  });

  test('penalizes old sources', () => {
    const recent = scoreSource({
      source_type: 'golf_instruction',
      publisher: 'test',
      publication_date: new Date().getFullYear().toString(),
      has_author: true,
      url: 'https://example.com',
      key_claims_count: 2,
      is_quantitative: false,
    });
    const old = scoreSource({
      source_type: 'golf_instruction',
      publisher: 'test',
      publication_date: '2008-01-01',
      has_author: true,
      url: 'https://example.com',
      key_claims_count: 2,
      is_quantitative: false,
    });
    expect(recent.score).toBeGreaterThan(old.score);
  });
});

describe('inferSourceCategories', () => {
  test('infers face_to_path from title', () => {
    const cats = inferSourceCategories('Face-to-Path Analysis for Drivers', '');
    expect(cats).toContain('face_to_path');
  });

  test('infers multiple categories', () => {
    const cats = inferSourceCategories(
      'Launch Angle and Spin Rate Optimization',
      'study on ball speed and smash factor improvements',
    );
    expect(cats.length).toBeGreaterThan(1);
  });

  test('returns empty for unrelated content', () => {
    const cats = inferSourceCategories('History of Ancient Rome', 'Mediterranean empire');
    expect(cats).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Benchmark Registry
// ──────────────────────────────────────────────────────────────

describe('BenchmarkRegistry', () => {
  beforeEach(() => {
    benchmarkRegistry.reset();
  });

  test('returns baseline windows before any version applied', () => {
    const windows = benchmarkRegistry.getWindows('driver');
    expect(windows).toEqual(TARGET_WINDOWS.driver);
  });

  test('applies version overrides correctly', () => {
    const newVersion: BenchmarkVersion = {
      ...BASELINE_VERSION,
      id: 'v2',
      version: '1.1.0',
      status: 'active',
    };
    benchmarkRegistry.applyVersion(newVersion, {
      driver: { ...TARGET_WINDOWS.driver, face_to_path: { min: -2, max: 2, ideal: 0, unit: '°', description: 'Updated' } },
    });
    const windows = benchmarkRegistry.getWindows('driver');
    expect(windows.face_to_path.min).toBe(-2);
    expect(windows.face_to_path.max).toBe(2);
  });

  test('preserves unoverridden metrics', () => {
    const newVersion: BenchmarkVersion = {
      ...BASELINE_VERSION,
      id: 'v2',
      version: '1.1.0',
      status: 'active',
    };
    benchmarkRegistry.applyVersion(newVersion, {
      driver: { ...TARGET_WINDOWS.driver, face_to_path: { min: -2, max: 2, ideal: 0, unit: '°', description: 'Updated' } },
    });
    const windows = benchmarkRegistry.getWindows('driver');
    // smash_factor should be unchanged from baseline
    expect(windows.smash_factor).toEqual(TARGET_WINDOWS.driver.smash_factor);
  });

  test('getActiveVersion returns correct version', () => {
    expect(benchmarkRegistry.getActiveVersion().version).toBe('1.0.0');
  });

  test('version history grows on apply', () => {
    const v2: BenchmarkVersion = { ...BASELINE_VERSION, id: 'v2', version: '1.1.0', status: 'active' };
    benchmarkRegistry.applyVersion(v2, {});
    expect(benchmarkRegistry.getVersionHistory().length).toBeGreaterThanOrEqual(1);
  });
});

describe('diffWindows', () => {
  test('detects changed target value', () => {
    const old = { driver: { ...TARGET_WINDOWS.driver } };
    const updated = {
      driver: {
        ...TARGET_WINDOWS.driver,
        face_to_path: { min: -2, max: 2, ideal: 0.5, unit: '°', description: 'Updated' },
      },
    };
    const diffs = diffWindows(old, updated);
    const faceDiff = diffs.find((d) => d.metric === 'face_to_path' && d.club_type === 'driver');
    expect(faceDiff).toBeDefined();
    expect(faceDiff?.change_direction).toBe('increase');
  });

  test('returns empty array for identical windows', () => {
    const diffs = diffWindows(TARGET_WINDOWS, TARGET_WINDOWS);
    expect(diffs).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Proposal Engine
// ──────────────────────────────────────────────────────────────

describe('assessRisk', () => {
  test('new metrics are always high risk', () => {
    expect(assessRisk({
      confidence_score: 95,
      source_count: 5,
      has_conflicting_evidence: false,
      change_type: 'add_metric',
      change_magnitude: 0,
      is_new_metric: true,
    })).toBe('high');
  });

  test('low confidence is high risk', () => {
    expect(assessRisk({
      confidence_score: 30,
      source_count: 3,
      has_conflicting_evidence: false,
      change_type: 'adjust_range',
      change_magnitude: 0.5,
      is_new_metric: false,
    })).toBe('high');
  });

  test('single source is high risk regardless of confidence', () => {
    expect(assessRisk({
      confidence_score: 90,
      source_count: 1,
      has_conflicting_evidence: false,
      change_type: 'adjust_range',
      change_magnitude: 0.5,
      is_new_metric: false,
    })).toBe('high');
  });

  test('low risk requires high confidence, multiple sources, no conflicts, small change', () => {
    expect(assessRisk({
      confidence_score: 85,
      source_count: 4,
      has_conflicting_evidence: false,
      change_type: 'adjust_range',
      change_magnitude: 0.5,
      is_new_metric: false,
    })).toBe('low');
  });
});

describe('shouldAutoApprove', () => {
  test('does not auto-approve high risk proposals', () => {
    const status = shouldAutoApprove('high', 95, 'adjust_range');
    expect(status).toBe('pending');
  });

  test('context-only updates can auto-approve if enabled', () => {
    // Default is pending (env var off)
    const status = shouldAutoApprove('low', 85, 'update_context');
    expect(status).toMatch(/pending|auto_approved/);
  });
});

describe('planVersionApplication', () => {
  const approvedProposal: BenchmarkChangeProposal = {
    id: 'p1',
    research_run_id: 'run1',
    benchmark_metric_id: 'm1',
    proposed_change_type: 'adjust_range',
    metric_name: 'face_to_path',
    club_type: 'driver',
    skill_level: 'all',
    current_lower: -3,
    current_target: 0,
    current_upper: 3,
    proposed_lower: -2.5,
    proposed_target: 0,
    proposed_upper: 2.5,
    proposed_context: null,
    rationale: 'Evidence supports tighter range',
    evidence_source_ids: ['s1', 's2'],
    confidence_score: 75,
    risk_level: 'low',
    conflicting_evidence: [],
    review_status: 'approved',
    reviewer_notes: null,
    created_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    applied_to_version_id: null,
  };

  test('increments minor version', () => {
    const plan = planVersionApplication([approvedProposal], '1.0.0');
    expect(plan.new_version_number).toBe('1.1.0');
  });

  test('only applies approved proposals', () => {
    const pendingProposal = { ...approvedProposal, id: 'p2', review_status: 'pending' as const };
    const plan = planVersionApplication([approvedProposal, pendingProposal], '1.0.0');
    expect(plan.applied_proposals).toHaveLength(1);
    expect(plan.skipped_proposals).toHaveLength(1);
  });

  test('generates change summary', () => {
    const plan = planVersionApplication([approvedProposal], '1.0.0');
    expect(plan.change_summary.length).toBeGreaterThan(0);
    expect(typeof plan.change_summary[0]).toBe('string');
  });
});

// ──────────────────────────────────────────────────────────────
// Research Workflow helpers
// ──────────────────────────────────────────────────────────────

describe('computeNextScheduled', () => {
  test('returns a date roughly 90 days from now', () => {
    const next = computeNextScheduled();
    const nextDate = new Date(next);
    const now = new Date();
    const diffDays = Math.round((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(91);
  });
});

describe('buildLLMConfig', () => {
  test('returns provider none when no env var set', () => {
    const original = process.env.AI_PROVIDER;
    delete process.env.AI_PROVIDER;
    const config = buildLLMConfig();
    expect(config.provider).toBe('none');
    process.env.AI_PROVIDER = original;
  });
});

describe('CURATED_SOURCES', () => {
  test('all sources have required fields', () => {
    for (const source of CURATED_SOURCES) {
      expect(source.title).toBeTruthy();
      expect(source.url).toContain('https://');
      expect(source.publisher).toBeTruthy();
      expect(source.scope.length).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// LLM Prompts
// ──────────────────────────────────────────────────────────────

describe('LLM Prompt Templates', () => {
  test('PROMPT_VERSION is a valid semver string', () => {
    expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('buildSourceSummaryPrompt returns system and user strings', () => {
    const { system, user } = buildSourceSummaryPrompt({
      source_title: 'Test Source',
      source_publisher: 'Test Publisher',
      source_url: 'https://example.com',
      source_text_excerpt: 'Face-to-path is 3 degrees for driver...',
      research_focus: 'face_to_path',
    });
    expect(typeof system).toBe('string');
    expect(typeof user).toBe('string');
    expect(system.length).toBeGreaterThan(50);
    expect(user).toContain('JSON');
  });

  test('buildBenchmarkComparisonPrompt includes current values', () => {
    const { user } = buildBenchmarkComparisonPrompt({
      metric: 'face_to_path',
      club_type: 'driver',
      current_lower: -3,
      current_target: 0,
      current_upper: 3,
      unit: '°',
      evidence_claims: [{ claim: 'Optimal range is -2 to +2', source: 'TrackMan', confidence: 0.8 }],
    });
    expect(user).toContain('face_to_path');
    expect(user).toContain('-3');
  });

  test('prompts explicitly prohibit inventing benchmarks', () => {
    const { system } = buildSourceSummaryPrompt({
      source_title: 'Test',
      source_publisher: 'Test',
      source_url: 'https://test.com',
      source_text_excerpt: 'test',
      research_focus: 'test',
    });
    expect(system.toLowerCase()).toContain('never invent');
  });
});

// ──────────────────────────────────────────────────────────────
// Recommendation Outcomes (Responsible Learning)
// ──────────────────────────────────────────────────────────────

describe('Recommendation Outcomes', () => {
  test('createOutcome generates segment from skill + club', () => {
    const outcome = createOutcome({
      user_id: 'u1',
      recommendation_id: 'r1',
      benchmark_version: '1.0.0',
      skill_level: 'beginner',
      club_category: 'driver',
      issue_category: 'slice_weak_fade',
      drill_type: 'face_control',
    });
    expect(outcome.golfer_segment).toBe('beginner_driver');
    expect(outcome.user_id).toBe('u1');
  });

  test('analyzeSegment computes completion rate', () => {
    const outcomes = [
      createOutcome({ user_id: 'u1', recommendation_id: 'r1', benchmark_version: '1.0.0', skill_level: 'beginner', club_category: 'driver', issue_category: 'slice', drill_type: 'face_control', completed: true }),
      createOutcome({ user_id: 'u2', recommendation_id: 'r1', benchmark_version: '1.0.0', skill_level: 'beginner', club_category: 'driver', issue_category: 'slice', drill_type: 'face_control', completed: false }),
    ];
    const stats = analyzeSegment(outcomes);
    expect(stats?.completion_rate).toBe(0.5);
  });

  test('anonymizeOutcomes removes user_id', () => {
    const outcomes = [
      createOutcome({ user_id: 'user_secret_123', recommendation_id: 'r1', benchmark_version: '1.0.0', skill_level: 'beginner', club_category: 'iron', issue_category: 'slice', drill_type: 'face_control' }),
    ];
    const anon = anonymizeOutcomes(outcomes);
    expect('user_id' in anon[0]).toBe(false);
    expect(anon[0].golfer_segment).toBeTruthy();
  });
});
