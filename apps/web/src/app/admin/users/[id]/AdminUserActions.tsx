'use client';

// Admin actions for a single user: export their data (client-side
// download of the loaded detail) and suspend/restore (secured API
// route). Every mutation is recorded to the local-first audit log
// after a successful response.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Ban, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { recordAudit } from '@/lib/admin/stores/audit-log';

export interface AdminUserActionsProps {
  userId: string;
  email: string | null;
  suspended: boolean;
  /** Serializable snapshot used for the export download. */
  exportData: unknown;
}

export function AdminUserActions({ userId, email, suspended, exportData }: AdminUserActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = email ?? userId;

  function exportJson() {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swingvantage-user-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit({
      actor: 'admin', action: 'user.export', entityType: 'user', entityId: userId,
      summary: `Exported data for ${label}`,
    });
  }

  async function runToggle() {
    setBusy(true);
    setError(null);
    const action = suspended ? 'restore' : 'suspend';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');
      recordAudit({
        actor: json.actor ?? 'admin',
        action: `user.${action}`,
        entityType: 'user',
        entityId: userId,
        summary: `${action === 'suspend' ? 'Suspended' : 'Restored'} ${label}`,
        severity: action === 'suspend' ? 'warning' : 'info',
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={exportJson}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
      >
        <Download className="h-3.5 w-3.5" /> Export data
      </button>

      <button
        onClick={() => setConfirmOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
          suspended
            ? 'bg-emerald-600/80 text-white hover:bg-emerald-500'
            : 'border border-red-500/40 text-red-300 hover:bg-red-500/10'
        }`}
      >
        {suspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {suspended ? 'Restore account' : 'Suspend account'}
      </button>

      {error && <span className="text-xs text-red-400">{error}</span>}

      <ConfirmDialog
        open={confirmOpen}
        danger={!suspended}
        title={suspended ? 'Restore this account?' : 'Suspend this account?'}
        description={
          suspended
            ? `${label} will be able to sign in again immediately.`
            : `${label} will be unable to sign in until restored. Their data is kept. This is reversible.`
        }
        confirmLabel={busy ? 'Working…' : suspended ? 'Restore' : 'Suspend'}
        onConfirm={runToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
