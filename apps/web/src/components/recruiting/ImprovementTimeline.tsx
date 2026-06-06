'use client';

// ============================================================
// Recruiting — ImprovementTimeline
// ------------------------------------------------------------
// An honest development timeline built from metric history samples:
// every logged value across all metrics, newest first, showing the
// trajectory coaches care about (not a single number).
// ============================================================

import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { CalendarClock } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRecruitingStore, getMetricDef, DATA_SOURCE_LABEL } from '@/lib/recruiting';

export function ImprovementTimeline({ sport }: { sport: SportId }) {
  const metrics = useRecruitingStore((s) => s.metrics);

  const events = useMemo(() => {
    const rows = metrics
      .filter((m) => m.sport === sport)
      .flatMap((m) =>
        m.history.map((h) => ({
          metricLabel: getMetricDef(m.metricKey)?.label ?? m.metricKey,
          unit: m.unit,
          value: h.value,
          date: h.date,
          source: h.source,
        })),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows.slice(0, 40);
  }, [metrics, sport]);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock size={17} className="text-primary" /> Development timeline</CardTitle></CardHeader>
      <CardBody>
        {events.length === 0 ? (
          <EmptyState icon={CalendarClock} compact title="No history yet" description="Log metric values over time to build a timeline that shows your trajectory." />
        ) : (
          <ol className="relative border-s border-border ms-2 space-y-3">
            {events.map((e, i) => (
              <li key={i} className="ms-4">
                <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-foreground"><b className="tabular-nums">{e.value}{e.unit ? ` ${e.unit}` : ''}</b> · {e.metricLabel}</p>
                  <time className="text-xs text-muted-foreground shrink-0">{new Date(e.date).toLocaleDateString()}</time>
                </div>
                <p className="text-xs text-muted-foreground">{DATA_SOURCE_LABEL[e.source]}</p>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
