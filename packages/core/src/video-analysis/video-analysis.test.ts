// ============================================================
// SwingVantage Video Analysis — Unit Tests
// Run with: cd packages/core && npx jest
// ============================================================

import { runVideoAnalysis } from './deterministic-analysis';
import { estimatePhaseSegments } from './deterministic-analysis';
import { buildYouTubeSearchUrl, getPhaseSearchUrl, getIssueSearchUrl } from './youtube-service';
import { getDrillsForIssue, getDrillById, VIDEO_DRILLS } from './drill-library';
import {
  createDefaultLearningProfile,
  applyFeedbackToProfile,
  applyDrillInteractionToProfile,
} from './learning-profile-service';
import { SWING_PHASE_SEQUENCE } from './swing-phase-definitions';
import type { SwingVideoMetadata } from './types';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function makeMetadata(overrides?: Partial<SwingVideoMetadata>): SwingVideoMetadata {
  return {
    file_name: 'swing.mp4',
    file_size_bytes: 10_000_000,
    mime_type: 'video/mp4',
    duration_seconds: 8,
    width: 1920,
    height: 1080,
    frame_rate_estimated: 60,
    camera_angle: 'down_the_line',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────
// Phase segmentation
// ──────────────────────────────────────────────────────────────

describe('estimatePhaseSegments', () => {
  test('returns all 11 phases', () => {
    const segments = estimatePhaseSegments(8);
    expect(segments).toHaveLength(SWING_PHASE_SEQUENCE.length);
    const phaseIds = segments.map((s) => s.phase);
    for (const phase of SWING_PHASE_SEQUENCE) {
      expect(phaseIds).toContain(phase);
    }
  });

  test('all phases are marked as estimated', () => {
    const segments = estimatePhaseSegments(5);
    expect(segments.every((s) => s.is_estimated)).toBe(true);
  });

  test('timestamps are within video duration', () => {
    const duration = 6;
    const segments = estimatePhaseSegments(duration);
    for (const seg of segments) {
      expect(seg.start_time).toBeGreaterThanOrEqual(0);
      expect(seg.end_time).toBeLessThanOrEqual(duration);
      expect(seg.key_frame_time).toBeLessThanOrEqual(duration);
    }
  });

  test('phases are in chronological order', () => {
    const segments = estimatePhaseSegments(8);
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].start_time).toBeGreaterThanOrEqual(segments[i - 1].start_time);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Full analysis
// ──────────────────────────────────────────────────────────────

describe('runVideoAnalysis', () => {
  test('returns analysis with correct structure', () => {
    const result = runVideoAnalysis({
      video_id: 'v1',
      user_id: 'u1',
      session_id: null,
      metadata: makeMetadata(),
      landmarks_by_frame: new Map(),
    });

    expect(result.video_id).toBe('v1');
    expect(result.user_id).toBe('u1');
    expect(result.is_fully_estimated).toBe(true);
    expect(result.analysis_version).toBeTruthy();
    expect(result.phase_segments).toHaveLength(SWING_PHASE_SEQUENCE.length);
    expect(typeof result.overall_visual_score).toBe('number');
    expect(result.overall_visual_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_visual_score).toBeLessThanOrEqual(100);
  });

  test('ai_narrative starts as null (not hallucinated)', () => {
    const result = runVideoAnalysis({
      video_id: 'v2',
      user_id: 'u1',
      session_id: null,
      metadata: makeMetadata(),
      landmarks_by_frame: new Map(),
    });
    expect(result.ai_narrative).toBeNull();
  });

  test('drill_recommendations are from the drill library', () => {
    const result = runVideoAnalysis({
      video_id: 'v3',
      user_id: 'u1',
      session_id: null,
      metadata: makeMetadata(),
      landmarks_by_frame: new Map(),
    });
    for (const drill of result.drill_recommendations) {
      expect(drill.youtube_search_url).toContain('youtube.com/results');
      expect(drill.youtube_search_query).toBeTruthy();
    }
  });

  test('overall score is conservative without real landmarks', () => {
    const result = runVideoAnalysis({
      video_id: 'v4',
      user_id: 'u1',
      session_id: null,
      metadata: makeMetadata(),
      landmarks_by_frame: new Map(),
    });
    // Without real data, score should be in the cautious mid-range (not falsely perfect or terrible)
    expect(result.overall_visual_score).toBeLessThanOrEqual(80);
    expect(result.overall_visual_score).toBeGreaterThanOrEqual(20);
  });
});

// ──────────────────────────────────────────────────────────────
// YouTube service
// ──────────────────────────────────────────────────────────────

describe('YouTube service', () => {
  test('buildYouTubeSearchUrl encodes query safely', () => {
    const url = buildYouTubeSearchUrl('fix over the top golf swing');
    expect(url).toContain('youtube.com/results?search_query=');
    expect(url).not.toContain(' '); // spaces must be encoded
    expect(url).not.toContain('watch?v='); // never a direct video link
  });

  test('getPhaseSearchUrl returns valid URL for all phases', () => {
    for (const phase of SWING_PHASE_SEQUENCE) {
      const url = getPhaseSearchUrl(phase);
      expect(url).toContain('youtube.com/results');
    }
  });

  test('getIssueSearchUrl returns valid URL for early_extension', () => {
    const url = getIssueSearchUrl('early_extension');
    expect(url).toContain('youtube.com/results');
    expect(url).not.toContain('watch?v=');
  });
});

// ──────────────────────────────────────────────────────────────
// Drill library
// ──────────────────────────────────────────────────────────────

describe('Drill library', () => {
  test('getDrillsForIssue returns drills with youtube search urls', () => {
    const drills = getDrillsForIssue('early_extension');
    expect(drills.length).toBeGreaterThan(0);
    for (const d of drills) {
      expect(d.youtube_search_url).toContain('youtube.com/results');
      expect(d.steps.length).toBeGreaterThan(0);
    }
  });

  test('all drills have required fields', () => {
    for (const drill of VIDEO_DRILLS) {
      expect(drill.id).toBeTruthy();
      expect(drill.name).toBeTruthy();
      expect(drill.goal).toBeTruthy();
      expect(drill.steps.length).toBeGreaterThan(0);
      expect(drill.youtube_search_url).toContain('youtube.com/results');
      expect(drill.youtube_search_query).toBeTruthy();
    }
  });

  test('getDrillById returns undefined for unknown id', () => {
    expect(getDrillById('nonexistent_drill_xyz')).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────
// Learning profile service
// ──────────────────────────────────────────────────────────────

describe('Learning profile service', () => {
  test('createDefaultLearningProfile creates a valid profile', () => {
    const profile = createDefaultLearningProfile('user123');
    expect(profile.user_id).toBe('user123');
    expect(profile.total_analyses).toBe(0);
    expect(profile.completed_drills).toEqual([]);
    expect(profile.skipped_drills).toEqual([]);
  });

  test('applyFeedbackToProfile updates running average correctly', () => {
    let profile = createDefaultLearningProfile('u1');

    profile = applyFeedbackToProfile(profile, {
      id: 'f1',
      analysis_id: 'a1',
      user_id: 'u1',
      overall_rating: 4,
      most_useful_insight: null,
      least_useful_insight: null,
      free_text: null,
      submitted_at: new Date().toISOString(),
    });
    expect(profile.total_analyses).toBe(1);
    expect(profile.average_feedback_rating).toBe(4);

    profile = applyFeedbackToProfile(profile, {
      id: 'f2',
      analysis_id: 'a2',
      user_id: 'u1',
      overall_rating: 2,
      most_useful_insight: null,
      least_useful_insight: null,
      free_text: null,
      submitted_at: new Date().toISOString(),
    });
    expect(profile.total_analyses).toBe(2);
    expect(profile.average_feedback_rating).toBe(3);
  });

  test('applyDrillInteractionToProfile marks completed drills', () => {
    let profile = createDefaultLearningProfile('u1');
    profile = applyDrillInteractionToProfile(profile, {
      id: 'i1',
      drill_id: 'drill_ee_wall',
      user_id: 'u1',
      analysis_id: 'a1',
      outcome: 'felt_helpful',
      tried_at: new Date().toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
    });
    expect(profile.completed_drills).toContain('drill_ee_wall');
  });

  test('applyDrillInteractionToProfile marks skipped drills', () => {
    let profile = createDefaultLearningProfile('u1');
    profile = applyDrillInteractionToProfile(profile, {
      id: 'i2',
      drill_id: 'drill_cast_towel',
      user_id: 'u1',
      analysis_id: 'a1',
      outcome: 'irrelevant',
      tried_at: null,
      notes: null,
      created_at: new Date().toISOString(),
    });
    expect(profile.skipped_drills).toContain('drill_cast_towel');
  });

  test('profiles are immutable (original unchanged)', () => {
    const original = createDefaultLearningProfile('u1');
    const updated = applyFeedbackToProfile(original, {
      id: 'f1',
      analysis_id: 'a1',
      user_id: 'u1',
      overall_rating: 5,
      most_useful_insight: null,
      least_useful_insight: null,
      free_text: null,
      submitted_at: new Date().toISOString(),
    });
    expect(original.total_analyses).toBe(0);
    expect(updated.total_analyses).toBe(1);
  });
});
