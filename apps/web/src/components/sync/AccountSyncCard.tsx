'use client';

// ============================================================
// SwingVantage — Account & cloud-sync status card
//
// Honest, at-a-glance answer to "is my progress safe?". Shows whether the
// user is signed in and whether their data is synced to their account,
// saved offline pending sync, or device-only. Used on the Settings page.
// ============================================================

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useCloudSync } from '@/lib/db';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, LogOut, UserPlus, HardDrive } from 'lucide-react';

export function AccountSyncCard() {
  const { user, status, mode, signOut } = useAuth();
  const { status: sync, lastSyncedAt } = useCloudSync();

  const signedIn = status === 'authenticated' && !!user;

  // ── Not signed in (or accounts disabled on this build) ──
  if (!signedIn) {
    const accountsOn = mode === 'cloud';
    return (
      <Card>
        <CardHeader><CardTitle>Account &amp; Sync</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-warning/10 p-2 text-warning">
              <HardDrive size={18} aria-hidden="true" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Your progress is saved on this device</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                {accountsOn
                  ? 'Create a free account to back it up to the cloud and pick up where you left off on any device.'
                  : 'Cloud accounts aren’t enabled on this build, so data stays on this device. Use Backup & Restore to keep a copy.'}
              </p>
            </div>
          </div>
          {accountsOn && (
            <div className="flex flex-wrap gap-2">
              <Link href="/signup">
                <Button size="sm"><UserPlus size={15} /> Create free account</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" variant="outline">Sign in</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  // ── Signed in: show live sync state ──
  const state = (() => {
    switch (sync) {
      case 'synced':
        return {
          icon: <CheckCircle2 size={18} />, tone: 'text-success', bg: 'bg-success/10',
          title: 'Saved to your account',
          detail: 'Your progress is synced to the cloud and available on every device you sign in on.',
        };
      case 'syncing':
        return {
          icon: <RefreshCw size={18} className="animate-spin" />, tone: 'text-primary', bg: 'bg-primary/10',
          title: 'Saving to your account…',
          detail: 'Syncing your latest changes to the cloud.',
        };
      case 'offline':
        return {
          icon: <CloudOff size={18} />, tone: 'text-warning', bg: 'bg-warning/10',
          title: 'Saved on this device',
          detail: 'You appear to be offline. Your changes are safe here and will sync automatically when you reconnect.',
        };
      case 'unavailable':
        return {
          icon: <CloudOff size={18} />, tone: 'text-warning', bg: 'bg-warning/10',
          title: 'Cloud sync not available yet',
          detail: 'Your data is safe on this device. Cloud sync turns on once the database setup is complete.',
        };
      default:
        return {
          icon: <Cloud size={18} />, tone: 'text-muted-foreground', bg: 'bg-muted',
          title: 'Connecting…', detail: 'Checking your cloud account.',
        };
    }
  })();

  return (
    <Card>
      <CardHeader><CardTitle>Account &amp; Sync</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-2 ${state.bg} ${state.tone}`}>{state.icon}</div>
          <div className="text-sm flex-1 min-w-0">
            <p className="font-medium text-foreground">{state.title}</p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">{state.detail}</p>
            {sync === 'synced' && lastSyncedAt && (
              <p className="text-2xs text-muted-foreground mt-1">
                Last synced {new Date(lastSyncedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <div className="text-sm min-w-0">
            <p className="text-muted-foreground">Signed in as</p>
            <p className="font-medium text-foreground truncate">{user.email}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void signOut()}>
            <LogOut size={15} /> Sign out
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
