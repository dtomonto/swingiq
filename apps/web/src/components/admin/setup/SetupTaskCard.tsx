'use client';

// ============================================================
// SwingVantage Admin — Setup hub: one task card
// ------------------------------------------------------------
// Beginner-first layout: status at a glance, a plain-English "why",
// numbered steps, and every value to copy/open with a button. Manual
// tasks get a "Mark done / Not done yet" toggle; auto-detected ones show
// "Detected automatically" and can't be faked.
// ============================================================

import Link from 'next/link';
import {
  CheckCircle2, Circle, AlertTriangle, Info, Terminal, FileText,
  ExternalLink, KeyRound, ClipboardList, Lock, ArrowRight, Sparkles,
} from 'lucide-react';
import type { ResolvedTask, SetupInput, SetupStatus, SetupPriority } from '@/lib/admin/setup/types';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { CopyButton } from './CopyButton';

const STATUS_META: Record<SetupStatus, { label: string; tone: BadgeTone; icon: typeof CheckCircle2; ring: string }> = {
  done: { label: 'Done', tone: 'success', icon: CheckCircle2, ring: 'border-success/30' },
  'action-needed': { label: 'Action needed', tone: 'warning', icon: AlertTriangle, ring: 'border-primary/30' },
  'optional-todo': { label: 'Optional', tone: 'info', icon: Circle, ring: 'border-border' },
  reference: { label: 'Reference', tone: 'neutral', icon: Info, ring: 'border-border' },
};

const PRIORITY_TONE: Record<SetupPriority, BadgeTone> = {
  required: 'danger', recommended: 'accent', optional: 'neutral',
};

function InputRow({ input }: { input: SetupInput }) {
  if (input.kind === 'url') {
    return (
      <li className="flex items-center gap-2 text-sm">
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-link" />
        <a
          href={input.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:underline"
        >
          {input.label ?? input.value}
        </a>
      </li>
    );
  }

  const icon =
    input.kind === 'command' ? Terminal : input.kind === 'file' ? FileText : KeyRound;
  const Icon = icon;

  return (
    <li className="flex flex-wrap items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-link" />
      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[12px] text-foreground">
        {input.value}
      </code>
      <CopyButton text={input.value} label={input.label ?? input.value} />
      {input.secret && (
        <StatusBadge tone="danger">
          <Lock className="h-2.5 w-2.5" /> keep secret
        </StatusBadge>
      )}
      {input.where && <span className="text-2xs text-muted-foreground">— {input.where}</span>}
      {input.example && (
        <span className="text-2xs text-muted-foreground/70">e.g. <span className="font-mono">{input.example}</span></span>
      )}
    </li>
  );
}

export function SetupTaskCard({
  task,
  acknowledged,
  onToggle,
}: {
  task: ResolvedTask;
  acknowledged: boolean;
  onToggle: () => void;
}) {
  const meta = STATUS_META[task.status];
  const Icon = meta.icon;
  const isDone = task.status === 'done';
  // Only truly-manual tasks get the "I've done this" toggle.
  const canMarkManually = task.detect.kind === 'manual';

  return (
    <div className={`rounded-xl border bg-card p-4 ${meta.ring} ${isDone ? 'opacity-80' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            isDone ? 'text-success-text' : task.status === 'action-needed' ? 'text-link' : 'text-muted-foreground'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold ${isDone ? 'text-foreground' : 'text-foreground'}`}>
              {task.title}
            </h3>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            {task.priority !== 'optional' && task.status !== 'done' && (
              <StatusBadge tone={PRIORITY_TONE[task.priority]}>
                {task.priority === 'required' ? 'Required' : 'Recommended'}
              </StatusBadge>
            )}
            {task.autoDetected && (
              <span className="inline-flex items-center gap-1 text-2xs text-success-text/80">
                <Sparkles className="h-3 w-3" /> detected automatically
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{task.plainEnglish}</p>
        </div>
      </div>

      {/* Steps + inputs (collapsed once done to keep the page calm) */}
      {(task.steps.length > 0 || (task.inputs && task.inputs.length > 0)) && (
        <details className="group mt-3" open={!isDone && task.status !== 'reference' ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-link hover:underline">
            <ClipboardList className="h-3.5 w-3.5" />
            {isDone ? 'View the steps again' : 'Show me how, step by step'}
          </summary>

          <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
            {task.steps.length > 0 && (
              <ol className="list-decimal space-y-1.5 pl-4 text-sm text-foreground marker:text-muted-foreground/70">
                {task.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            )}

            {task.inputs && task.inputs.length > 0 && (
              <div>
                <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What to copy / open
                </p>
                <ul className="space-y-1.5">
                  {task.inputs.map((input, i) => (
                    <InputRow key={i} input={input} />
                  ))}
                </ul>
              </div>
            )}

            {task.source && (
              <p className="text-2xs text-muted-foreground/70">Source: {task.source}</p>
            )}
          </div>
        </details>
      )}

      {/* Footer actions */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {canMarkManually && (
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              acknowledged
                ? 'border-border bg-muted text-foreground hover:border-border'
                : 'border-success/40 bg-success/10 text-success-text hover:bg-success/20'
            }`}
          >
            {acknowledged ? (
              <>
                <Circle className="h-3.5 w-3.5" /> Mark as not done
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> I&apos;ve done this
              </>
            )}
          </button>
        )}

        {task.learnMoreHref && (
          <Link
            href={task.learnMoreHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-link hover:underline"
          >
            {task.learnMoreLabel ?? 'Learn more'} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
