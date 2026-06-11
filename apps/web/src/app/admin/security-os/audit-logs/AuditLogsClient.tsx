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
  info: 'bg-muted text-foreground',
  warning: 'bg-primary/15 text-link',
  critical: 'bg-error/15 text-error-text',
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

  if (!sec.ready) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-40 rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none" />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as SecurityAuditSeverity | 'all')} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none" />
        <span className="text-xs text-muted-foreground/70">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none" />
        <div className="ml-auto flex gap-2">
          <button onClick={exportJson} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"><Download className="h-3.5 w-3.5" /> Export</button>
          <button onClick={() => sec.clearAudit()} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground/70" />
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Triage a finding or change a setting and the action is recorded here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEV_TONE[e.severity]}`}>{e.severity}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{e.action}</code>
                  <span className="text-xs text-muted-foreground">{e.entityType}</span>
                </div>
                <p className="mt-1 text-sm text-foreground">{e.summary}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{e.actor} · {new Date(e.at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
