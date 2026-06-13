'use client';

// ============================================================
// SwingVantage — Today's Tasks
// ------------------------------------------------------------
// Renders the committed plan's drills as a daily checklist the
// athlete can tick off. This is the surface that finally USES
// AgiCommitment.drills (previously stored but rendered nowhere),
// closing the "One plan" promise on the dashboard. Self-hides when
// no plan is committed. Check-offs persist for the day and reset
// each morning (see lib/agi/today-tasks).
// ============================================================

import Link from 'next/link';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { TierInvite } from '@/components/intelligence/TierInvite';
import { useTodayTasks } from '@/lib/agi/useTodayTasks';

export function TodaysTasks() {
  const { ready, planName, tasks, doneCount, total, toggle } = useTodayTasks();

  // Self-hide until hydrated and only when there's an active committed plan.
  if (!ready || total === 0) return null;

  const allDone = doneCount === total;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ListChecks size={18} className="text-success-text shrink-0" />
            <div className="min-w-0">
              <CardTitle>Today&apos;s Tasks</CardTitle>
              {planName && (
                <p className="text-xs text-muted-foreground truncate">
                  Working on: {planName}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {doneCount}/{total} done
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {/* Progress bar */}
        <div
          className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Today's tasks progress"
        >
          <div
            className="h-full rounded-full bg-success-text transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => toggle(t.key)}
                aria-pressed={t.done}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                {t.done ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-text" />
                ) : (
                  <Circle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={`text-sm ${
                    t.done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {t.fix}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {allDone
              ? "Nice — today's plan is done. Same again tomorrow keeps it sticking."
              : 'Check each off as you practise. Resets fresh tomorrow.'}
          </p>
          <Link
            href="/training"
            className="text-xs font-medium text-success-text hover:underline shrink-0"
          >
            Open practice
          </Link>
        </div>

        {/* Calm, admin-controlled early-access invitation (renders only when enabled). */}
        <TierInvite slot="todays-tasks" />
      </CardBody>
    </Card>
  );
}
