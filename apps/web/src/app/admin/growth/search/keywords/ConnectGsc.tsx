'use client';

// ============================================================
// SearchIntelligenceOS — Connect Google Search Console (client)
// ------------------------------------------------------------
// Shows the connection status and a "Sync now" button that pulls real Search
// Analytics data (admin-secret retry pattern). On success the page refreshes so
// the keyword table + scores re-render with real rank/impression data. Honest
// when not connected: shows exactly which env vars to set.
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plug, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { formatCompact } from '@/lib/growth/format';
import type { GscStatus } from '@/lib/growth/search-intelligence/gsc';
import type { GscSummary } from '@/lib/growth/search-intelligence/types';

const SECRET_KEY = 'growthos.adminSecret';

export function ConnectGsc({ status, summary }: { status: GscStatus; summary: GscSummary | null }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [note, setNote] = useState<string | null>(null);

  async function sync(retrySecret?: string): Promise<void> {
    setState('syncing');
    setNote(null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = retrySecret ?? (typeof window !== 'undefined' ? window.sessionStorage.getItem(SECRET_KEY) : null);
    if (secret) headers['x-admin-secret'] = secret;
    try {
      const res = await fetch('/api/growth/search-intelligence/gsc/sync', { method: 'POST', headers });
      if (res.status === 401) {
        const entered = window.prompt('Enter ADMIN_SECRET to sync (required in production):');
        if (entered) { window.sessionStorage.setItem(SECRET_KEY, entered); return sync(entered); }
        setState('idle');
        return;
      }
      const json = await res.json().catch(() => ({}));
      setNote(json.note ?? null);
      setState('done');
      router.refresh();
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
      setNote('Sync failed — check the network and token.');
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${status.connected ? 'border-green-500/30 bg-green-500/5' : 'border-gray-800 bg-gray-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {status.connected
            ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            : <Plug className="w-5 h-5 text-gray-500 shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100">Google Search Console</p>
            <p className="text-xs text-gray-500 truncate">{status.note}</p>
          </div>
        </div>
        {status.connected ? (
          <button
            onClick={() => sync()}
            disabled={state === 'syncing'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold px-3.5 py-2"
          >
            {state === 'syncing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {state === 'syncing' ? 'Syncing…' : state === 'done' ? 'Synced' : 'Sync now'}
          </button>
        ) : (
          <span className="text-[11px] text-amber-400 font-mono">set {status.missing.join(' + ')}</span>
        )}
      </div>

      {summary ? (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Stat label="Queries" value={formatCompact(summary.rowCount)} />
          <Stat label="Impressions" value={formatCompact(summary.totalImpressions)} />
          <Stat label="Clicks" value={formatCompact(summary.totalClicks)} />
          <Stat label="Avg position" value={summary.avgPosition.toFixed(1)} />
        </div>
      ) : null}

      {note ? <p className="mt-2 text-[11px] text-gray-500">{note}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
      <p className="text-sm font-bold text-gray-100 tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
