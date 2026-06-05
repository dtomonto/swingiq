'use client';

// ============================================================
// SwingVantage — Returning-User "Welcome Back" + Swing History
// ------------------------------------------------------------
// Surfaces the user's most recent saved analysis for the current
// sport, lets them turn on "compare to my last swing" (which feeds
// the prior priorities to the AI as context), and lists recent
// analyses with export / remove. Purely presentational — the parent
// owns loading and state so deletes re-render correctly.
// ============================================================

import { History, Download, Trash2, RefreshCw } from 'lucide-react';
import type { SavedVideoAnalysis } from '@/lib/video/history';
import { cn } from '@/lib/utils';

function confidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 0.66) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

interface VideoWelcomeBackProps {
  latest: SavedVideoAnalysis | null;
  recent: SavedVideoAnalysis[];
  compareEnabled: boolean;
  onCompareChange: (enabled: boolean) => void;
  onExport: (record: SavedVideoAnalysis) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function VideoWelcomeBack({
  latest,
  recent,
  compareEnabled,
  onCompareChange,
  onExport,
  onDelete,
  className,
}: VideoWelcomeBackProps) {
  if (!latest) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Welcome back */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>
            {latest.emoji ?? '🎯'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              Welcome back to your {latest.sportLabel} analysis
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Last time you were working on:{' '}
              <span className="font-semibold text-foreground">{latest.topFocus}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(latest.createdAt)} · {confidenceLabel(latest.overallConfidence)} confidence
            </p>

            <label className="mt-3 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => onCompareChange(e.target.checked)}
                className="rounded-sm border-primary/50 text-primary"
              />
              <span className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                Compare to my last swing
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-1 pl-6">
              We&apos;ll give the AI your previous focus areas as context. It still judges only your
              new video — it won&apos;t assume you improved.
            </p>
          </div>
        </div>
      </div>

      {/* Recent history */}
      {recent.length > 0 && (
        <details className="rounded-xl border border-border bg-card">
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 select-none">
            <History className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Your saved {latest.sportLabel} swings ({recent.length})
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Tap to expand</span>
          </summary>
          <ul className="px-4 pb-4 space-y-2">
            {recent.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 rounded-lg bg-muted border border-border p-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{record.topFocus}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(record.createdAt)} ·{' '}
                    {confidenceLabel(record.overallConfidence)} confidence
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onExport(record)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                  aria-label={`Export the analysis from ${formatDate(record.createdAt)} as JSON`}
                  title="Export as JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-error hover:bg-card transition-colors"
                  aria-label={`Remove the analysis from ${formatDate(record.createdAt)}`}
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
