'use client';

// ============================================================
// SwingVantage — Performance Graph Card (foundation preview)
// ------------------------------------------------------------
// Shows the live shape of the user's improvement graph (real counts
// from their data) plus the most-connected fault, with an honest
// note that the proprietary ML graph is a future layer.
// ============================================================

import { Share2, Info } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { PERFORMANCE_GRAPH_DISCLAIMER, type GraphSummary } from '@/lib/performanceGraph';

const TYPE_LABELS: { key: keyof GraphSummary['countsByType']; label: string }[] = [
  { key: 'sport', label: 'Sports' },
  { key: 'session', label: 'Sessions' },
  { key: 'fault', label: 'Faults' },
  { key: 'drill', label: 'Drills' },
  { key: 'retest', label: 'Retests' },
];

export function PerformanceGraphCard({ summary }: { summary: GraphSummary }) {
  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Share2 size={13} /> Performance Graph
        </div>

        <p className="text-sm text-muted-foreground">
          Everything you do connects: sessions surface faults, faults link to drills, drills lead to
          retests. Your map so far —
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TYPE_LABELS.map(({ key, label }) => (
            <div key={key} className="text-center rounded-lg bg-muted/60 border border-border py-3">
              <p className="text-xl font-bold text-foreground">{summary.countsByType[key]}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {summary.nodeCount} connected points · {summary.edgeCount} links
          {summary.mostConnectedFault && summary.mostConnectedFault.connections > 0 && (
            <> · most-connected focus: <span className="text-foreground font-medium">{summary.mostConnectedFault.label}</span></>
          )}
        </p>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
          <Info size={12} className="shrink-0 mt-0.5" /> {PERFORMANCE_GRAPH_DISCLAIMER}
        </p>
      </CardBody>
    </Card>
  );
}
