'use client';

// ============================================================
// SwingIQ — Background Tasks Provider
// ------------------------------------------------------------
// Lets a long-running upload / analysis keep working after the user
// navigates away, and notifies them when it finishes. The provider is
// mounted ONCE in the authenticated app layout (app/(app)/layout.tsx),
// ABOVE the routed page content. Because that layout does not remount
// when the user moves between app routes, any task started here keeps
// running and its result stays available — even though the page that
// kicked it off has unmounted.
//
// Design notes / honest limits:
//   • Tasks live in memory only. A full page RELOAD tears down the
//     client JS context, so in-flight client-side work (browser frame
//     extraction, fetches) cannot survive a reload — we deliberately do
//     not persist a "running" task that could never resume. Results
//     that matter are saved by the task itself (e.g. video history).
//   • "Notified when complete" = an in-app toast always (see
//     BackgroundTaskCenter) PLUS an OS notification when the tab is
//     hidden, so a user who switched away still gets pulled back.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isDocumentHidden,
  requestNotificationPermission,
  showBackgroundTaskNotification,
} from './notify';

export type BackgroundTaskStatus = 'running' | 'success' | 'error';

export interface BackgroundTask<TResult = unknown> {
  id: string;
  /** Stable category, e.g. 'video-analysis'. Used for adoption/dedupe. */
  kind: string;
  /** Headline shown in the task center, e.g. "Analyzing your golf swing". */
  title: string;
  /** Optional secondary line, e.g. the file name. */
  description?: string;
  status: BackgroundTaskStatus;
  /** 0–1 fraction, or null while indeterminate. */
  progress: number | null;
  /** Free-form stage key the originating page can map to its own UI. */
  stage?: string;
  /** Where the task center's "View" / chip click should navigate. */
  viewHref?: string;
  /** Human completion line for the toast / OS notification. */
  completionMessage?: string;
  /** Whether the user has already seen the finished toast. */
  seen: boolean;
  createdAt: number;
  finishedAt?: number;
  result?: TResult;
  error?: string;
}

/** Handle passed to a task runner so it can report progress + honor cancel. */
export interface TaskRunContext {
  setProgress: (p: number | null) => void;
  setStage: (stage: string) => void;
  signal: AbortSignal;
}

export interface StartTaskOptions<TResult> {
  kind: string;
  title: string;
  description?: string;
  viewHref?: string;
  /** Request an OS notification on completion (default true). */
  notify?: boolean;
  run: (ctx: TaskRunContext) => Promise<TResult>;
  /** Build the completion line from the result (success path). */
  completionMessage?: (result: TResult) => string;
  /** Cleanup when the task is dismissed (e.g. revoke object URLs). */
  dispose?: (result: TResult | undefined) => void;
}

interface BackgroundTasksContextValue {
  tasks: BackgroundTask[];
  /** Start a task; returns its id. Runs immediately in the background. */
  startTask: <TResult>(opts: StartTaskOptions<TResult>) => string;
  /** Cancel (if running) and remove a task entirely. */
  dismissTask: (id: string) => void;
  /** Mark a finished task's toast as acknowledged (keeps the result). */
  markSeen: (id: string) => void;
  /** Record that the user wants to view a task's result on its page. */
  requestView: (id: string, kind: string) => void;
  /** Consume a pending view request (optionally matching a kind). */
  consumeViewRequest: (kind?: string) => string | null;
}

const BackgroundTasksContext = createContext<BackgroundTasksContextValue | null>(null);

/** Keep memory bounded: at most this many finished tasks are retained. */
const MAX_FINISHED = 6;

let taskSeq = 0;
function nextId(): string {
  taskSeq += 1;
  return `task_${Date.now().toString(36)}_${taskSeq}`;
}

