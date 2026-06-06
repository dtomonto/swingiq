'use client';

// ============================================================
// Recruiting — DataDashboard
// ------------------------------------------------------------
// Add sport-specific metrics (with source), see the strength radar,
// and review every metric grouped, with verified vs self-reported
// always separated.
// ============================================================

import { useMemo, useState } from 'react';
import type { SportId } from '@swingiq/core';
import { Plus, BarChart3, ShieldCheck, CircleHelp } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useRecruitingStore,
  metricsForSport,
  getMetricDef,
  type DataSource,
  VERIFIED_SOURCES,
} from '@/lib/recruiting';
import { SportBenchmarkChart } from './SportBenchmarkChart';
import { DataMetricCard } from './DataMetricCard';

const SOURCES: { v: DataSource; label: string }[] = [
  { v: 'self_reported', label: 'Self-reported' }, { v: 'device_imported', label: 'Imported from device' },
  { v: 'coach_verified', label: 'Verified by coach' }, { v: 'event_verified', label: 'Event verified' },
  { v: 'manual_entry', label: 'Manually entered' },
];

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function DataDashboard({ sport }: { sport: SportId }) {
  const metrics = useRecruitingStore((s) => s.metrics);
  const addMetric = useRecruitingStore((s) => s.addMetric);

  const catalog = useMemo(() => metricsForSport(sport), [sport]);
  const sportMetrics = useMemo(() => metrics.filter((m) => m.sport === sport), [metrics, sport]);

  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(catalog[0]?.key ?? '');
  const [value, setValue] = useState('');
  const [source, setSource] = useState<DataSource>('self_reported');

  const verified = sportMetrics.filter((m) => VERIFIED_SOURCES.has(m.source as never) || m.coachValidated);
  const selfReported = sportMetrics.filter((m) => !(VERIFIED_SOURCES.has(m.source as never) || m.coachValidated));

  function submit() {
    const def = getMetricDef(key);
    if (!def || value.trim() === '') return;
    addMetric({ metricKey: key, sport, value: Number(value), unit: def.unit, source });
    setValue('');
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Strength radar</CardTitle>
          <Button size="sm" onClick={() => setOpen((o) => !o)}><Plus size={15} /> Add metric</Button>
        </CardHeader>
        <CardBody>
          <SportBenchmarkChart metrics={sportMetrics} sport={sport} />
        </CardBody>
      </Card>

      {open && (
        <Card>
          <CardHeader><CardTitle>Add a metric</CardTitle></CardHeader>
          <CardBody className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1"><span className="text-sm font-medium text-foreground">Metric</span>
              <select className={inputCls} value={key} onChange={(e) => setKey(e.target.value)}>
                {catalog.map((m) => <option key={m.key} value={m.key}>{m.label}{m.unit ? ` (${m.unit})` : ''}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-medium text-foreground">Value</span>
              <input type="number" step="any" className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder={getMetricDef(key)?.unit || '0'} />
            </label>
            <label className="block"><span className="text-sm font-medium text-foreground">Source</span>
              <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value as DataSource)}>
                {SOURCES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </label>
            {getMetricDef(key)?.hint && <p className="sm:col-span-3 text-xs text-muted-foreground -mt-1">{getMetricDef(key)?.hint}</p>}
            <div className="sm:col-span-3 flex gap-2">
              <Button onClick={submit} disabled={value.trim() === ''}>Add metric</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {sportMetrics.length === 0 ? (
        <Card><CardBody><EmptyState icon={BarChart3} title="No data yet" description="Add a few sport-specific metrics. Imported or coach-verified numbers carry the most weight with coaches." /></CardBody></Card>
      ) : (
        <div className="space-y-5">
          {verified.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><ShieldCheck size={16} className="text-success" /> Verified data ({verified.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{verified.map((m) => <DataMetricCard key={m.id} metric={m} sport={sport} />)}</div>
            </section>
          )}
          {selfReported.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><CircleHelp size={16} className="text-muted-foreground" /> Self-reported ({selfReported.length})</h3>
              <p className="text-xs text-muted-foreground mb-2">Coaches discount unverified numbers. Import device data or get a coach to validate to move these up.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selfReported.map((m) => <DataMetricCard key={m.id} metric={m} sport={sport} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
