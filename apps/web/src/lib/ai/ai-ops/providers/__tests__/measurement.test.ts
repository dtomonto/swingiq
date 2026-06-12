import { describe, it, expect } from '@jest/globals';
import { loadAIConfig } from '../../model-config';
import {
  poseMetricsToMeasurement,
  getMeasurementProvider,
  createMediaPipeMeasurementProvider,
} from '../measurement';
import { MeasurementResultSchema } from '../../schemas';
import type { PoseMetricsLike } from '../../types';

const CONFIG = loadAIConfig({});
const POSE: PoseMetricsLike = {
  framesWithPose: 10,
  shoulderTurnRangeDeg: 88,
  spineAngleRangeDeg: 12,
  headSwayPct: 6,
  hipSwayPct: 9,
};

describe('poseMetricsToMeasurement', () => {
  it('produces a schema-valid result with honest, capped, estimated metrics', () => {
    const r = poseMetricsToMeasurement(POSE);
    expect(MeasurementResultSchema.safeParse(r).success).toBe(true);
    expect(r.provider).toBe('mediapipe');
    expect(r.derivedMetrics).toHaveLength(4);
    // Never claims a measured angle — proxies are 'estimated'.
    expect(r.derivedMetrics.every((m) => m.precision === 'estimated')).toBe(true);
    expect(r.derivedMetrics.every((m) => m.source === 'mediapipe' && m.limitations)).toBe(true);
    // Confidence is capped (single-camera 2D ceiling).
    expect(r.confidence).toBeLessThanOrEqual(0.6);
    expect(r.warnings.length).toBeGreaterThan(0);
    const turn = r.derivedMetrics.find((m) => m.name === 'shoulder_turn_range');
    expect(turn?.value).toBe(88);
    expect(turn?.unit).toBe('deg');
  });

  it('scales confidence with frame coverage but stays bounded', () => {
    const few = poseMetricsToMeasurement({ ...POSE, framesWithPose: 2 });
    const many = poseMetricsToMeasurement({ ...POSE, framesWithPose: 30 });
    expect(few.confidence).toBeLessThan(many.confidence);
    expect(many.confidence).toBeLessThanOrEqual(0.6);
  });
});

describe('MediaPipe measurement provider', () => {
  const provider = createMediaPipeMeasurementProvider({ config: CONFIG, now: () => '2026-01-01T00:00:00Z' });

  it('measures from client-supplied pose metrics', async () => {
    const { result, trace } = await provider.measure({ videoId: 'v1', poseMetrics: POSE });
    expect(result).not.toBeNull();
    expect(trace.status).toBe('ok');
    expect(trace.provider).toBe('mediapipe');
  });

  it('skips honestly (no fake data) when there is no usable pose', async () => {
    const { result, trace } = await provider.measure({ videoId: 'v1', poseMetrics: null });
    expect(result).toBeNull();
    expect(trace.status).toBe('skipped');
    expect(trace.errorCode).toBe('no_pose_data');

    const thin = await provider.measure({ videoId: 'v1', poseMetrics: { ...POSE, framesWithPose: 1 } });
    expect(thin.result).toBeNull();
    expect(thin.trace.errorCode).toBe('no_pose_data');
  });
});

describe('getMeasurementProvider factory', () => {
  it('returns the MediaPipe adapter by default', () => {
    expect(getMeasurementProvider({ config: CONFIG }).name).toBe('mediapipe');
  });

  it('returns a disabled provider for an unimplemented CV model (never fakes it)', async () => {
    const cfg = loadAIConfig({ MEASUREMENT_PROVIDER: 'movenet' });
    const provider = getMeasurementProvider({ config: cfg, now: () => '2026-01-01T00:00:00Z' });
    expect(provider.name).toBe('disabled');
    const { result, trace } = await provider.measure({ videoId: 'v1', poseMetrics: POSE });
    expect(result).toBeNull();
    expect(trace.errorCode).toMatch(/measurement_provider_unavailable/);
  });
});