export function BackgroundTasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  // Per-task abort controllers + dispose/notify config kept off-state in refs.
  const controllers = useRef(new Map<string, AbortController>());
  const disposers = useRef(new Map<string, (result: unknown) => void>());
  const viewRequest = useRef<{ id: string; kind: string } | null>(null);

  const patch = useCallback((id: string, updates: Partial<BackgroundTask>) => {
    // Functional update guards against patching a task the user already
    // dismissed mid-run (id no longer present → no-op).
    setTasks((prev) =>
      prev.some((t) => t.id === id) ? prev.map((t) => (t.id === id ? { ...t, ...updates } : t)) : prev,
    );
  }, []);

  const startTask = useCallback(
    <TResult,>(opts: StartTaskOptions<TResult>): string => {
      const id = nextId();
      const controller = new AbortController();
      controllers.current.set(id, controller);
      if (opts.dispose) {
        disposers.current.set(id, opts.dispose as (result: unknown) => void);
      }

      const task: BackgroundTask<TResult> = {
        id,
        kind: opts.kind,
        title: opts.title,
        description: opts.description,
        status: 'running',
        progress: null,
        viewHref: opts.viewHref,
        seen: false,
        createdAt: Date.now(),
      };

      // Insert new task; prune older FINISHED tasks of the same kind plus an
      // overall cap so memory + the task center stay tidy.
      setTasks((prev) => {
        const keptSameKind = prev.filter((t) => !(t.kind === opts.kind && t.status !== 'running'));
        const next = [task as BackgroundTask, ...keptSameKind];
        const running = next.filter((t) => t.status === 'running');
        const finished = next.filter((t) => t.status !== 'running').slice(0, MAX_FINISHED);
        return [...running, ...finished];
      });

      // Politely ask for OS-notification permission, tied to the user gesture
      // that started this task. Only prompts the first time (state 'default').
      const wantsNotify = opts.notify !== false;
      if (wantsNotify) void requestNotificationPermission();

      const ctx: TaskRunContext = {
        setProgress: (p) => patch(id, { progress: p }),
        setStage: (stage) => patch(id, { stage }),
        signal: controller.signal,
      };

      void (async () => {
        try {
          const result = await opts.run(ctx);
          const completionMessage = opts.completionMessage?.(result);
          patch(id, {
            status: 'success',
            progress: 1,
            finishedAt: Date.now(),
            result,
            completionMessage,
          });
          if (wantsNotify && isDocumentHidden()) {
            showBackgroundTaskNotification(
              task.title,
              completionMessage ?? 'Finished — open SwingIQ to view it.',
              `swingiq-${opts.kind}`,
            );
          }
        } catch (err) {
          // User-initiated cancel: drop the task quietly.
          if (controller.signal.aborted) {
            disposers.current.delete(id);
            controllers.current.delete(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
            return;
          }
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          patch(id, { status: 'error', progress: null, finishedAt: Date.now(), error: message });
          if (wantsNotify && isDocumentHidden()) {
            showBackgroundTaskNotification(
              task.title,
              `Couldn't finish: ${message}`,
              `swingiq-${opts.kind}`,
            );
          }
        } finally {
          controllers.current.delete(id);
        }
      })();

      return id;
    },
    [patch],
  );

  const dismissTask = useCallback((id: string) => {
    const controller = controllers.current.get(id);
    if (controller) controller.abort();
    controllers.current.delete(id);
    const dispose = disposers.current.get(id);
    if (dispose) {
      setTasks((prev) => {
        const target = prev.find((t) => t.id === id);
        try {
          dispose(target?.result);
        } catch {
          /* dispose must never throw */
        }
        return prev.filter((t) => t.id !== id);
      });
      disposers.current.delete(id);
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const markSeen = useCallback((id: string) => patch(id, { seen: true }), [patch]);

  const requestView = useCallback((id: string, kind: string) => {
    viewRequest.current = { id, kind };
  }, []);

  const consumeViewRequest = useCallback((kind?: string) => {
    const req = viewRequest.current;
    if (!req) return null;
    if (kind && req.kind !== kind) return null;
    viewRequest.current = null;
    return req.id;
  }, []);

  const value = useMemo<BackgroundTasksContextValue>(
    () => ({ tasks, startTask, dismissTask, markSeen, requestView, consumeViewRequest }),
    [tasks, startTask, dismissTask, markSeen, requestView, consumeViewRequest],
  );

  return (
    <BackgroundTasksContext.Provider value={value}>{children}</BackgroundTasksContext.Provider>
  );
}

/**
 * Access the background-task manager. Returns a safe no-op shape when used
 * outside the provider (e.g. marketing routes) so callers never need to
 * null-check — the provider only wraps the authenticated app surface.
 */
export function useBackgroundTasks(): BackgroundTasksContextValue {
  const ctx = useContext(BackgroundTasksContext);
  if (ctx) return ctx;
  return {
    tasks: [],
    startTask: () => '',
    dismissTask: () => {},
    markSeen: () => {},
    requestView: () => {},
    consumeViewRequest: () => null,
  };
}
