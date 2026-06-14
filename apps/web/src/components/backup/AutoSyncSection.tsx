'use client';

// ============================================================
// SwingVantage — Auto-Sync settings card (Data Center)
//
// Two device-sync controls:
//   1. Keep a backup file on this device up to date automatically.
//   2. Automatically continue progress from a backup in a chosen
//      folder (e.g. Downloads) on return visits.
//
// Honest about the browser sandbox: you grant a file/folder ONCE; we
// never reach into your disk on our own, and unsupported browsers keep
// the manual backup/restore flow.
// ============================================================

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAutoSync } from '@/lib/backup/autosync/auto-sync-provider';
import { AUTOSAVE_INTERVALS } from '@/lib/backup/autosync/config';
import {
  HardDriveDownload, FolderSync, CheckCircle, AlertTriangle, RefreshCw,
  Lock, Info, FileCheck, Clock,
} from 'lucide-react';

function relativeTime(iso: string | null): string {
  if (!iso) return 'Not yet';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'Not yet';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString();
}

export function AutoSyncSection() {
  const sync = useAutoSync();

  if (!sync.supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync size={18} className="text-primary" aria-hidden="true" />
            Automatic backups
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3 bg-muted rounded-xl p-4 text-sm text-muted-foreground">
            <Info size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-foreground font-medium">
                Automatic saving isn’t available in this browser.
              </p>
              <p>
                Saving a file to your device on a schedule needs Chrome, Edge, Brave, or another
                Chromium browser on a computer. You can still protect your progress anytime using
                <strong className="text-foreground"> Download Backup</strong> and
                <strong className="text-foreground"> Import Backup</strong> above — nothing is lost.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { autoSave, autoRestore } = sync;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync size={18} className="text-primary" aria-hidden="true" />
          Automatic backups
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-6">

        {/* ── 1. Auto-save to device ─────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <HardDriveDownload size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Keep a backup saved to this device</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick a file once. SwingVantage keeps it up to date automatically, so your progress is
                  always protected even if you clear your browser.
                </p>
              </div>
            </div>
            {autoSave.enabled ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0" onClick={() => void sync.disableAutoSave()}>
                Turn off
              </Button>
            ) : (
              <Button size="sm" className="shrink-0" onClick={() => void sync.enableAutoSave()}>
                Turn on
              </Button>
            )}
          </div>

          {autoSave.enabled && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <FileCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
                <span className="truncate">{autoSave.fileLabel ?? 'Backup file'}</span>
              </div>

              {autoSave.needsPermission ? (
                <div className="flex flex-col gap-2 bg-warning/10 border border-warning/30 rounded-lg p-2.5 text-xs text-warning">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} aria-hidden="true" /> Your browser needs you to re-allow access to this file.
                  </span>
                  <Button size="sm" variant="outline" className="self-start" onClick={() => void sync.resumeAutoSave()}>
                    Resume auto-save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} aria-hidden="true" />
                    Last saved: <strong className="text-foreground">{relativeTime(autoSave.lastSavedAt)}</strong>
                  </span>
                  <SaveStatusPill status={autoSave.status} />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  Save every
                  <select
                    value={autoSave.intervalMinutes}
                    onChange={(e) => void sync.setAutoSaveInterval(Number(e.target.value))}
                    className="border border-border rounded-md bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                    aria-label="Auto-save frequency"
                  >
                    {AUTOSAVE_INTERVALS.map((m) => (
                      <option key={m} value={m}>{m < 60 ? `${m} minutes` : '1 hour'}</option>
                    ))}
                  </select>
                </label>
                <Button size="sm" variant="outline" onClick={() => void sync.saveNow()} disabled={autoSave.status === 'saving'}>
                  {autoSave.status === 'saving'
                    ? <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                    : <HardDriveDownload size={14} aria-hidden="true" />}
                  Save now
                </Button>
              </div>
              <p className="text-2xs text-muted-foreground">
                Auto-saved files are unencrypted so they can be restored automatically. For a
                password-protected copy, use <strong className="text-foreground">Download Backup</strong> above.
              </p>
            </div>
          )}
        </section>

        <div className="border-t border-border" />

        {/* ── 2. Auto-continue from a folder ─────────────────── */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FolderSync size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Continue progress automatically</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a folder once (your Downloads works well). When you come back, SwingVantage checks it
                  for your most recent backup and picks up where you left off.
                </p>
              </div>
            </div>
            {autoRestore.enabled ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0" onClick={() => void sync.disableAutoRestore()}>
                Turn off
              </Button>
            ) : (
              <Button size="sm" className="shrink-0" onClick={() => void sync.enableAutoRestore()}>
                Choose folder
              </Button>
            )}
          </div>

          {autoRestore.enabled && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <FolderSync size={15} className="text-primary shrink-0" aria-hidden="true" />
                <span className="truncate">{autoRestore.dirLabel ?? 'Selected folder'}</span>
              </div>

              {autoRestore.needsPermission ? (
                <div className="flex flex-col gap-2 bg-warning/10 border border-warning/30 rounded-lg p-2.5 text-xs text-warning">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} aria-hidden="true" /> Your browser needs you to re-allow access to this folder.
                  </span>
                  <Button size="sm" variant="outline" className="self-start" onClick={() => void sync.resumeAutoRestore()}>
                    Resume
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} aria-hidden="true" />
                    Last checked: <strong className="text-foreground">{relativeTime(autoRestore.lastScanAt)}</strong>
                  </span>
                  <RestoreStatusPill status={autoRestore.status} />
                </div>
              )}

              {autoRestore.encryptedSkipped > 0 && (
                <p className="text-2xs text-muted-foreground flex items-start gap-1.5">
                  <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Skipped {autoRestore.encryptedSkipped} password-protected backup
                  {autoRestore.encryptedSkipped !== 1 ? 's' : ''} — open one from Import Backup above to restore it with your password.
                </p>
              )}

              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => void sync.resumeAutoRestore()} disabled={autoRestore.status === 'scanning'}>
                  {autoRestore.status === 'scanning'
                    ? <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                    : <RefreshCw size={14} aria-hidden="true" />}
                  Check now
                </Button>
              </div>
              <p className="text-2xs text-muted-foreground">
                SwingVantage only reads the folder you choose, only to find your backups. If you already have
                data on this device, it asks before changing anything — it never overwrites without your okay.
              </p>
            </div>
          )}
        </section>
      </CardBody>
    </Card>
  );
}

