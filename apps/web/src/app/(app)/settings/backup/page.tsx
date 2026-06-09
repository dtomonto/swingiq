'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore } from '@/store';
import { Download, Upload, CheckCircle, AlertTriangle, RefreshCw, Shield, Lock } from 'lucide-react';
import { exportUserData, downloadBackup } from '@/lib/backup/export';
import { parseBackupFile } from '@/lib/backup/validate';
import { previewRestore, mergeRestore, replaceRestore, generateRestoreResult } from '@/lib/backup/restore';
import { encryptBackup, decryptBackup, isEncryptedBackup } from '@/lib/backup/crypto';
import type { SwingVantageBackup, RestorePreview, RestoreResult } from '@/lib/backup/schema';

type ImportStep = 'idle' | 'parsing' | 'needs-password' | 'preview' | 'confirming-replace' | 'done';

export default function BackupPage() {
  const store = useSwingVantageStore();

  // Export state
  const [exported, setExported] = useState(false);
  const [exportEncrypt, setExportEncrypt] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Import state
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<SwingVantageBackup | null>(null);
  const [pendingEncryptedContent, setPendingEncryptedContent] = useState<string | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExportError(null);

    if (exportEncrypt) {
      if (exportPassword.length < 8) {
        setExportError('Password must be at least 8 characters.');
        return;
      }
      if (exportPassword !== exportPasswordConfirm) {
        setExportError('Passwords do not match.');
        return;
      }
    }

    setExportLoading(true);
    try {
      const backup = exportUserData(store);
      if (exportEncrypt) {
        const blob = await encryptBackup(backup, exportPassword);
        downloadBackup(backup, blob);
      } else {
        downloadBackup(backup);
      }
      store.recordExport();
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStep('parsing');
    setPendingEncryptedContent(null);
    setPendingBackup(null);

    let content: string;
    try {
      content = await file.text();
    } catch {
      setImportError('Could not read file.');
      setImportStep('idle');
      return;
    }

    if (isEncryptedBackup(content)) {
      setPendingEncryptedContent(content);
      setImportPassword('');
      setImportStep('needs-password');
      return;
    }

    const { backup, error, warnings: parseWarnings } = await parseBackupFile(file);
    if (error || !backup) {
      setImportError(error ?? 'Unknown parse error');
      setImportStep('idle');
      return;
    }

    const p = previewRestore(backup, store);
    if (parseWarnings.length > 0) {
      p.warnings = [...(p.warnings ?? []), ...parseWarnings];
    }
    setPendingBackup(backup);
    setPreview(p);
    setImportStep('preview');
  }

  async function handleDecrypt() {
    if (!pendingEncryptedContent) return;
    setImportError(null);

    try {
      const backup = await decryptBackup(pendingEncryptedContent, importPassword);
      const p = previewRestore(backup, store);
      setPendingBackup(backup);
      setPreview(p);
      setImportStep('preview');
    } catch {
      setImportError('Incorrect password. Please try again.');
    }
  }

  function handleMerge() {
    if (!pendingBackup || !preview) return;
    const delta = mergeRestore(pendingBackup, store);
    useSwingVantageStore.setState(delta);
    setRestoreResult(generateRestoreResult(preview, true));
    setImportStep('done');
  }

  function handleReplace() {
    if (!pendingBackup || !preview) return;
    const delta = replaceRestore(pendingBackup, store.settings);
    useSwingVantageStore.setState(delta);
    useSwingVantageStore.getState().computeSetupStep();
    setRestoreResult(generateRestoreResult(preview, true));
    setImportStep('done');
  }

  function reset() {
    setImportStep('idle');
    setImportError(null);
    setPendingBackup(null);
    setPendingEncryptedContent(null);
    setPreview(null);
    setRestoreResult(null);
    setImportPassword('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const { sessions, clubs, video_analyses, community, tutorialProgress } = store;

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup &amp; Restore</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Download a complete copy of your SwingVantage data, or restore from a previous backup.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="flex gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <Shield className="text-primary mt-0.5 shrink-0" size={20} />
          <div className="text-sm text-primary space-y-1">
            <p className="font-semibold">Your backup is a private file you control</p>
            <p>This backup contains your profiles, sessions, clubs, and analysis results.</p>
            <p>Video files are not included — only metadata and analysis results.</p>
            <p>No passwords, API keys, or payment credentials are stored in SwingVantage.</p>
            <p className="font-medium">Store the file somewhere safe.</p>
          </div>
        </div>

        {/* Export section */}
        <Card>
          <CardHeader><CardTitle>Download My Data Backup</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Creates a complete file with everything SwingVantage knows about you.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sessions</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">{clubs.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Clubs</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">{video_analyses.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Video Analyses</p>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">Your backup includes:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>✓ All sessions &amp; shot data ({sessions.length} sessions)</li>
                <li>✓ Club &amp; equipment profiles ({clubs.length} clubs)</li>
                <li>✓ Video analyses ({video_analyses.length})</li>
                <li>✓ Golf &amp; sport profiles</li>
                <li>✓ Training progress &amp; milestones</li>
                <li>✓ Community badges &amp; XP ({community.achievementsEarned.length} badges · {community.xpTotal} XP)</li>
                <li>✓ Challenge history ({community.challengesCompleted.length} completed)</li>
                <li>✓ Tutorial progress ({tutorialProgress.completed.length} guides completed)</li>
                <li>✓ App settings &amp; language preference</li>
              </ul>
              <p className="text-muted-foreground pt-1">Video files are not included — only analysis results and metadata.</p>
            </div>

            {/* Encryption toggle */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportEncrypt}
                  onChange={(e) => {
                    setExportEncrypt(e.target.checked);
                    setExportError(null);
                    setExportPassword('');
                    setExportPasswordConfirm('');
                  }}
                  className="w-4 h-4 rounded-sm text-primary"
                />
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Encrypt with password (recommended)</span>
                </div>
              </label>

              {exportEncrypt && (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2 bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Important:</strong> If you forget your backup password, your data cannot be recovered.
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="Password (min. 8 characters)"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={exportPasswordConfirm}
                    onChange={(e) => setExportPasswordConfirm(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            {exportError && (
              <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{exportError}</span>
              </div>
            )}

            <Button size="lg" onClick={handleExport} className="w-full" disabled={exportLoading}>
              {exportLoading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              {exportLoading ? 'Encrypting…' : 'Download Backup'}
            </Button>

            {exported && (
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <CheckCircle size={16} /> Backup downloaded successfully
              </div>
            )}
          </CardBody>
        </Card>

        {/* Import section */}
        <Card>
          <CardHeader><CardTitle>Restore from Backup</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {importStep === 'idle' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Select a SwingVantage backup file (.json or .swingiqbackup) to preview what will be restored.
                </p>
                {importError && (
                  <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.swingiqbackup"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} />
                    Select Backup File
                  </Button>
                </label>
              </>
            )}

            {importStep === 'parsing' && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground py-4 justify-center">
                <RefreshCw size={18} className="animate-spin text-primary" />
                Reading backup file…
              </div>
            )}

            {importStep === 'needs-password' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
                  <Lock className="text-accent-secondary shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-foreground">
                    <p className="font-semibold">This backup is encrypted</p>
                    <p>Enter your backup password to continue.</p>
                  </div>
                </div>

                {importError && (
                  <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                <input
                  type="password"
                  placeholder="Backup password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDecrypt(); }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                  // Intentional: focus the password field when the decrypt form appears.
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={reset}>
                    Cancel
                  </Button>
                  <Button size="lg" onClick={handleDecrypt} disabled={importPassword.length === 0}>
                    Unlock Backup
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'preview' && preview && pendingBackup && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-primary">
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="font-semibold">Valid backup (v{pendingBackup.backupVersion})</p>
                    <p>{preview.summary}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border divide-y divide-border text-sm">
                  <div className="grid grid-cols-3 text-center py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide bg-muted rounded-t-lg">
                    <span>Category</span>
                    <span>New / Updated</span>
                    <span>Skipped</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-foreground">Sessions</span>
                    <span className="font-semibold text-primary">{preview.newRecords.sessions}</span>
                    <span className="text-muted-foreground">{preview.skippedDuplicates.sessions}</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-foreground">Clubs</span>
                    <span className="font-semibold text-primary">{preview.newRecords.clubs}</span>
                    <span className="text-muted-foreground">{preview.skippedDuplicates.clubs}</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-foreground">Video Analyses</span>
                    <span className="font-semibold text-primary">{preview.newRecords.videoAnalyses}</span>
                    <span className="text-muted-foreground">{preview.skippedDuplicates.videoAnalyses}</span>
                  </div>
                  {preview.updatedRecords.communityUpdated && (
                    <div className="grid grid-cols-3 text-center py-2.5 bg-accent-secondary/10">
                      <span className="text-foreground">Badges &amp; XP</span>
                      <span className="font-semibold text-accent-secondary">
                        {preview.updatedRecords.communityBadges ?? 0} badges
                      </span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  )}
                </div>

                {preview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg p-2.5">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleMerge}>
                      Merge
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Add new records to current data</p>
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-error border-error/40 hover:bg-error/10"
                      onClick={() => setImportStep('confirming-replace')}
                    >
                      Replace
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Overwrite all current data</p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={reset} className="w-full text-muted-foreground">
                  Cancel
                </Button>
              </div>
            )}

            {importStep === 'confirming-replace' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-error/10 border border-error/30 rounded-xl p-4">
                  <AlertTriangle className="text-error shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-error space-y-1">
                    <p className="font-semibold">This will overwrite your current data</p>
                    <p>
                      All existing sessions, clubs, profiles, and video analyses will be replaced
                      with the backup. Your settings will be kept. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={() => setImportStep('preview')}>
                    Go Back
                  </Button>
                  <Button
                    size="lg"
                    className="bg-error text-error-foreground hover:bg-error/90"
                    onClick={handleReplace}
                  >
                    Yes, Replace Everything
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'done' && restoreResult && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-primary">
                  <CheckCircle size={18} className="shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="font-semibold text-base">Restore complete</p>
                    <p>{restoreResult.summary}</p>
                    {restoreResult.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-error">
                        {restoreResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={reset}>
                  Done
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
