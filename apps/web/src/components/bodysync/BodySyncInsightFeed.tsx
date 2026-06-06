'use client';

import { Lightbulb, TrendingUp, AlertCircle, Sparkles, Brain, RefreshCw } from 'lucide-react';
import type { HealthInsight, InsightKind } from '@/lib/bodysync';

const KIND_ICON: Record<InsightKind, React.ReactNode> = {
  correlation: <Brain size={16} />,
  trend: <TrendingUp size={16} />,
  risk: <AlertCircle size={16} />,
  opportunity: <Sparkles size={16} />,
  pattern: <RefreshCw size={16} />,
  coaching_change: <Lightbulb size={16} />,
};

const KIND_TONE: Record<InsightKind, string> = {
  correlation: 'text-primary bg-primary/10',
  trend: 'text-primary bg-primary/10',
  risk: 'text-warning bg-warning/10',
  opportunity: 'text-success bg-success/10',
  pattern: 'text-primary bg-primary/10',
  coaching_change: 'text-primary bg-primary/10',
};

export function BodySyncInsightFeed({ insights }: { insights: HealthInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
        <Lightbulb size={20} className="mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-foreground">Insights unlock as you check in</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A few days of check-ins lets SwingVantage spot patterns between how you feel and how you swing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((ins) => (
        <div key={ins.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 rounded-full p-2 ${KIND_TONE[ins.kind]}`}>{KIND_ICON[ins.kind]}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground rounded-full bg-muted px-1.5 py-0.5">
                  {ins.confidence}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
