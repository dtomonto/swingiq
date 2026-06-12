'use client';

// ============================================================
// SwingVantage — useSwingAnalysis
// ------------------------------------------------------------
// Bridges the swing-analysis pipeline (runAnalysis) and the global
// background-task manager so the video analyzers can:
//   • start an analysis that keeps running after the user leaves /motion-lab,
//   • read live stage/progress + the final result back off the task,
//   • re-adopt an in-flight (or just-finished, via the "View" toast)
//     analysis when the user returns to the page.
//
// The heavy state (analysis, pose, saved record) is derived straight
// from the live task, so the page stays a thin view over the task and
// nothing is lost when its component unmounts during navigation.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  useBackgroundTasks,
  type BackgroundTask,
} from '@/lib/background-tasks/background-tasks-provider';
import {
  runSwingAnalysis,
  type SwingAnalysisInput,
  type SwingAnalysisResult,
} from '@/lib/video/run-analysis';
import type { AnalysisStage } from '@/components/video/AnalysisProgress';

const KIND = 'video-analysis';

export interface StartAnalysisMeta {
  /** Headline for the global task center, e.g. "Analyzing your golf swing". */
  title: string;
  /** Secondary line, e.g. the file name. */
  description?: string;
  /** Where the task center's chip / View action should return the user. */
  viewHref?: string;
}

export function useSwingAnalysis() {
  const { tasks, startTask, dismissTask, markSeen, consumeViewRequest } = useBackgroundTasks();
  const [taskId, setTaskId] = useState<string | null>(null);

  // Funnel instrumentation. We only emit the terminal (completed/failed) event
  // for an analysis THIS hook started, so it fires exactly once and never
  // re-fires when the hook re-adopts an already-finished task on a later visit.
  const startedSportRef = useRef<string>('unknown');
  const pendingTaskIdRef = useRef<string | null>(null);
  const firedTerminalRef = useRef<string | null>(null);

  // On mount, re-adopt an analysis that is already in flight (or one the user
  // asked to view from a completion toast on another page). A one-time effect
  // is the right tool here: we're bridging to the external task manager's
  // current state exactly once on entry, not on every change.
  useEffect(() => {
    const requested = consumeViewRequest(KIND);
    const running = tasks.find((t) => t.kind === KIND && t.status === 'running');
    const adopt = requested ?? running?.id ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time adoption on mount
    if (adopt) setTaskId(adopt);
    // Mount-only: we intentionally snapshot the task list once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const task = useMemo<BackgroundTask | null>(
    () => tasks.find((t) => t.id === taskId) ?? null,
    [tasks, taskId],
  );

  const result =
    task?.status === 'success' ? (task.result as SwingAnalysisResult | undefined) : undefined;

  // Emit ANALYSIS_COMPLETED / ANALYSIS_FAILED once, on the terminal transition
  // of the analysis this hook started. Guarded by pendingTaskIdRef (only our
  // task) + firedTerminalRef (only once) so re-renders and re-adoption can't
  // double-count — keeping the funnel's completed ≤ started invariant honest.
  useEffect(() => {
    if (!task || task.id !== pendingTaskIdRef.current) return;
    if (task.status !== 'success' && task.status !== 'error') return;
    if (firedTerminalRef.current === task.id) return;
    firedTerminalRef.current = task.id;

    const sport = startedSportRef.current;
    if (task.status === 'error') {
      track(ANALYTICS_EVENTS.ANALYSIS_FAILED, { sport, reason: task.error ?? 'unknown' });
      return;
    }
    const r = task.result as SwingAnalysisResult | undefined;
    track(ANALYTICS_EVENTS.ANALYSIS_COMPLETED, {
      sport,
      // A run can succeed yet return no analysis when no AI provider is set;
      // capturing that shows how many people reach the value moment but hit
      // the "AI not configured" wall.
      configured: Boolean(r?.analysis) && !r?.notConfiguredMessage,
    });
  }, [task]);

  const start = (input: SwingAnalysisInput, meta: StartAnalysisMeta): string => {
    // Acknowledge any previous finished task so its toast doesn't linger.
    if (task && task.status !== 'running') markSeen(task.id);
    const id = startTask<SwingAnalysisResult>({
      kind: KIND,
      title: meta.title,
      description: meta.description,
      viewHref: meta.viewHref ?? '/motion-lab',
      notify: true,
      run: (ctx) => runSwingAnalysis(input, ctx),
      completionMessage: (r) =>
        r.notConfiguredMessage
          ? 'AI review needs setup — open to see details.'
          : 'Your swing analysis is ready to view.',
    });
    // Funnel: the value moment begins. Remember this task so its terminal event
    // pairs with this start (see the effect above).
    startedSportRef.current = input.sport;
    pendingTaskIdRef.current = id;
    firedTerminalRef.current = null;
    track(ANALYTICS_EVENTS.ANALYSIS_STARTED, {
      sport: input.sport,
      speed: input.speed,
      compared: Boolean(input.previous),
    });
    setTaskId(id);
    return id;
  };

  /** Drop the adopted task reference (e.g. when the user starts a new video). */
  const reset = (cancel = false) => {
    if (cancel && task?.status === 'running') dismissTask(task.id);
    setTaskId(null);
  };

  return {
    task,
    status: task?.status ?? null,
    isRunning: task?.status === 'running',
    stage: (task?.stage as AnalysisStage | undefined) ?? 'preparing',
    analysis: result?.analysis ?? null,
    notConfiguredMessage: result?.notConfiguredMessage ?? null,
    poseMetrics: result?.poseMetrics ?? null,
    savedRecord: result?.savedRecord ?? null,
    comparedToPrevious: result?.comparedToPrevious ?? false,
    error: task?.status === 'error' ? task.error ?? 'Analysis failed.' : null,
    start,
    reset,
  };
}
