// ============================================================
// SwingVantage — Motion Lab: Validation Benchmark (node tier)
// ------------------------------------------------------------
// A deterministic harness that runs labelled pose-track fixtures through
// the REAL engine (profileVideoQuality + analyzePoseTrack) and checks the
// brief's acceptance gates:
//
//   • good     → analysis level 4–5
//   • usable   → level ≥ 3
//   • poor     → level ≥ 2
//   • terrible → still produces capture guidance
//   • no fixture crashes, returns a blank result, or a metric without confidence
//
// It composes both halves the live pipeline composes — the quality profile
// (tier / level / fixes) and the engine session (metrics / scores / quality)
// — without a browser, so it runs in CI. The Playwright video tier (L5) covers
// the browser-only MediaPipe path separately. Pure + deterministic.
// ============================================================

import type { MotionPoseTrack, CaptureContext } from './types';
import { analyzePoseTrack } from './pipeline';
import {
  profileVideoQuality,
  type PreflightInput,
  type VideoQualityTier,
  type VideoQualityIssueCode,
} from './preflight';
import { generateSamplePoseTrack } from './sample';
import type { GrayLumaStats } from '@/lib/frame-enhance';

type AnalysisLevel = 1 | 2 | 3 | 4 | 5;

export interface BenchmarkExpectation {
  /** The deepest defensible analysis level must be at least this. */
  minLevel: AnalysisLevel;
  /** If set, the quality tier must be one of these. */
  tierIn?: VideoQualityTier[];
  /** Require at least one capture-guidance fix (always true; explicit for terrible). */
  requireGuidance?: boolean;
  /** Require at least one metric to produce a real (non-null) value. */
  requireMetrics?: boolean;
  /** Issue codes that MUST be detected for this fixture. */
  requireIssues?: VideoQualityIssueCode[];
}

export interface BenchmarkFixture {
  name: string;
  description: string;
  track: MotionPoseTrack;
  preflight: PreflightInput;
  capture: CaptureContext;
  expect: BenchmarkExpectation;
}

