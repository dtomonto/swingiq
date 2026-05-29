// ============================================================
// SwingIQ — Multi-Sport Module Tests
// ============================================================

import {
  ALL_SPORTS,
  ALL_SPORTS_INCLUDING_GOLF,
  getSportConfig,
  runSportAnalysis,
  SPORT_CONFIGS,
} from './sport-registry';
import { runTennisAnalysis } from './tennis/analysis';
import { runBaseballAnalysis } from './baseball/analysis';
import { runSlowPitchAnalysis } from './softball-slow/analysis';
import { runFastPitchAnalysis } from './softball-fast/analysis';
import { TENNIS_PHASE_SEQUENCE, TENNIS_PHASE_DEFINITIONS } from './tennis/phases';
import { BASEBALL_PHASE_SEQUENCE, BASEBALL_PHASE_DEFINITIONS } from './baseball/phases';
import { SLOW_PITCH_PHASE_SEQUENCE, SLOW_PITCH_PHASE_DEFINITIONS } from './softball-slow/phases';
import { FAST_PITCH_PHASE_SEQUENCE, FAST_PITCH_PHASE_DEFINITIONS } from './softball-fast/phases';
import { TENNIS_DRILLS, getTennisDrillsForIssue } from './tennis/drills';
import { BASEBALL_DRILLS, getBaseballDrillsForIssue } from './baseball/drills';
import { SLOW_PITCH_DRILLS } from './softball-slow/drills';
import { FAST_PITCH_DRILLS } from './softball-fast/drills';
import { TENNIS_BENCHMARKS } from './tennis/benchmarks';
import { BASEBALL_BENCHMARKS } from './baseball/benchmarks';
import { SLOW_PITCH_BENCHMARKS } from './softball-slow/benchmarks';
import { FAST_PITCH_BENCHMARKS } from './softball-fast/benchmarks';
import type { SportAnalysisInput } from './types';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function mockInput(sportId: SportAnalysisInput['sport_id']): SportAnalysisInput {
  return {
    sport_id: sportId,
    user_id: 'test_user',
    metadata: {
      file_name: 'test.mp4',
      file_size_bytes: 10_000_000,
      mime_type: 'video/mp4',
      duration_seconds: 3.0,
      width: 1280,
      height: 720,
      frame_rate_estimated: 60,
      camera_angle: 'face_on',
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Registry tests
// ──────────────────────────────────────────────────────────────

describe('Sport Registry', () => {
  test('ALL_SPORTS contains exactly 4 non-golf sports', () => {
    expect(ALL_SPORTS).toHaveLength(4);
    const ids = ALL_SPORTS.map((s) => s.id);
    expect(ids).toContain('tennis');
    expect(ids).toContain('baseball');
    expect(ids).toContain('softball_slow');
    expect(ids).toContain('softball_fast');
  });

  test('ALL_SPORTS_INCLUDING_GOLF contains 5 sports with golf first', () => {
    expect(ALL_SPORTS_INCLUDING_GOLF).toHaveLength(5);
    expect(ALL_SPORTS_INCLUDING_GOLF[0].id).toBe('golf');
  });

  test('getSportConfig returns config for all non-golf sports', () => {
    expect(getSportConfig('tennis')).not.toBeNull();
    expect(getSportConfig('baseball')).not.toBeNull();
    expect(getSportConfig('softball_slow')).not.toBeNull();
    expect(getSportConfig('softball_fast')).not.toBeNull();
  });

  test('getSportConfig returns null for golf', () => {
    expect(getSportConfig('golf')).toBeNull();
  });

  test('each sport config has required fields', () => {
    for (const sport of ALL_SPORTS) {
      expect(sport.id).toBeTruthy();
      expect(sport.name).toBeTruthy();
      expect(sport.emoji).toBeTruthy();
      expect(sport.phase_sequence.length).toBeGreaterThan(0);
      expect(Object.keys(sport.phases).length).toBeGreaterThan(0);
      expect(sport.evidence_note).toBeTruthy();
    }
  });

  test('runSportAnalysis throws for golf', () => {
    expect(() => runSportAnalysis(mockInput('golf'))).toThrow();
  });
});

// ──────────────────────────────────────────────────────────────
// Phase definition tests
// ──────────────────────────────────────────────────────────────

describe('Tennis Phases', () => {
  test('8 phases in sequence', () => {
    expect(TENNIS_PHASE_SEQUENCE).toHaveLength(8);
  });

  test('all phases have required fields', () => {
    for (const phase of TENNIS_PHASE_SEQUENCE) {
      const def = TENNIS_PHASE_DEFINITIONS[phase];
      expect(def.label).toBeTruthy();
      expect(def.key_checkpoints.length).toBeGreaterThan(0);
      expect(def.common_errors.length).toBeGreaterThan(0);
      expect(def.coaching_cue).toBeTruthy();
      expect(def.technical_cue).toBeTruthy();
    }
  });

  test('phase percentages are in ascending order', () => {
    const pcts = TENNIS_PHASE_SEQUENCE.map(
      (p) => TENNIS_PHASE_DEFINITIONS[p].estimated_pct_of_swing,
    );
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i - 1]);
    }
  });
});

