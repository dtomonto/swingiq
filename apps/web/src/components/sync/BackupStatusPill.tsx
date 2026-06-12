'use client';

// ============================================================
// SwingVantage — Backup status pill (compact, dashboard-visible)
// ------------------------------------------------------------
// A small, ALWAYS-VISIBLE answer to "is my swing history backed up?". It mirrors
// the same auth + cloud-sync state as AccountSyncCard (which lives in Settings),
// but compact enough to sit in the dashboard header — so a user accumulating
// sessions always knows whether their history is durable, and gets a one-tap path
// to back it up when it isn't.
//
// HONEST: it never claims "backed up" unless the account is actually synced.
// Guest data is device-only (the real durability risk for accumulated history),
// so that state is shown as a clear, tappable prompt — not a reassurance.
// ============================================================

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useCloudSync } from '@/lib/db';
import { CheckCircle2, CloudOff, RefreshCw, HardDrive, Cloud } from 'lucide-react';

const BASE = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors';
const TONE = {
  green: `${BASE} bg-success/10 text-success-text`,
  amber: `${BASE} bg-warning/10 text-warning-text hover:bg-warning/15`,
  blue: `${BASE} bg-primary/10 text-link`,
  neutral: `${BASE} bg-muted text-muted-foreground hover:bg-muted/80`,
} as const;

export function BackupStatusPill({ className = '' }: { className?: string }) {
  const { user, status, mode } = useAuth();
  const { status: sync, lastSyncedAt } = useCloudSync();
  const cls = (tone: keyof typeof TONE) => `${TONE[tone]} ${className}`.trim();

  // ── Not signed in → device-only (back up before it's lost) ──
  if (!(status === 'authenticated' && user)) {
    if (mode === 'cloud') {
      return (
        <Link href="/signup" className={cls('amber')} title="Your swing history is only on this device. Create a free account to back it up across devices.">
          <HardDrive size={13} aria-hidden="true" /> On this device · Sign in to back up
        </Link>
      );
    }
    return (
      <Link href="/settings/backup" className={cls('amber')} title="Cloud accounts are off on this build — keep a backup copy of your history.">
        <HardDrive size={13} aria-hidden="true" /> On this device · Back up
      </Link>
    );
  }

  // ── Signed in → live sync state ──
  switch (sync) {
    case 'synced':
      return (
        <span className={cls('green')} title={lastSyncedAt ? `Backed up · last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Backed up to your account'}>
          <CheckCircle2 size={13} aria-hidden="true" /> Backed up
        </span>
      );
    case 'syncing':
      return (
        <span className={cls('blue')} title="Saving your latest changes to your account.">
          <RefreshCw size={13} className="animate-spin" aria-hidden="true" /> Saving…
        </span>
      );
    case 'offline':
      return (
        <span className={cls('amber')} title="Couldn't save your latest changes — they're safe on this device and will sync automatically when you reconnect.">
          <CloudOff size={13} aria-hidden="true" /> Not saved · retrying
        </span>
      );
    case 'unavailable':
      return (
        <Link href="/settings/backup" className={cls('neutral')} title="Cloud sync isn't on yet — keep a backup copy of your history.">
          <CloudOff size={13} aria-hidden="true" /> Cloud off · Back up
        </Link>
      );
    default:
      return (
        <span className={cls('neutral')}>
          <Cloud size={13} aria-hidden="true" /> Connecting…
        </span>
      );
  }
}