export interface BenchmarkRow {
  name: string;
  tier: VideoQualityTier;
  level: number;
  overallConfidence: number;
  metricsTotal: number;
  metricsNotDefensible: number;
  guidance: boolean;
  issueCodes: string[];
  enginePath: string;
  runtimeMs: number;
  pass: boolean;
  failures: string[];
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Run one fixture and grade it against its expectation. Never throws. */
export function runFixture(fixture: BenchmarkFixture): BenchmarkRow {
  const t0 = now();
  const blank: Omit<BenchmarkRow, 'name' | 'pass' | 'failures' | 'runtimeMs'> = {
    tier: 'not_defensible',
    level: 0,
    overallConfidence: 0,
    metricsTotal: 0,
    metricsNotDefensible: 0,
    guidance: false,
    issueCodes: [],
    enginePath: '—',
  };
  try {
    const profile = profileVideoQuality(fixture.preflight);
    const session = analyzePoseTrack(fixture.track, fixture.capture, {
      modelVersion: `benchmark/${profile.tier}`,
    });

    const failures: string[] = [];

    // ── "never fail silently" invariants ──
    if (!Array.isArray(session.metrics)) failures.push('metrics is not an array');
    if (!(session.quality.recommendations.length > 0)) failures.push('no capture recommendations');
    if (!session.status) failures.push('missing status');
    for (const m of session.metrics) {
      if (typeof m.confidence !== 'number' || Number.isNaN(m.confidence)) {
        failures.push(`metric "${m.id}" has no numeric confidence`);
      }
    }

    // ── tier / level gates ──
    if (profile.recommendedAnalysisLevel < fixture.expect.minLevel) {
      failures.push(`level ${profile.recommendedAnalysisLevel} < required ${fixture.expect.minLevel}`);
    }
    if (fixture.expect.tierIn && !fixture.expect.tierIn.includes(profile.tier)) {
      failures.push(`tier "${profile.tier}" not in [${fixture.expect.tierIn.join(', ')}]`);
    }

    // ── guidance / metrics / issue gates ──
    const guidance = profile.recommendedFixes.length > 0;
    if (fixture.expect.requireGuidance && !guidance) failures.push('no capture guidance produced');

    const metricsWithValue = session.metrics.filter((m) => m.value !== null).length;
    if (fixture.expect.requireMetrics && metricsWithValue === 0) {
      failures.push('no metric produced a defensible value');
    }

    const issueCodes = profile.issues.map((i) => i.code);
    for (const code of fixture.expect.requireIssues ?? []) {
      if (!issueCodes.includes(code)) failures.push(`expected issue "${code}" not detected`);
    }

    return {
      name: fixture.name,
      tier: profile.tier,
      level: profile.recommendedAnalysisLevel,
      overallConfidence: session.scoreboard.confidence,
      metricsTotal: session.metrics.length,
      metricsNotDefensible: session.metrics.filter((m) => m.value === null).length,
      guidance,
      issueCodes,
      enginePath: session.modelVersion,
      runtimeMs: Math.round(now() - t0),
      pass: failures.length === 0,
      failures,
    };
  } catch (err) {
    return {
      name: fixture.name,
      ...blank,
      runtimeMs: Math.round(now() - t0),
      pass: false,
      failures: [`crashed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** Run the whole suite. */
export function runMotionBenchmark(fixtures: BenchmarkFixture[]): BenchmarkRow[] {
  return fixtures.map(runFixture);
}

export function benchmarkPassed(rows: BenchmarkRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.pass);
}

/** A compact, human-readable table for the CLI/CI log. */
export function formatBenchmarkTable(rows: BenchmarkRow[]): string {
  const head = ['fixture', 'tier', 'lvl', 'conf', 'metrics', 'n/d', 'guide', 'ms', 'result'];
  const lines = rows.map((r) => [
    r.name,
    r.tier,
    String(r.level),
    r.overallConfidence.toFixed(2),
    String(r.metricsTotal),
    String(r.metricsNotDefensible),
    r.guidance ? 'yes' : 'NO',
    String(r.runtimeMs),
    r.pass ? 'PASS' : 'FAIL',
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...lines.map((l) => l[i].length)));
  const fmt = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join('  ');
  const out = [fmt(head), widths.map((w) => '-'.repeat(w)).join('  '), ...lines.map(fmt)];
  const failed = rows.filter((r) => !r.pass);
  if (failed.length) {
    out.push('', 'Failures:');
    for (const r of failed) out.push(`  • ${r.name}: ${r.failures.join('; ')}`);
  }
  out.push('', `${rows.filter((r) => r.pass).length}/${rows.length} fixtures passed.`);
  return out.join('\n');
}

// ── Fixture builders (deterministic) ──────────────────────────

function stats(brightness: number, contrast: number, sharpness: number, count = 12): GrayLumaStats[] {
  return Array.from({ length: count }, () => ({ brightness, contrast, sharpness }));
}

/** Re-stamp a synthetic track's landmark visibility (and optionally drop frames). */
function withVisibility(track: MotionPoseTrack, v: number, keepFrames?: number): MotionPoseTrack {
  let frames = track.frames.map((f) => ({
    tMs: f.tMs,
    landmarks: f.landmarks.map((l) => ({ ...l, v })),
  }));
  if (keepFrames != null) frames = frames.slice(0, keepFrames);
  return { ...track, frames, trackingConfidence: v };
}

const capture = (
  sport: CaptureContext['sport'],
  motionType: string,
  view: CaptureContext['view'] = 'face_on',
): CaptureContext => ({ sport, motionType, view, handedness: 'right', skillLevel: 'intermediate' });

const preflight = (over: Partial<PreflightInput>): PreflightInput => ({
  frameStats: stats(0.55, 0.28, 0.5),
  subjectCoverage: 0.95,
  fullBodyVisible: true,
  trackingConfidence: 0.85,
  multiplePeople: false,
  resolution: '1080x1920',
  estimatedFps: 60,
  durationSeconds: 3,
  swingWindowDetected: true,
  sport: 'golf',
  view: 'face_on',
  ...over,
});

/**
 * The default fixture set: one clip per tier across several sports, plus the
 * multi-person and cropped recovery cases. Pure + deterministic.
 */
export function buildDefaultFixtures(): BenchmarkFixture[] {
  const golf = generateSamplePoseTrack('golf');
  const tennis = generateSamplePoseTrack('groundstroke');
  const bat = generateSamplePoseTrack('bat');

  return [
    {
      name: 'golf · clean face-on (good)',
      description: 'Bright, full-body, 60fps, single athlete.',
      track: golf,
      preflight: preflight({ sport: 'golf' }),
      capture: capture('golf', 'driver'),
      expect: { minLevel: 4, tierIn: ['good', 'excellent'], requireMetrics: true },
    },
    {
      name: 'tennis · decent side (usable)',
      description: '480p/30fps, full body, slightly dim.',
      track: tennis,
      preflight: preflight({
        sport: 'tennis',
        view: 'side',
        subjectCoverage: 0.72,
        trackingConfidence: 0.62,
        frameStats: stats(0.42, 0.2, 0.35),
        resolution: '480x854',
        estimatedFps: 30,
      }),
      capture: capture('tennis', 'forehand', 'side'),
      expect: { minLevel: 3, tierIn: ['usable', 'good'], requireMetrics: true },
    },
    {
      name: 'baseball · dim & soft (poor)',
      description: 'Half the frames track, dark and low-contrast, feet cropped.',
      track: withVisibility(bat, 0.45),
      preflight: preflight({
        sport: 'baseball',
        view: 'side',
        subjectCoverage: 0.5,
        trackingConfidence: 0.45,
        fullBodyVisible: false,
        frameStats: stats(0.25, 0.12, 0.15),
        resolution: '480x854',
        estimatedFps: 30,
      }),
      capture: capture('baseball', 'hitting', 'side'),
      expect: { minLevel: 2, tierIn: ['poor', 'usable'], requireGuidance: true, requireIssues: ['BODY_CROPPED', 'LOW_LIGHT'] },
    },
    {
      name: 'golf · dark phone clip (terrible)',
      description: 'Mostly untrackable, very dark, 240p/24fps.',
      track: withVisibility(golf, 0.2, 8),
      preflight: preflight({
        sport: 'golf',
        subjectCoverage: 0.25,
        trackingConfidence: 0.2,
        fullBodyVisible: false,
        frameStats: stats(0.12, 0.06, 0.05),
        resolution: '240x426',
        estimatedFps: 24,
      }),
      capture: capture('golf', 'driver'),
      expect: { minLevel: 1, tierIn: ['terrible', 'poor', 'not_defensible'], requireGuidance: true },
    },
    {
      name: 'no athlete in frame (not defensible)',
      description: 'Almost no pose found — capture guidance only.',
      track: withVisibility(golf, 0.1, 4),
      preflight: preflight({ subjectCoverage: 0.05, trackingConfidence: 0.1, fullBodyVisible: false }),
      capture: capture('golf', 'driver'),
      expect: { minLevel: 1, tierIn: ['not_defensible'], requireGuidance: true, requireIssues: ['NO_ATHLETE_VISIBLE'] },
    },
    {
      name: 'pickleball · bystander in frame (multi-person)',
      description: 'Good capture but two people detected.',
      track: generateSamplePoseTrack('dink'),
      preflight: preflight({ sport: 'pickleball', view: 'side', multiplePeople: true }),
      capture: capture('pickleball', 'dink', 'side'),
      expect: { minLevel: 3, requireIssues: ['MULTIPLE_PEOPLE'] },
    },
    {
      name: 'tennis · feet cropped (recoverable)',
      description: 'Bright and sharp but lower body out of frame.',
      track: tennis,
      preflight: preflight({ sport: 'tennis', view: 'side', fullBodyVisible: false }),
      capture: capture('tennis', 'forehand', 'side'),
      expect: { minLevel: 3, requireIssues: ['BODY_CROPPED'] },
    },
  ];
}
