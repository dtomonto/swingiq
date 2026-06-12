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

import { prepareSwing } from '@/lib/video/prepare-swing';
import { saveVideoAnalysis, type SavedVideoAnalysis } from '@/lib/video/history';
import { putClip } from '@/lib/video/clip-store';
import { syncAnalysisToProfile } from '@/lib/video/profile-sync';
import { logAnalysisFailure } from '@/lib/reliability-os/capture';
import type { PoseMetrics } from '@/lib/pose';
import type { AnalysisStage } from '@/components/video/AnalysisProgress';
import { detectPoseIssues } from '@swingiq/core';
import type {
  AIVisualAnalysis,
  PreviousAnalysisSummary,
  VisionSpeed,
  VisualSport,
  SportDetectedIssue,
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
  /** Honest, pose-derived deterministic faults (non-golf). Computed locally
   *  from the MediaPipe pose track — available even when AI is keyless. */
  poseDerivedIssues: SportDetectedIssue[];
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
  try {
    return await runSwingAnalysisInner(input, sink);
  } catch (err) {
    // Surface real analysis failures to ReliabilityOS so admins can see breakage
    // (previously these were silent). Cancellations (AbortError) are intentional.
    if (!(err instanceof DOMException && err.name === 'AbortError')) {
      logAnalysisFailure({
        route: typeof window !== 'undefined' ? window.location?.pathname : undefined,
        actionName: `analyze:${input.sport}`,
        error: err,
        metadata: { sport: input.sport, cameraAngle: input.declaredCameraAngle, speed: input.speed },
      });
    }
    throw err;
  }
}

async function runSwingAnalysisInner(
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

  // Pose-derived deterministic faults (non-golf). PoseMetrics is structurally
  // a SportPoseFeatures; detectPoseIssues returns [] for golf or no-pose, so
  // this is safe + honest (is_estimated, conservative confidence) and works
  // even when the AI provider is keyless. (Intelligence Learning Audit P3.)
  const poseDerivedIssues: SportDetectedIssue[] = pose.metrics
    ? detectPoseIssues(input.sport, pose.metrics)
    : [];

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
      poseDerivedIssues,
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

  // Record this swing as historical data ON THE PROFILE: write a metadata row
  // into the account-synced store (video_analyses) so it (1) shows on the
  // dashboard's Recent Analyses and (2) persists to the user's Supabase
  // account when signed in — surviving new devices / a browser clear, and
  // letting a profile hold an unbounded history (≥10). The full text analysis
  // + replay clip stay device-local by privacy design (see history/clip-store).
  // Best-effort: a store failure must never fail the analysis.
  syncAnalysisToProfile({
    sport: input.sport,
    fileName: input.videoFile.name,
    declaredCameraAngle: input.declaredCameraAngle,
    analysis,
  });

  // Persist the original clip on-device (IndexedDB) so the user can replay it
  // later from their swing history. Best-effort: a storage failure must never
  // fail the analysis, so we keep going regardless of the outcome.
  if (savedRecord) {
    await putClip(savedRecord.id, input.videoFile, input.sport).catch(() => false);
  }

  advance(sink, 'plan');

  return {
    analysis,
    notConfiguredMessage: null,
    poseMetrics: pose.metrics,
    poseDerivedIssues,
    savedRecord,
    comparedToPrevious: Boolean(input.previous),
  };
}
