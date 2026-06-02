'use client';

// ============================================================
// SwingIQ — Motion Lab: Comparison Panel
// Metric-by-metric deltas between two sessions, with an honest,
// variation-aware recommendation. The 3D ghost overlay is driven
// separately by the dashboard's viewer.
// ============================================================

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';
import { compareSessions } from '@/lib/motion-lab';
import type { MotionSession } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function MotionComparisonPanel({ base, compare }: { base: MotionSession; compare: MotionSession }) {
  const cmp = useMemo(() => compareSessions(compare, base), [base, compare]);
  // base = current (after), compare = previous (before) → compareSessions(before, after)

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> vs {new Date(compare.createdAt).toLocaleDateString()}
          </p>
          <span className={cn('text-sm font-bold', cmp.overallDelta >= 0 ? 'text-success' : 'text-error')}>
            {cmp.overallDelta >= 0 ? '+' : ''}{cmp.overallDelta} overall
          </span>
        </div>

        <p className="text-xs text-muted-foreground">{cmp.recommendation}</p>

        <div className="space-y-1 pt-1">
          {cmp.metricDeltas
            .filter((d) => d.delta != null)
            .map((d) => {
              const up = d.improved === true;
              const down = d.improved === false;
              const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
              return (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 text-foreground truncate">{d.name}</span>
                  <span className="text-muted-foreground tabular-nums">{d.before}{d.unit} → {d.after}{d.unit}</span>
                  <Icon className={cn('w-3.5 h-3.5 shrink-0', up ? 'text-success' : down ? 'text-error' : 'text-muted-foreground')} />
                </div>
              );
            })}
        </div>
      </CardBody>
    </Card>
  );
}