describe('Baseball Phases', () => {
  test('8 phases in sequence', () => {
    expect(BASEBALL_PHASE_SEQUENCE).toHaveLength(8);
  });

  test('all phases have required fields', () => {
    for (const phase of BASEBALL_PHASE_SEQUENCE) {
      const def = BASEBALL_PHASE_DEFINITIONS[phase];
      expect(def.label).toBeTruthy();
      expect(def.key_checkpoints.length).toBeGreaterThan(0);
    }
  });
});

describe('Slow Pitch Phases', () => {
  test('7 phases in sequence', () => {
    expect(SLOW_PITCH_PHASE_SEQUENCE).toHaveLength(7);
  });

  test('all phases defined', () => {
    for (const phase of SLOW_PITCH_PHASE_SEQUENCE) {
      expect(SLOW_PITCH_PHASE_DEFINITIONS[phase]).toBeDefined();
    }
  });
});

describe('Fast Pitch Phases', () => {
  test('7 phases in sequence', () => {
    expect(FAST_PITCH_PHASE_SEQUENCE).toHaveLength(7);
  });

  test('all phases defined', () => {
    for (const phase of FAST_PITCH_PHASE_SEQUENCE) {
      expect(FAST_PITCH_PHASE_DEFINITIONS[phase]).toBeDefined();
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Drill library tests
// ──────────────────────────────────────────────────────────────

describe('Tennis Drills', () => {
  test('at least 7 drills defined', () => {
    expect(TENNIS_DRILLS.length).toBeGreaterThanOrEqual(7);
  });

  test('all drills have valid YouTube search URLs', () => {
    for (const drill of TENNIS_DRILLS) {
      expect(drill.youtube_search_url).toMatch(/youtube\.com\/results\?search_query=/);
      expect(drill.youtube_search_url).not.toMatch(/watch\?v=/);
    }
  });

  test('all drills have required fields', () => {
    for (const drill of TENNIS_DRILLS) {
      expect(drill.id).toBeTruthy();
      expect(drill.sport_id).toBe('tennis');
      expect(drill.name).toBeTruthy();
      expect(drill.steps.length).toBeGreaterThan(0);
      expect(drill.goal).toBeTruthy();
    }
  });

  test('getTennisDrillsForIssue returns relevant drills', () => {
    const drills = getTennisDrillsForIssue('late_contact');
    expect(drills.length).toBeGreaterThan(0);
    drills.forEach((d) => expect(d.issue_id).toBe('late_contact'));
  });
});

describe('Baseball Drills', () => {
  test('at least 6 drills defined', () => {
    expect(BASEBALL_DRILLS.length).toBeGreaterThanOrEqual(6);
  });

  test('all drills have valid YouTube search URLs', () => {
    for (const drill of BASEBALL_DRILLS) {
      expect(drill.youtube_search_url).toMatch(/youtube\.com\/results\?search_query=/);
      expect(drill.youtube_search_url).not.toMatch(/watch\?v=/);
    }
  });

  test('getBaseballDrillsForIssue returns relevant drills', () => {
    const drills = getBaseballDrillsForIssue('casting_hands');
    expect(drills.length).toBeGreaterThan(0);
  });

  test('all drills tagged with sport_id baseball', () => {
    BASEBALL_DRILLS.forEach((d) => expect(d.sport_id).toBe('baseball'));
  });
});

describe('Slow Pitch Drills', () => {
  test('at least 4 drills defined', () => {
    expect(SLOW_PITCH_DRILLS.length).toBeGreaterThanOrEqual(4);
  });

  test('all drills have valid YouTube search URLs', () => {
    for (const drill of SLOW_PITCH_DRILLS) {
      expect(drill.youtube_search_url).toMatch(/youtube\.com\/results\?search_query=/);
      expect(drill.youtube_search_url).not.toMatch(/watch\?v=/);
    }
  });
});

describe('Fast Pitch Drills', () => {
  test('at least 5 drills defined', () => {
    expect(FAST_PITCH_DRILLS.length).toBeGreaterThanOrEqual(5);
  });

  test('all drills have valid YouTube search URLs', () => {
    for (const drill of FAST_PITCH_DRILLS) {
      expect(drill.youtube_search_url).toMatch(/youtube\.com\/results\?search_query=/);
      expect(drill.youtube_search_url).not.toMatch(/watch\?v=/);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Benchmark tests
// ──────────────────────────────────────────────────────────────

describe('Benchmarks', () => {
  const allBenchmarks = [
    TENNIS_BENCHMARKS,
    BASEBALL_BENCHMARKS,
    SLOW_PITCH_BENCHMARKS,
    FAST_PITCH_BENCHMARKS,
  ];

  test('all benchmarks have 4 skill segments', () => {
    for (const b of allBenchmarks) {
      expect(Object.keys(b.segmented)).toHaveLength(4);
      expect(b.segmented.beginner).toBeDefined();
      expect(b.segmented.intermediate).toBeDefined();
      expect(b.segmented.advanced).toBeDefined();
      expect(b.segmented.elite).toBeDefined();
    }
  });

  test('all benchmark windows have min < target < max', () => {
    for (const bench of allBenchmarks) {
      for (const [_seg, metrics] of Object.entries(bench.segmented)) {
        for (const [_metric, window] of Object.entries(metrics)) {
          expect(window.min).toBeLessThanOrEqual(window.target);
          expect(window.target).toBeLessThanOrEqual(window.max);
        }
      }
    }
  });

  test('all benchmarks have a notes field', () => {
    for (const b of allBenchmarks) {
      expect(b.notes).toBeTruthy();
    }
  });

  test('benchmark versions are semver strings', () => {
    for (const b of allBenchmarks) {
      expect(b.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Analysis engine tests
// ──────────────────────────────────────────────────────────────

describe('Tennis Analysis Engine', () => {
  const result = runTennisAnalysis(mockInput('tennis'));

  test('returns sport_id tennis', () => {
    expect(result.sport_id).toBe('tennis');
  });

  test('returns 8 phase segments', () => {
    expect(result.phase_segments).toHaveLength(8);
  });

  test('phase segments have correct sport_id', () => {
    result.phase_segments.forEach((seg) => expect(seg.sport_id).toBe('tennis'));
  });

  test('all phase segments are estimated', () => {
    result.phase_segments.forEach((seg) => expect(seg.is_estimated).toBe(true));
  });

  test('overall score is 0-100', () => {
    expect(result.overall_visual_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_visual_score).toBeLessThanOrEqual(100);
  });

  test('is_fully_estimated is always true', () => {
    expect(result.is_fully_estimated).toBe(true);
  });

  test('detected issues have is_estimated true', () => {
    result.detected_issues.forEach((issue) => expect(issue.is_estimated).toBe(true));
  });

  test('phase segment timing is ordered', () => {
    for (let i = 1; i < result.phase_segments.length; i++) {
      expect(result.phase_segments[i].start_time).toBeGreaterThanOrEqual(
        result.phase_segments[i - 1].start_time,
      );
    }
  });
});

describe('Baseball Analysis Engine', () => {
  const result = runBaseballAnalysis(mockInput('baseball'));

  test('returns sport_id baseball', () => {
    expect(result.sport_id).toBe('baseball');
  });

  test('returns 8 phase segments', () => {
    expect(result.phase_segments).toHaveLength(8);
  });

  test('overall score in valid range', () => {
    expect(result.overall_visual_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_visual_score).toBeLessThanOrEqual(100);
  });

  test('primary_issue is top detected issue when issues exist', () => {
    if (result.detected_issues.length > 0 && result.primary_issue) {
      expect(result.primary_issue.id).toBe(result.detected_issues[0].id);
    }
  });
});

describe('Slow Pitch Analysis Engine', () => {
  const result = runSlowPitchAnalysis(mockInput('softball_slow'));

  test('returns sport_id softball_slow', () => {
    expect(result.sport_id).toBe('softball_slow');
  });

  test('returns 7 phase segments', () => {
    expect(result.phase_segments).toHaveLength(7);
  });

  test('all segments tagged with correct sport_id', () => {
    result.phase_segments.forEach((seg) => expect(seg.sport_id).toBe('softball_slow'));
  });
});

describe('Fast Pitch Analysis Engine', () => {
  const result = runFastPitchAnalysis(mockInput('softball_fast'));

  test('returns sport_id softball_fast', () => {
    expect(result.sport_id).toBe('softball_fast');
  });

  test('returns 7 phase segments', () => {
    expect(result.phase_segments).toHaveLength(7);
  });

  test('analysis version is semver', () => {
    expect(result.analysis_version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('runSportAnalysis dispatcher', () => {
  test('dispatches correctly to each sport', () => {
    const sports: Array<Exclude<SportAnalysisInput['sport_id'], 'golf'>> = [
      'tennis', 'baseball', 'softball_slow', 'softball_fast',
    ];
    for (const sport of sports) {
      const result = runSportAnalysis(mockInput(sport));
      expect(result.sport_id).toBe(sport);
    }
  });
});
