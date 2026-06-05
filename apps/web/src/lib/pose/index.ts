// SwingVantage — Pose module public API
//
// detectSwingPose() is the one call the analyzers use: run on-device pose
// detection over the extracted frames and return both the metrics (for the
// UI) and a compact summary (to ground the AI). Best-effort and never
// throws — returns nulls when pose detection isn't available.

export * from './pose-detection';
export * from './pose-metrics';

import { detectPoses, type PoseDetectInput } from './pose-detection';
import { computePoseMetrics, summarizePoseMetrics, type PoseMetrics } from './pose-metrics';

export async function detectSwingPose(
  frames: PoseDetectInput[],
): Promise<{ metrics: PoseMetrics | null; summary: string | null }> {
  try {
    const poses = await detectPoses(frames);
    const metrics = computePoseMetrics(poses);
    return { metrics, summary: metrics ? summarizePoseMetrics(metrics) : null };
  } catch {
    return { metrics: null, summary: null };
  }
}
