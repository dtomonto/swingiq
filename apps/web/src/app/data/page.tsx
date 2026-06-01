'use client';

// ============================================================
// SwingIQ Data Center
// The primary export/import hub. Emphasizes data as a durable asset.
// Includes backup health, export reminders, language-in-backup support.
// ============================================================

import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BackupHealthBanner } from '@/components/community/BackupHealthBanner';
import { LanguageToggle } from '@/components/language/LanguageToggle';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG } from '@/lib/i18n';
import { exportUserData, downloadBackup } from '@/lib/backup/export';
import { parseBackupFile } from '@/lib/backup/validate';
import { previewRestore, mergeRestore, replaceRestore, generateRestoreResult } from '@/lib/backup/restore';
import { encryptBackup, decryptBackup, isEncryptedBackup } from '@/lib/backup/crypto';
import { calculateBackupHealth, formatLastExport } from '@/lib/community/backup-health';
import { getExportableModules } from '@/lib/backup/registry';
import type { SwingIQBackup, RestorePreview, RestoreResult } from '@/lib/backup/schema';
import {
  Download, Upload, Shield, Lock, AlertTriangle, CheckCircle,
  RefreshCw, Database, Globe, Info, Trash2, Calendar,
} from 'lucide-react';

type ImportStep = 'idle' | 'parsing' | 'needs-password' | 'preview' | 'confirming-replace' | 'done';

