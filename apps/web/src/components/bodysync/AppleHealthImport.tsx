'use client';

import { useState } from 'react';
import { Upload, Check, Loader2, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { parseAppleHealthExport, importDailySummaries, useBodySync } from '@/lib/bodysync';
import type { AppleHealthImportResult } from '@/lib/bodysync';

const METRIC_LABEL: Record<string, string> = {
  sleep_duration: 'Sleep', resting_hr: 'Resting HR', hrv: 'HRV', vo2max: 'VO₂max',
  spo2: 'Blood oxygen', respiratory_rate: 'Respiratory rate', steps: 'Steps',
  active_calories: 'Active calories', exercise_minutes: 'Exercise minutes',
};

export function AppleHealthImport() {
  const { state } = useBodySync();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AppleHealthImportResult | null>(null);
  const [done, setDone] = useState(false);

  const conn = state.connections.find((c) => c.provider === 'apple_health');

  const onFile = (file: File) => {
    setError(null); setResult(null); setDone(false); setBusy(true);
    const reader = new FileReader();
    reader.onerror = () => { setBusy(false); setError('Could not read that file.'); };
    reader.onload = () => {
      // Defer parsing a tick so the "Reading…" state paints for large files.
      setTimeout(() => {
        try {
          const text = String(reader.result ?? '');
          if (!text.includes('<Record') && !text.includes('HealthData')) {
            setError('That doesn’t look like an Apple Health export.xml. Unzip your export and pick export.xml.');
            setBusy(false);
            return;
          }
          const res = parseAppleHealthExport(text);
          setResult(res);
          if (res.summaries.length === 0) setError('No recognizable health metrics found in that export.');
        } catch {
          setError('Could not parse that export file.');
        } finally {
          setBusy(false);
        }
      }, 30);
    };
    reader.readAsText(file);
  };

  const apply = () => {
    if (!result) return;
    importDailySummaries(result.summaries, 'apple_health', 'file_import');
    setDone(true);
    setResult(null);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🍎</span>
        <h3 className="text-sm font-bold text-foreground">Import from Apple Health</h3>
        {conn?.status === 'connected' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            <Check size={11} aria-hidden="true" /> Connected
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
        Apple Health has no web connection, so we use your own export. On your iPhone:
        <span className="text-foreground"> Health app → your photo → Export All Health Data</span>,
        unzip it, then upload <span className="font-mono text-foreground">export.xml</span> here.
        We keep only <span className="text-foreground">daily summaries</span> (sleep, resting HR, HRV,
        steps…) — never the raw file — and they sync to your account.
      </p>

      {conn?.lastSyncAt && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Last import {new Date(conn.lastSyncAt).toLocaleString()} · {state.summaries.length} summaries stored.
        </p>
      )}

      <div className="mt-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <Upload size={15} aria-hidden="true" />
          {busy ? 'Reading…' : 'Choose export.xml'}
          <input
            type="file" accept=".xml,text/xml" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
        </label>
      </div>

      {busy && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" /> Parsing your export — large files can take a moment.
        </p>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
          <FileWarning size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      {result && result.summaries.length > 0 && (
        <div className="mt-3 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium text-foreground">
            Found {result.summaries.length} daily summaries across {result.stats.days} days
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(result.stats.byMetric).map(([k, n]) => (
              <span key={k} className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                {METRIC_LABEL[k] ?? k}: {n}
              </span>
            ))}
          </div>
          <Button size="sm" className="mt-3" onClick={apply}>
            <Check size={14} /> Import &amp; update my readiness
          </Button>
        </div>
      )}

      {done && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
          <Check size={13} aria-hidden="true" /> Imported — your readiness now uses objective sleep, HRV &amp; resting-HR data.
        </p>
      )}
    </div>
  );
}
