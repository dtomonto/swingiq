'use client';

// Audit log viewer over the local-first audit store: search + severity
// filter, with an export and a guarded clear.

import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useAuditLog } from '@/lib/admin/stores/audit-log';
import { formatRelativeTime, formatDate } from '@/lib/admin/format';
import type { AuditSeverity } from '@/lib/admin/audit';

const SEV_TONE: Record<AuditSeverity, BadgeTone> = { info: 'info', warning: 'warning', critical: 'danger' };

export function AuditLogClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entries = useAuditLog((s) => s.entries);
  const clear = useAuditLog((s) => s.clear);

  const [query, setQuery] = useState('');
  const [sev, setSev] = useState<'all' | AuditSeverity>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (sev !== 'all' && e.severity !== sev) return false;
      if (!q) return true;
      return `${e.summary} ${e.actor} ${e.action} ${e.entityType} ${e.entityId ?? ''}`.toLowerCase().includes(q);
    });
  }, [entries, query, sev]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swingvantage-admin-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!mounted) return <p className="text-sm text-gray-500">Loading audit log…</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actions, actor, entity…"
          className="min-w-[12rem] flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500"
        />
        <select
          value={sev}
          onChange={(e) => setSev(e.target.value as typeof sev)}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200"
        >
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={exportJson} disabled={entries.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-2 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button onClick={() => setConfirmClear(true)} disabled={entries.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-2.5 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40">
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center text-sm text-gray-500">
          {entries.length === 0
            ? 'No admin actions recorded yet on this device. Toggling a flag, suspending a user, or reviewing a fix will appear here.'
            : 'No entries match your filter.'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-start gap-3 p-3">
              <StatusBadge tone={SEV_TONE[e.severity]}>{e.severity}</StatusBadge>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200">{e.summary}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  <span className="font-mono">{e.action}</span> · {e.entityType}
                  {e.entityId ? ` · ${e.entityId}` : ''} · {e.actor}
                </p>
              </div>
              <time className="shrink-0 text-[11px] text-gray-600" title={formatDate(e.at)}>
                {formatRelativeTime(e.at)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        danger
        title="Clear the audit log?"
        description="This removes all locally-recorded admin activity on this device. This cannot be undone."
        confirmLabel="Clear log"
        requirePhrase="CLEAR"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { clear(); setConfirmClear(false); }}
      />
    </div>
  );
}
