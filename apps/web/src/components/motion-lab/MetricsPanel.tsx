'use client';

// ============================================================
// SwingIQ — Motion Lab: Metrics Panel
// Honest, expandable metric cards. Every metric shows its value,
// a normalized quality bar, confidence, basis, and a "why it matters"
// + limitations section on expand.
// ============================================================

import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { MotionMetric } from '@/lib/motion-lab';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

function scoreColor(score: number | null): string {
  if (score == null) return 'bg-muted';
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-error';
}

function MetricRow({ m }: { m: MotionMetric }) {
  const [open, setOpen] = useState(false);
  const hasValue = m.value != null && m.normalizedScore != null;
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
            {m.basis !== 'measured' && (
              <Badge variant={m.basis === 'placeholder' ? 'default' : 'info'} className="text-[9px] px-1.5 py-0">
                {m.basis === 'placeholder' ? 'needs data' : 'estimated'}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {hasValue ? (
              <>
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden max-w-[160px]">
                  <div className={cn('h-full rounded-full', scoreColor(m.normalizedScore))} style={{ width: `${m.normalizedScore}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{m.value}{m.unit}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">Needs more data</span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(m.confidence * 100)}%</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 text-xs border-t border-border bg-muted/30">
          <p className="text-foreground">{m.explanation}</p>
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">Why it matters: </span>{m.whyItMatters}</p>
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">Try this: </span>{m.recommendedFix}</p>
          <p className="text-[11px] text-muted-foreground/80 flex items-start gap-1 pt-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />{m.limitations}
          </p>
        </div>
      )}
    </div>
  );
}

export function MetricsPanel({ metrics }: { metrics: MotionMetric[] }) {
  return (
    <div className="space-y-2">
      {metrics.map((m) => <MetricRow key={m.id} m={m} />)}
    </div>
  );
}