function SaveStatusPill({ status }: { status: ReturnType<typeof useAutoSync>['autoSave']['status'] }) {
  if (status === 'saving') return <Pill tone="muted"><RefreshCw size={11} className="animate-spin" aria-hidden="true" /> Saving…</Pill>;
  if (status === 'saved') return <Pill tone="ok"><CheckCircle size={11} aria-hidden="true" /> Saved</Pill>;
  if (status === 'error') return <Pill tone="error"><AlertTriangle size={11} aria-hidden="true" /> Couldn’t save</Pill>;
  return <Pill tone="ok"><CheckCircle size={11} aria-hidden="true" /> On</Pill>;
}

function RestoreStatusPill({ status }: { status: ReturnType<typeof useAutoSync>['autoRestore']['status'] }) {
  if (status === 'scanning') return <Pill tone="muted"><RefreshCw size={11} className="animate-spin" aria-hidden="true" /> Checking…</Pill>;
  if (status === 'applied') return <Pill tone="ok"><CheckCircle size={11} aria-hidden="true" /> Up to date</Pill>;
  if (status === 'found') return <Pill tone="muted"><Info size={11} aria-hidden="true" /> Backup found</Pill>;
  if (status === 'error') return <Pill tone="error"><AlertTriangle size={11} aria-hidden="true" /> Couldn’t check</Pill>;
  return <Pill tone="ok"><CheckCircle size={11} aria-hidden="true" /> On</Pill>;
}

function Pill({ tone, children }: { tone: 'ok' | 'muted' | 'error'; children: React.ReactNode }) {
  const cls =
    tone === 'ok' ? 'bg-primary/10 text-primary'
    : tone === 'error' ? 'bg-error/10 text-error'
    : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
