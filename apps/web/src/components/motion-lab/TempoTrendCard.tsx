'use client';

// ============================================================
// SwingVantage — Motion Lab: cross-session tempo trend
// ------------------------------------------------------------
// Reads the measured tempo (back:through ratio) from the user's stored
// sessions and shows how it's tracking toward the ideal 3:1 over time —
// a sparkline + plain-language trend. All real, measured data; nothing
// fabricated. Renders nothing until there's at least one timed session.
// ============================================================

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import type { MotionSession } from '@/lib/motion-lab';
import { sessionsToTempoEntries, tempoTrend, IDEAL_FULL_RATIO } from '@/lib/tempo-sync';

interface Props {
  sessions: MotionSession[];
  accent?: string;
}

const DIRECTION_LABEL: Record<string, string> = {
  improving: 'Improving',
  drifting: 'Drifting',
  steady: 'Steady',
  'n/a': 'First read',
};

export function TempoTrendCard({ sessions, accent = '#22C55E' }: Props) {
  const entries = useMemo(() => sessionsToTempoEntries(sessions), [sessions]);
  const trend = useMemo(() => tempoTrend(entries), [entries]);
  if (!trend) return null;

  // Oldest → newest for the sparkline.
  const series = [...entries].reverse();
  const ratios = series.map((e) => e.ratio);
  const lo = Math.min(IDEAL_FULL_RATIO, ...ratios) - 0.3;
  const hi = Math.max(IDEAL_FULL_RATIO, ...ratios) + 0.3;
  const W = 240;
  const H = 56;
  const x = (i: number) => (series.length <= 1 ? W / 2 : (i / (series.length - 1)) * (W - 8) + 4);
  const y = (r: number) => H - 6 - ((r - lo) / Math.max(1e-6, hi - lo)) * (H - 12);
  const idealY = y(IDEAL_FULL_RATIO);
  const points = series.map((e, i) => `${x(i).toFixed(1)},${y(e.ratio).toFixed(1)}`).join(' ');

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: accent }} />
          <p className="text-sm font-semibold text-foreground">
            Tempo trend — {trend.count} timed session{trend.count === 1 ? '' : 's'}
          </p>
          <span className="ml-auto text-xs font-semibold tabular-nums" style={{ color: accent }}>
            {DIRECTION_LABEL[trend.direction]}
          </span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tempo ratio across sessions">
          {/* ideal 3:1 reference line */}
          <line x1="0" y1={idealY} x2={W} y2={idealY} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 4" />
          <text x={W - 2} y={idealY - 3} textAnchor="end" className="fill-muted-foreground text-[8px]">
            ideal {IDEAL_FULL_RATIO}:1
          </text>
          {series.length > 1 && (
            <polyline points={points} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          )}
          {series.map((e, i) => (
            <circle key={e.id} cx={x(i)} cy={y(e.ratio)} r={i === series.length - 1 ? 3.5 : 2} fill={accent} />
          ))}
        </svg>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground tabular-nums">
          <span>Latest <b className="text-foreground">{trend.latest.ratio}:1</b></span>
          <span>Best <b className="text-foreground">{trend.bestRatio}:1</b></span>
          <span>Average <b className="text-foreground">{trend.avgRatio}:1</b></span>
        </div>
        <p className="text-xs text-muted-foreground">{trend.summary}</p>
      </CardBody>
    </Card>
  );
}
