'use client';

// ============================================================
// SwingVantage — Swing analysis pipeline (shared)
// ------------------------------------------------------------
// The prepare (extract frames + on-device pose) → AI vision → save flow
// that previously lived inline in both the golf and multi-sport video
// analyzers. It is factored out here so it can run inside a background
// task (see lib/background-tasks): the user can navigate away and the
// work keeps going, reporting progress + stage back through `sink`.
//
// It reuses prepareSwing's per-File cache, so the speculative warm-up
// kicked off on the configure screen is reused here (never re-extracts),
// and forwards the user's chosen speed/quality tier to the AI route.
// Privacy is unchanged: only sampled still frames are sent to the AI
// route; the original video never leaves the device.
// ============================================================

import { prepareSwing } from '@/lib/video/prepareSwing';
import { saveVideoAnalysis, type SavedVideoAnalysis } from '@/lib/video/history';
import type { PoseMetrics } from '@/lib/pose';
import type { AnalysisStage } from '@/components/video/AnalysisProgress';
import type {
  AIVisualAnalysis,
  PreviousAnalysisSummary,
  VisionSpeed,
  VisualSport,
} from '@swingiq/core';

export interface SwingAnalysisInput {
  videoFile: File;
  /** Sport key sent to the AI route + stored in history. */
  sport: VisualSport;
  /** Display label for the saved record, e.g. "Golf". */
  sportLabel: string;
  /** Optional emoji for the saved record. */
  emoji?: string;
  declaredCameraAngle: string;
  /** Previous-swing context fed to the AI (it judges only the new frames). */
  previous: PreviousAnalysisSummary | null;
  /** Vision speed/quality tier the user chose. */
  speed: VisionSpeed;
}

export interface SwingAnalysisResult {
  /** Validated analysis, or null when the AI provider is not configured. */
  analysis: AIVisualAnalysis | null;
  /** Set when the provider is not configured (mutually exclusive with analysis). */
  notConfiguredMessage: string | null;
  poseMetrics: PoseMetrics | null;
  savedRecord: SavedVideoAnalysis | null;
  comparedToPrevious: boolean;
}

/** Progress handle — compatible with a background task's run context. */
export interface AnalysisProgressSink {
  setStage: (stage: AnalysisStage) => void;
  setProgress: (fraction: number) => void;
  signal?: AbortSignal;
}

/** Coarse progress fraction per stage, for the global task indicator. */
const STAGE_PROGRESS: Record<AnalysisStage, number> = {
  preparing: 0.05,
  extracting: 0.25,
  measuring: 0.45,
  inspecting: 0.65,
  building: 0.9,
  plan: 0.97,
  done: 1,
};

function advance(sink: AnalysisProgressSink, stage: AnalysisStage) {
  sink.setStage(stage);
  sink.setProgress(STAGE_PROGRESS[stage]);
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Analysis cancelled.', 'AbortError');
}

/**
 * Run the full swing analysis. Reports stage + progress through `sink` and
 * checks `sink.signal` between phases so a cancelled background task stops
 * promptly. Mirrors the original inline pipeline exactly.
 */
export async function runSwingAnalysis(
  input: SwingAnalysisInput,
  sink: AnalysisProgressSink,
): Promise<SwingAnalysisResult> {
  advance(sink, 'preparing');
  throwIfAborted(sink.signal);

  // 1–2. Frames + pose — usually already prepared during "configure" (the
  // speculative warm-up), so this resolves quickly; otherwise it runs now.
  advance(sink, 'extracting');
  const { extraction, pose } = await prepareSwing(input.videoFile);
  advance(sink, 'measuring');
  throwIfAborted(sink.signal);

  // 3. Send only the frames + metadata (+ pose summary) to the AI route.
  advance(sink, 'inspecting');
  const res = await fetch('/api/video-vision-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sport: input.sport,
      frames: extraction.frames.map((f) => f.dataUrl),
      metadata: {
        durationSeconds: extraction.durationSeconds,
        resolution: extraction.resolution,
        declaredCameraAngle: input.declaredCameraAngle,
      },
      previous: input.previous,
      poseSummary: pose.summary,
      speed: input.speed,
    }),
    signal: sink.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (data?.configured === false) {
    return {
      analysis: null,
      notConfiguredMessage: data.message as string,
      poseMetrics: pose.metrics,
      savedRecord: null,
      comparedToPrevious: Boolean(input.previous),
    };
  }

  if (!res.ok || !data?.analysis) {
    throw new Error(
      (data?.error as string) ?? `Analysis failed (server returned ${res.status}).`,
    );
  }

  advance(sink, 'building');
  const analysis = data.analysis as AIVisualAnalysis;

  // Save to the user's local swing history for welcome-back + compare.
  const savedRecord = saveVideoAnalysis({
    sport: input.sport,
    sportLabel: input.sportLabel,
    emoji: input.emoji,
    declaredCameraAngle: input.declaredCameraAngle,
    analysis,
  });

  advance(sink, 'plan');

  return {
    analysis,
    notConfiguredMessage: null,
    poseMetrics: pose.metrics,
    savedRecord,
    comparedToPrevious: Boolean(input.previous),
  };
}
