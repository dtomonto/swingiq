'use client';

// ============================================================
// securityOS — security audit log viewer (CLIENT)
// ------------------------------------------------------------
// Reads the local-first security audit log from useSecurityOS and provides
// filters (search, action, severity, date range), export and clear. Entries
// are already redacted at write time.
// ============================================================

import { useMemo, useState } from 'react';
import { Download, Search, Trash2, ShieldCheck } from 'lucide-react';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import type { SecurityAuditSeverity } from '@/lib/security-os/types';

const SEV_TONE: Record<SecurityAuditSeverity, string> = {
  info: 'bg-gray-800 text-gray-300',
  warning: 'bg-amber-500/15 text-amber-300',
  critical: 'bg-red-500/15 text-red-300',
};

export function AuditLogsClient() {
  const sec = useSecurityOS();
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState<SecurityAuditSeverity | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sec.auditLog.filter((e) => {
      if (severity !== 'all' && e.severity !== severity) return false;
      const day = e.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (needle && !`${e.action} ${e.entityType} ${e.summary} ${e.actor}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [sec.auditLog, q, severity, from, to]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securityos-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!sec.ready) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-40 rounded-lg border border-gray-700 bg-gray-950 py-1.5 pl-7 pr-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none" />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as SecurityAuditSeverity | 'all')} className="rounded-lg border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-200 focus:outline-none">
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-300 focus:outline-none" />
        <span className="text-xs text-gray-600">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-300 focus:outline-none" />
        <div className="ml-auto flex gap-2">
          <button onClick={exportJson} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800"><Download className="h-3.5 w-3.5" /> Export</button>
          <button onClick={() => sec.clearAudit()} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <p className="text-sm text-gray-400">No audit entries yet.</p>
          <p className="mt-1 text-xs text-gray-600">Triage a finding or change a setting and the action is recorded here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEV_TONE[e.severity]}`}>{e.severity}</span>
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">{e.action}</code>
                  <span className="text-xs text-gray-500">{e.entityType}</span>
                </div>
                <p className="mt-1 text-sm text-gray-200">{e.summary}</p>
                <p className="mt-0.5 text-[11px] text-gray-600">{e.actor} · {new Date(e.at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
