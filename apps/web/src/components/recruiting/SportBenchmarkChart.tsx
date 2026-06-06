'use client';

// ============================================================
// Recruiting — SportBenchmarkChart (SVG strength radar)
// ------------------------------------------------------------
// Plots each benchmarked metric's normalized position (0–100) against
// estimated sport reference bands. Labeled clearly as estimated
// reference — never a projection. Needs ≥3 benchmarked metrics to draw.
// ============================================================

import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import {
  type PlayerMetric,
  benchmarkPosition,
  getMetricDef,
  hasBenchmark,
} from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';

export function SportBenchmarkChart({ metrics, sport }: { metrics: PlayerMetric[]; sport: SportId }) {
  const points = useMemo(() => {
    return metrics
      .filter((m) => m.currentValue != null && hasBenchmark(m.metricKey, sport))
      .map((m) => {
        const pos = benchmarkPosition(m.metricKey, sport, m.currentValue!)!;
        return { label: getMetricDef(m.metricKey)?.label ?? m.metricKey, value: pos.normalized, nearest: pos.nearestLabel };
      })
      .slice(0, 8);
  }, [metrics, sport]);

  if (points.length < 3) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least 3 metrics with reference data (for {SPORT_META[sport].name.toLowerCase()}) to see your strength radar.
      </p>
    );
  }

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const n = points.length;
  const accent = SPORT_META[sport].accentColor;

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const coord = (i: number, radiusFrac: number) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r * radiusFrac, cy + Math.sin(a) * r * radiusFrac];
  };

  const polygon = points.map((p, i) => coord(i, Math.max(0.04, p.value / 100)).join(',')).join(' ');
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Strength radar vs estimated sport reference">
        {rings.map((f) => (
          <polygon
            key={f}
            points={points.map((_, i) => coord(i, f).join(',')).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
        ))}
        {points.map((_, i) => {
          const [x, y] = coord(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-border" strokeWidth={1} />;
        })}
        <polygon points={polygon} fill={accent} fillOpacity={0.22} stroke={accent} strokeWidth={2} />
        {points.map((p, i) => {
          const [x, y] = coord(i, Math.max(0.04, p.value / 100));
          return <circle key={i} cx={x} cy={y} r={3} fill={accent} />;
        })}
        {points.map((p, i) => {
          const [x, y] = coord(i, 1.18);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>
              {p.label.length > 14 ? p.label.slice(0, 13) + '…' : p.label}
            </text>
          );
        })}
      </svg>
      <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
        Position vs estimated {SPORT_META[sport].name.toLowerCase()} reference bands. Reference ranges are illustrative, not official standards.
      </p>
    </div>
  );
}
