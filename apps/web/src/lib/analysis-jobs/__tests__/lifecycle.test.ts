// Pure status-machine tests — no storage, runs in the default node env.

import {
  ACTIVE_STEP_ORDER,
  LOW_CONFIDENCE_REVIEW_THRESHOLD,
  canTransition,
  describeStatus,
  isActive,
  isTerminal,
  mapStageToStatus,
  progressFor,
  shouldFlagForReview,
} from '../lifecycle';
import type { JobStatus } from '../types';

describe('analysis-jobs lifecycle', () => {
  it('maps every real pipeline stage to a status (building/plan fold into one report step)', () => {
    expect(mapStageToStatus('preparing')).toBe('preparing');
    expect(mapStageToStatus('extracting')).toBe('extracting_frames');
    expect(mapStageToStatus('measuring')).toBe('extracting_pose');
    expect(mapStageToStatus('inspecting')).toBe('analyzing');
    expect(mapStageToStatus('building')).toBe('generating_report');
    expect(mapStageToStatus('plan')).toBe('generating_report');
    expect(mapStageToStatus('done')).toBe('completed');
  });

  it('classifies terminal vs active statuses', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('not_configured')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('analyzing')).toBe(false);
    expect(isActive('analyzing')).toBe(true);
    expect(isActive('completed')).toBe(false);
    // needs_human_review / rerun_requested are neither active nor "terminal".
    expect(isActive('needs_human_review')).toBe(false);
    expect(isTerminal('needs_human_review')).toBe(false);
  });

  it('progress is monotonic along the active step order and 1 at completion', () => {
    const active = ACTIVE_STEP_ORDER.filter((s) => s !== 'completed');
    for (let i = 1; i < active.length; i++) {
      expect(progressFor(active[i])).toBeGreaterThanOrEqual(progressFor(active[i - 1]));
    }
    expect(progressFor('completed')).toBe(1);
    expect(progressFor('failed')).toBe(0);
  });

  it('flags only low-confidence (<= threshold) completed analyses for review', () => {
    expect(shouldFlagForReview(LOW_CONFIDENCE_REVIEW_THRESHOLD)).toBe(true);
    expect(shouldFlagForReview(LOW_CONFIDENCE_REVIEW_THRESHOLD - 0.01)).toBe(true);
    expect(shouldFlagForReview(0.8)).toBe(false);
    expect(shouldFlagForReview(null)).toBe(false);
  });

  describe('canTransition', () => {
    it('allows forward motion along the active order, blocks backward', () => {
      expect(canTransition('preparing', 'analyzing')).toBe(true);
      expect(canTransition('analyzing', 'preparing')).toBe(false);
      expect(canTransition('queued', 'queued')).toBe(true);
    });

    it('allows fail/cancel only from an active step', () => {
      expect(canTransition('analyzing', 'failed')).toBe(true);
      expect(canTransition('analyzing', 'cancelled')).toBe(true);
      expect(canTransition('completed', 'failed')).toBe(false);
    });

    it('routes review only off a finished analysis, and rerun off terminal/flagged states', () => {
      expect(canTransition('completed', 'needs_human_review')).toBe(true);
      expect(canTransition('analyzing', 'needs_human_review')).toBe(false);
      expect(canTransition('failed', 'rerun_requested')).toBe(true);
      expect(canTransition('needs_human_review', 'rerun_requested')).toBe(true);
      expect(canTransition('analyzing', 'rerun_requested')).toBe(false);
      expect(canTransition('rerun_requested', 'queued')).toBe(true);
    });
  });

  it('describes every status with a label + a valid badge tone', () => {
    const all: JobStatus[] = [
      'queued', 'preparing', 'extracting_frames', 'extracting_pose', 'analyzing',
      'generating_report', 'completed', 'not_configured', 'needs_human_review',
      'failed', 'cancelled', 'rerun_requested',
    ];
    const tones = new Set(['critical', 'warning', 'watch', 'routine', 'healthy', 'neutral']);
    for (const s of all) {
      const d = describeStatus(s);
      expect(d.label.length).toBeGreaterThan(0);
      expect(tones.has(d.tone)).toBe(true);
    }
  });
});
