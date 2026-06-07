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
  done: { label: 'Done', tone: 'success', icon: CheckCircle2, ring: 'border-emerald-500/30' },
  'action-needed': { label: 'Action needed', tone: 'warning', icon: AlertTriangle, ring: 'border-amber-500/30' },
  'optional-todo': { label: 'Optional', tone: 'info', icon: Circle, ring: 'border-gray-800' },
  reference: { label: 'Reference', tone: 'neutral', icon: Info, ring: 'border-gray-800' },
};

const PRIORITY_TONE: Record<SetupPriority, BadgeTone> = {
  required: 'danger', recommended: 'accent', optional: 'neutral',
};

function InputRow({ input }: { input: SetupInput }) {
  if (input.kind === 'url') {
    return (
      <li className="flex items-center gap-2 text-sm">
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        <a
          href={input.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline"
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
      <Icon className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <code className="rounded bg-gray-950 px-1.5 py-0.5 font-mono text-[12px] text-gray-200">
        {input.value}
      </code>
      <CopyButton text={input.value} label={input.label ?? input.value} />
      {input.secret && (
        <StatusBadge tone="danger">
          <Lock className="h-2.5 w-2.5" /> keep secret
        </StatusBadge>
      )}
      {input.where && <span className="text-[11px] text-gray-500">— {input.where}</span>}
      {input.example && (
        <span className="text-[11px] text-gray-600">e.g. <span className="font-mono">{input.example}</span></span>
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
    <div className={`rounded-xl border bg-gray-900 p-4 ${meta.ring} ${isDone ? 'opacity-80' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            isDone ? 'text-emerald-400' : task.status === 'action-needed' ? 'text-amber-400' : 'text-gray-500'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold ${isDone ? 'text-gray-300' : 'text-gray-100'}`}>
              {task.title}
            </h3>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            {task.priority !== 'optional' && task.status !== 'done' && (
              <StatusBadge tone={PRIORITY_TONE[task.priority]}>
                {task.priority === 'required' ? 'Required' : 'Recommended'}
              </StatusBadge>
            )}
            {task.autoDetected && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/80">
                <Sparkles className="h-3 w-3" /> detected automatically
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">{task.plainEnglish}</p>
        </div>
      </div>

      {/* Steps + inputs (collapsed once done to keep the page calm) */}
      {(task.steps.length > 0 || (task.inputs && task.inputs.length > 0)) && (
        <details className="group mt-3" open={!isDone && task.status !== 'reference' ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline">
            <ClipboardList className="h-3.5 w-3.5" />
            {isDone ? 'View the steps again' : 'Show me how, step by step'}
          </summary>

          <div className="mt-3 space-y-3 border-l-2 border-gray-800 pl-4">
            {task.steps.length > 0 && (
              <ol className="list-decimal space-y-1.5 pl-4 text-sm text-gray-300 marker:text-gray-600">
                {task.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            )}

            {task.inputs && task.inputs.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
              <p className="text-[11px] text-gray-600">Source: {task.source}</p>
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
                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
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
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:underline"
          >
            {task.learnMoreLabel ?? 'Learn more'} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
