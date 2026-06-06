'use client';

// ============================================================
// Recruiting — DataMetricCard
// ------------------------------------------------------------
// One metric with its current value, benchmark position, source label,
// coach-validation toggle, visibility, a tiny trend sparkline, and the
// ability to log a new sample. Verified vs self-reported is always
// visible so nothing reads as more proven than it is.
// ============================================================

import { useState } from 'react';
import type { SportId } from '@swingiq/core';
import { ShieldCheck, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  useRecruitingStore,
  benchmarkPosition,
  getMetricDef,
  type PlayerMetric,
  type Visibility,
  VERIFIED_SOURCES,
} from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';
import { DataSourceLabel } from './DataSourceLabel';

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 64;
  const h = 20;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * h}`).join(' ');
  return <svg width={w} height={h} aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} /></svg>;
}

export function DataMetricCard({ metric, sport }: { metric: PlayerMetric; sport: SportId }) {
  const def = getMetricDef(metric.metricKey);
  const pos = metric.currentValue != null ? benchmarkPosition(metric.metricKey, sport, metric.currentValue) : null;
  const verified = VERIFIED_SOURCES.has(metric.source as never) || metric.coachValidated;
  const accent = SPORT_META[sport].accentColor;

  const setVisibility = useRecruitingStore((s) => s.setMetricVisibility);
  const coachValidate = useRecruitingStore((s) => s.coachValidateMetric);
  const addSample = useRecruitingStore((s) => s.addMetricSample);
  const removeMetric = useRecruitingStore((s) => s.removeMetric);

  const [newVal, setNewVal] = useState('');
  const first = metric.history[0]?.value;
  const last = metric.currentValue;
  const trendUp = def?.higherIsBetter ? (last ?? 0) > (first ?? 0) : (last ?? 0) < (first ?? 0);
  const hasTrend = metric.history.length >= 2 && first !== last;

  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">{def?.label ?? metric.metricKey}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {metric.currentValue}{metric.unit ? <span className="text-base font-medium text-muted-foreground"> {metric.unit}</span> : null}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {hasTrend && (
              <span className={cn('flex items-center gap-1 text-xs', trendUp ? 'text-success' : 'text-error')}>
                {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {metric.history.length} pts
              </span>
            )}
            <Sparkline values={metric.history.map((h) => h.value)} color={accent} />
          </div>
        </div>

        {pos && (
          <div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pos.normalized}%`, background: accent }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Near {pos.nearestLabel} (estimated reference)</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <DataSourceLabel source={metric.source} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="any"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              placeholder="New"
              className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
            />
            <button
              onClick={() => { if (newVal.trim()) { addSample(metric.id, { value: Number(newVal), date: new Date().toISOString(), source: metric.source }); setNewVal(''); } }}
              className="p-1 rounded-md text-primary hover:bg-muted"
              aria-label="Log new sample"
            >
              <Plus size={15} />
            </button>
          </div>
          <select
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
            value={metric.visibility}
            onChange={(e) => setVisibility(metric.id, e.target.value as Visibility)}
          >
            <option value="private">Private</option><option value="link_only">On links</option><option value="public">Public</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs text-foreground/80">
            <input type="checkbox" checked={metric.coachValidated} onChange={(e) => coachValidate(metric.id, e.target.checked)} />
            <ShieldCheck size={13} className={verified ? 'text-success' : 'text-muted-foreground'} /> Coach validated
          </label>
          <button onClick={() => removeMetric(metric.id)} className="text-error/80 hover:text-error p-1 rounded-md hover:bg-error/10" aria-label="Remove metric"><Trash2 size={14} /></button>
        </div>
      </CardBody>
    </Card>
  );
}
