'use client';

// Admin actions for a single user: export their data (client-side
// download of the loaded detail) and suspend/restore (secured API
// route). Every mutation is recorded to the local-first audit log
// after a successful response.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Ban, RotateCcw, Sparkles, PowerOff } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { recordAudit } from '@/lib/admin/stores/audit-log';

export interface AdminUserActionsProps {
  userId: string;
  email: string | null;
  suspended: boolean;
  /** Whether AI features are currently turned OFF for this account. */
  aiBlocked: boolean;
  /** Serializable snapshot used for the export download. */
  exportData: unknown;
}

export function AdminUserActions({ userId, email, suspended, aiBlocked, exportData }: AdminUserActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = email ?? userId;

  async function runAiToggle() {
    setAiBusy(true);
    setError(null);
    const action = aiBlocked ? 'ai_enable' : 'ai_disable';
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
        summary: `${action === 'ai_disable' ? 'Turned AI off for' : 'Turned AI on for'} ${label}`,
        severity: action === 'ai_disable' ? 'warning' : 'info',
      });
      setAiConfirmOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setAiBusy(false);
    }
  }

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
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
      >
        <Download className="h-3.5 w-3.5" /> Export data
      </button>

      <button
        onClick={() => setAiConfirmOpen(true)}
        disabled={aiBusy}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
          aiBlocked
            ? 'bg-success/80 text-white hover:bg-success'
            : 'border border-warning/40 text-warning-text hover:bg-warning/10'
        }`}
      >
        {aiBlocked ? <Sparkles className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
        {aiBlocked ? 'Turn AI on' : 'Turn AI off'}
      </button>

      <button
        onClick={() => setConfirmOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
          suspended
            ? 'bg-success/80 text-white hover:bg-success'
            : 'border border-error/40 text-error-text hover:bg-error/10'
        }`}
      >
        {suspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {suspended ? 'Restore account' : 'Suspend account'}
      </button>

      {error && <span className="text-xs text-error-text">{error}</span>}

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

      <ConfirmDialog
        open={aiConfirmOpen}
        danger={!aiBlocked}
        title={aiBlocked ? 'Turn AI back on for this account?' : 'Turn AI off for this account?'}
        description={
          aiBlocked
            ? `${label} will be able to use AI swing analysis, AI coaching and photo import again immediately.`
            : `${label} will no longer be able to use AI features (swing vision, AI coaching, photo import). The deterministic, non-AI parts of the app keep working. This is reversible.`
        }
        confirmLabel={aiBusy ? 'Working…' : aiBlocked ? 'Turn AI on' : 'Turn AI off'}
        onConfirm={runAiToggle}
        onCancel={() => setAiConfirmOpen(false)}
      />
    </div>
  );
}
