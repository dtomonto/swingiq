'use client';

// ============================================================
// SwingVantage — Background Task Center
// ------------------------------------------------------------
// The always-visible surface for work that outlives the page that
// started it. Mounted once in the app shell, so it follows the user
// across every route:
//   • RUNNING tasks show a compact chip with live progress, a way back
//     to the task's page, and a cancel control.
//   • FINISHED tasks (success or error) show a toast with a "View"
//     action until acknowledged — so a user who walked away still sees
//     the result when they return.
//
// Positioned bottom-left (offset past the desktop sidebar) to stay clear
// of the FloatingCoach (bottom-right) and celebration toasts (bottom-center).
// ============================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import {
  useBackgroundTasks,
  type BackgroundTask,
} from '@/lib/background-tasks/BackgroundTasksProvider';
import { cn } from '@/lib/utils';

export function BackgroundTaskCenter() {
  const router = useRouter();
  const { tasks, dismissTask, markSeen, requestView } = useBackgroundTasks();

  const running = tasks.filter((t) => t.status === 'running');
  const finished = tasks.filter((t) => t.status !== 'running' && !t.seen);

  // Tab-title ping: when the user switches AWAY (tab hidden) while work is
  // running or just finished, reflect it in the browser tab so they're pulled
  // back. We only override the title while hidden and restore the live route
  // title on return, so Next.js per-route titles are never stomped.
  const runningCount = running.length;
  const readyCount = finished.filter((t) => t.status === 'success').length;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (runningCount === 0 && readyCount === 0) return;
    let saved: string | null = null;
    const sync = () => {
      if (document.hidden) {
        if (saved === null) saved = document.title;
        document.title = runningCount > 0 ? '⏳ Working… · SwingVantage' : '✅ Ready · SwingVantage';
      } else if (saved !== null) {
        document.title = saved;
        saved = null;
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      if (saved !== null) document.title = saved;
    };
  }, [runningCount, readyCount]);

  if (running.length === 0 && finished.length === 0) return null;

  const openTask = (task: BackgroundTask) => {
    if (!task.viewHref) return;
    requestView(task.id, task.kind);
    if (task.status !== 'running') markSeen(task.id);
    router.push(task.viewHref);
  };

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-4 z-[55] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 lg:bottom-6 lg:left-[17rem]"
      aria-live="polite"
    >
      {running.map((task) => (
        <RunningChip
          key={task.id}
          task={task}
          onOpen={() => openTask(task)}
          onCancel={() => dismissTask(task.id)}
        />
      ))}
      {finished.map((task) => (
        <FinishedToast
          key={task.id}
          task={task}
          onOpen={() => openTask(task)}
          onDismiss={() => markSeen(task.id)}
        />
      ))}
    </div>
  );
}

function RunningChip({
  task,
  onOpen,
  onCancel,
}: {
  task: BackgroundTask;
  onOpen: () => void;
  onCancel: () => void;
}) {
  const pct = task.progress != null ? Math.round(task.progress * 100) : null;
  return (
    <div className="pointer-events-auto rounded-2xl border border-border bg-card px-3 py-2.5 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left focus:outline-hidden"
          aria-label={`Open ${task.title}`}
        >
          <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            Working in the background{pct != null ? ` · ${pct}%` : '…'} — you can keep using SwingVantage
          </p>
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Cancel ${task.title}`}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {/* Progress track */}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all duration-500',
            pct == null && 'animate-pulse',
          )}
          style={{ width: pct != null ? `${pct}%` : '40%' }}
        />
      </div>
    </div>
  );
}

function FinishedToast({
  task,
  onOpen,
  onDismiss,
}: {
  task: BackgroundTask;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const isError = task.status === 'error';
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto rounded-2xl border bg-card px-4 py-3 shadow-lg ring-1',
        isError ? 'border-error/30 ring-error/10' : 'border-primary/30 ring-primary/10',
      )}
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
        ) : (
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wide',
              isError ? 'text-error' : 'text-primary',
            )}
          >
            {isError ? 'Couldn’t finish' : 'Ready'}
          </p>
          <p className="truncate text-sm font-bold text-foreground">{task.title}</p>
          <p className="text-xs leading-snug text-muted-foreground">
            {isError ? task.error : task.completionMessage ?? 'Finished.'}
          </p>
          {!isError && task.viewHref && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-hidden"
            >
              View result <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