export default function DataCenterPage() {
  const store = useSwingIQStore();
  const { t, language } = useLanguage();
  const { sessions, clubs, video_analyses, community } = store;

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
  const [pendingBackup, setPendingBackup] = useState<SwingIQBackup | null>(null);
  const [pendingEncryptedContent, setPendingEncryptedContent] = useState<string | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreLanguage, setRestoreLanguage] = useState<'backup' | 'current'>('current');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExportError(null);
    if (exportEncrypt) {
      if (exportPassword.length < 8) { setExportError('Password must be at least 8 characters.'); return; }
      if (exportPassword !== exportPasswordConfirm) { setExportError('Passwords do not match.'); return; }
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
      setTimeout(() => setExported(false), 4000);
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
    try { content = await file.text(); }
    catch { setImportError('Could not read file.'); setImportStep('idle'); return; }

    if (isEncryptedBackup(content)) {
      setPendingEncryptedContent(content);
      setImportPassword('');
      setImportStep('needs-password');
      return;
    }

    const { backup, error, warnings: parseWarnings } = await parseBackupFile(file);
    if (error || !backup) { setImportError(error ?? 'Unknown parse error'); setImportStep('idle'); return; }
    const p = previewRestore(backup, store);
    // Merge parser warnings into preview warnings
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
    useSwingIQStore.setState(delta);
    // Restore language if user chose to
    if (restoreLanguage === 'backup' && pendingBackup.preferredLanguage) {
      store.updateSettings({ language: pendingBackup.preferredLanguage });
    }
    setRestoreResult(generateRestoreResult(preview, true));
    setImportStep('done');
  }

  function handleReplace() {
    if (!pendingBackup || !preview) return;
    const delta = replaceRestore(pendingBackup, store.settings);
    useSwingIQStore.setState(delta);
    useSwingIQStore.getState().computeSetupStep();
    if (restoreLanguage === 'backup' && pendingBackup.preferredLanguage) {
      store.updateSettings({ language: pendingBackup.preferredLanguage });
    }
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

  return (
    <AppShell>
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-24">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database size={24} className="text-primary" aria-hidden="true" />
            {t('data.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('data.subtitle')}</p>
        </div>

        {/* Main description */}
        <div className="flex gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <Shield className="text-primary mt-0.5 shrink-0" size={20} aria-hidden="true" />
          <div className="text-sm text-primary space-y-1">
            <p className="font-semibold">{t('data.promptValueOfData')}</p>
            <p>{t('data.mainDescription')}</p>
          </div>
        </div>

        {/* Backup Health */}
        <BackupHealthBanner showExportButton />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <StatCard label={t('data.totalSessions')} value={String(sessions.length)} />
          <StatCard label={t('data.totalClubs')} value={String(clubs.length)} />
          <StatCard label={t('data.totalVideos')} value={String(video_analyses.length)} />
          <StatCard label="Exports" value={String(community.exportCount)} />
        </div>

        {/* Export section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={18} className="text-primary" aria-hidden="true" />
              {t('data.exportFull')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('data.backupContains')}</p>

            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm text-foreground">
              <p className="font-medium text-foreground">Your backup includes:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {getExportableModules().map((mod) => (
                  <li key={mod.id} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold shrink-0">✓</span>
                    <span>
                      <span className="font-medium">{mod.label}</span>
                      {' — '}
                      <span className="text-muted-foreground">{mod.getSummaryLine(store)}</span>
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-1.5 text-primary font-medium pt-0.5">
                  <Globe size={12} aria-hidden="true" />
                  Language: {LANGUAGE_CONFIG[language]?.nativeName ?? language}
                </li>
              </ul>
            </div>

            {/* Last export */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={14} aria-hidden="true" />
              <span>{t('data.lastExport')}: <strong>{formatLastExport(community.lastExportAt)}</strong></span>
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
                  aria-label="Encrypt backup with password"
                />
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">Encrypt with password (recommended)</span>
                </div>
              </label>

              {exportEncrypt && (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2 bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span><strong>Important:</strong> If you forget your backup password, your data cannot be recovered.</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Password (min. 8 characters)"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                    aria-label="Backup encryption password"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={exportPasswordConfirm}
                    onChange={(e) => setExportPasswordConfirm(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                    aria-label="Confirm backup encryption password"
                  />
                </div>
              )}
            </div>

            {exportError && (
              <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error" role="alert">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{exportError}</span>
              </div>
            )}

            <Button size="lg" onClick={handleExport} className="w-full" disabled={exportLoading}>
              {exportLoading ? <RefreshCw size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
              {exportLoading ? 'Exporting…' : t('data.downloadBackup')}
            </Button>

            {exported && (
              <div className="flex items-center gap-2 text-primary text-sm font-medium" role="status" aria-live="polite">
                <CheckCircle size={16} aria-hidden="true" />
                Backup downloaded! Your progress is protected.
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t('data.privacyNote')}</p>
          </CardBody>
        </Card>

        {/* Language preference note */}
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{t('data.languageInBackup')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('language.backupNote')}</p>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">{t('settings.languageHelper')}</p>
                  <LanguageToggle variant="full" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Import section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={18} className="text-accent-secondary" aria-hidden="true" />
              {t('data.importBackup')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {importStep === 'idle' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Select a SwingIQ backup file (.json or .swingiqbackup) to preview what will be restored.
                </p>
                {importError && (
                  <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error" role="alert">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
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
                    aria-label="Select backup file"
                  />
                  <Button variant="outline" size="lg" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} aria-hidden="true" />
                    Select Backup File
                  </Button>
                </label>
              </>
            )}

            {importStep === 'parsing' && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground py-4 justify-center" role="status" aria-live="polite">
                <RefreshCw size={18} className="animate-spin text-primary" aria-hidden="true" />
                Reading backup file…
              </div>
            )}

            {importStep === 'needs-password' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
                  <Lock className="text-accent-secondary shrink-0 mt-0.5" size={20} aria-hidden="true" />
                  <div className="text-sm text-foreground">
                    <p className="font-semibold">This backup is encrypted</p>
                    <p>Enter your backup password to continue.</p>
                  </div>
                </div>
                {importError && (
                  <div className="flex gap-2 bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error" role="alert">
                    <AlertTriangle size={16} aria-hidden="true" />
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
                  autoFocus
                  aria-label="Backup decryption password"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={reset}>{t('common.cancel')}</Button>
                  <Button size="lg" onClick={handleDecrypt} disabled={importPassword.length === 0}>Unlock Backup</Button>
                </div>
              </div>
            )}

            {importStep === 'preview' && preview && pendingBackup && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-primary" role="status">
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Valid backup (v{pendingBackup.backupVersion})</p>
                    <p>{preview.summary}</p>
                  </div>
                </div>

                {/* Language restore option */}
                {pendingBackup.preferredLanguage && pendingBackup.preferredLanguage !== language && (
                  <div className="bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-accent-secondary" aria-hidden="true" />
                      <p className="text-sm font-semibold text-foreground">{t('data.previewLanguage')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-card rounded-lg p-2.5 text-center border border-accent-secondary/20">
                        <p className="font-medium text-foreground">Backup Language</p>
                        <p className="text-foreground mt-0.5">
                          {LANGUAGE_CONFIG[pendingBackup.preferredLanguage]?.nativeName ?? pendingBackup.preferredLanguage}
                        </p>
                      </div>
                      <div className="bg-card rounded-lg p-2.5 text-center border border-accent-secondary/20">
                        <p className="font-medium text-foreground">Current Language</p>
                        <p className="text-foreground mt-0.5">{LANGUAGE_CONFIG[language]?.nativeName ?? language}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(['backup', 'current'] as const).map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="restoreLanguage"
                            value={option}
                            checked={restoreLanguage === option}
                            onChange={() => setRestoreLanguage(option)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm text-foreground">
                            {option === 'backup' ? t('data.restoreLanguage') : t('data.keepCurrentLanguage')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview table */}
                <div className="rounded-lg border border-border divide-y divide-border text-sm" role="table" aria-label="Restore preview">
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
                        {preview.updatedRecords.communityBadges ?? 0} badges · {preview.updatedRecords.communityXP ?? 0} XP
                      </span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  )}
                  {preview.updatedRecords.training && (
                    <div className="grid grid-cols-3 text-center py-2.5">
                      <span className="text-foreground">Training Progress</span>
                      <span className="font-semibold text-primary">Updated</span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  )}
                  {preview.updatedRecords.tutorialUpdated && (
                    <div className="grid grid-cols-3 text-center py-2.5">
                      <span className="text-foreground">Tutorial Progress</span>
                      <span className="font-semibold text-primary">Updated</span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  )}
                </div>

                {preview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg p-2.5" role="alert">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleMerge}>Merge</Button>
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
                <Button variant="ghost" size="sm" onClick={reset} className="w-full text-muted-foreground">{t('common.cancel')}</Button>
              </div>
            )}

            {importStep === 'confirming-replace' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-error/10 border border-error/30 rounded-xl p-4" role="alertdialog">
                  <AlertTriangle className="text-error shrink-0 mt-0.5" size={20} aria-hidden="true" />
                  <div className="text-sm text-error space-y-1">
                    <p className="font-semibold">This will overwrite your current data</p>
                    <p>{t('data.promptBeforeClear')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={() => setImportStep('preview')}>Go Back</Button>
                  <Button size="lg" className="bg-error text-error-foreground hover:bg-error/90" onClick={handleReplace}>
                    Yes, Replace Everything
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'done' && restoreResult && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-primary" role="status" aria-live="polite">
                  <CheckCircle size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
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
                <Button size="lg" className="w-full" onClick={reset}>{t('common.done')}</Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Schema info */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Info size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{t('data.schemaVersion')}: 1.1.0</p>
                <p>Backup format: swingiq-backup-v1</p>
                <p>{t('data.privacyNote')}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <Trash2 size={18} aria-hidden="true" />
              {t('data.clearData')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-3 bg-error/10 border border-error/30 rounded-xl p-4" role="alert">
              <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} aria-hidden="true" />
              <p className="text-sm text-error">{t('data.exportBeforeClear')}</p>
            </div>
            <Button
              variant="outline"
              className="text-error border-error/40 hover:bg-error/10 w-full"
              onClick={() => {
                if (window.confirm(t('data.promptBeforeClear'))) {
                  store.reset();
                }
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('data.clearData')}
            </Button>
          </CardBody>
        </Card>

      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
