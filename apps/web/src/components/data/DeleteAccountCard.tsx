'use client';

// ============================================================
// SwingVantage — Delete account & cloud data (GDPR/CCPA erasure)
// ------------------------------------------------------------
// Shows ONLY in cloud mode for a signed-in user. Keyless/local users have no
// server account — their complete erasure is the local "Clear Data" wipe in the
// Data Center, so this card renders nothing for them (no false promise).
//
// Flow: type DELETE to arm → POST /api/user/delete (deletes the auth user;
// every owned row cascades) → wipe this device → sign out → home. Irreversible,
// so it is deliberately gated behind an explicit typed confirmation.
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, RefreshCw, ShieldX } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/useAuth';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { wipeAllDeviceData } from '@/lib/storage/device-data';
import {
  canConfirmDeletion,
  requestAccountDeletion,
  DELETE_CONFIRM_PHRASE,
} from '@/lib/storage/delete-account';

export function DeleteAccountCard() {
  const { mode, status, signOut } = useAuth();
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only signed-in cloud users have a server-side account to delete.
  if (mode !== 'cloud' || status !== 'authenticated') return null;

  const armed = canConfirmDeletion(typed) && !pending;

  async function handleDelete() {
    if (!canConfirmDeletion(typed)) return;
    setPending(true);
    setError(null);
    track(ANALYTICS_EVENTS.DATA_DELETE_REQUESTED, { scope: 'account+cloud' });

    const result = await requestAccountDeletion();
    if (!result.ok) {
      setError(
        result.message ??
          'Account deletion could not be completed. Please try again or email privacy@swingvantage.com.',
      );
      setPending(false);
      return;
    }

    // Account + cloud rows are gone. Erase this device, drop the session, leave.
    try {
      wipeAllDeviceData();
    } catch {
      /* non-fatal — the authoritative server delete already succeeded */
    }
    try {
      await signOut();
    } catch {
      /* session may already be invalid post-delete */
    }
    router.replace('/');
    if (typeof window !== 'undefined') {
      // Hard reload to drop all in-memory state after the redirect.
      setTimeout(() => window.location.assign('/'), 50);
    }
  }

  return (
    <Card className="border-error/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-error">
          <ShieldX size={18} aria-hidden="true" />
          Delete account &amp; all cloud data
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex gap-3 bg-error/10 border border-error/30 rounded-xl p-4" role="alert">
          <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} aria-hidden="true" />
          <div className="text-sm text-error space-y-1">
            <p className="font-semibold">This is permanent and cannot be undone.</p>
            <p>
              Your account and <strong>everything tied to it</strong> — sessions, swings,
              videos, clubs, progress — are deleted from our database immediately (a single
              cascading delete). Routine encrypted backups roll off within 30 days. We keep
              no shadow copy.
            </p>
            <p className="text-xs">
              Want a copy first? Use <strong>Export</strong> above before deleting.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-foreground">
            Type <span className="font-mono font-bold">{DELETE_CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-error/40 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-error/40"
            placeholder={DELETE_CONFIRM_PHRASE}
            aria-describedby="delete-confirm-help"
          />
          <p id="delete-confirm-help" className="text-xs text-muted-foreground">
            The button stays disabled until the word matches.
          </p>
        </div>

        {error && (
          <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error" role="alert">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full text-error border-error/40 hover:bg-error/10 disabled:opacity-50"
          disabled={!armed}
          onClick={handleDelete}
        >
          {pending ? (
            <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={16} aria-hidden="true" />
          )}
          {pending ? 'Deleting your account…' : 'Permanently delete my account'}
        </Button>
      </CardBody>
    </Card>
  );
}
