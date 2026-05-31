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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={24} className="text-green-600" aria-hidden="true" />
            {t('data.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('data.subtitle')}</p>
        </div>

        {/* Main description */}
        <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <Shield className="text-green-600 mt-0.5 flex-shrink-0" size={20} aria-hidden="true" />
          <div className="text-sm text-green-800 space-y-1">
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
              <Download size={18} className="text-green-600" aria-hidden="true" />
              {t('data.exportFull')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-gray-600">{t('data.backupContains')}</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
              <p className="font-medium text-gray-900">Your backup includes:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {getExportableModules().map((mod) => (
                  <li key={mod.id} className="flex items-start gap-1.5">
                    <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                    <span>
                      <span className="font-medium">{mod.label}</span>
                      {' — '}
                      <span className="text-gray-500">{mod.getSummaryLine(store)}</span>
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-1.5 text-green-700 font-medium pt-0.5">
                  <Globe size={12} aria-hidden="true" />
                  Language: {LANGUAGE_CONFIG[language]?.nativeName ?? language}
                </li>
              </ul>
            </div>

            {/* Last export */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={14} aria-hidden="true" />
              <span>{t('data.lastExport')}: <strong>{formatLastExport(community.lastExportAt)}</strong></span>
            </div>

            {/* Encryption toggle */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
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
                  className="w-4 h-4 rounded text-green-600"
                  aria-label="Encrypt backup with password"
                />
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gray-500" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-800">Encrypt with password (recommended)</span>
                </div>
              </label>

              {exportEncrypt && (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span><strong>Important:</strong> If you forget your backup password, your data cannot be recovered.</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Password (min. 8 characters)"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Backup encryption password"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={exportPasswordConfirm}
                    onChange={(e) => setExportPasswordConfirm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Confirm backup encryption password"
                  />
                </div>
              )}
            </div>

            {exportError && (
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{exportError}</span>
              </div>
            )}

            <Button size="lg" onClick={handleExport} className="w-full" disabled={exportLoading}>
              {exportLoading ? <RefreshCw size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
              {exportLoading ? 'Exporting…' : t('data.downloadBackup')}
            </Button>

            {exported && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium" role="status" aria-live="polite">
                <CheckCircle size={16} aria-hidden="true" />
                Backup downloaded! Your progress is protected.
              </div>
            )}

            <p className="text-xs text-gray-400">{t('data.privacyNote')}</p>
          </CardBody>
        </Card>

        {/* Language preference note */}
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{t('data.languageInBackup')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('language.backupNote')}</p>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">{t('settings.languageHelper')}</p>
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
              <Upload size={18} className="text-blue-600" aria-hidden="true" />
              {t('data.importBackup')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {importStep === 'idle' && (
              <>
                <p className="text-sm text-gray-600">
                  Select a SwingIQ backup file (.json or .swingiqbackup) to preview what will be restored.
                </p>
                {importError && (
                  <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
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
              <div className="flex items-center gap-3 text-sm text-gray-600 py-4 justify-center" role="status" aria-live="polite">
                <RefreshCw size={18} className="animate-spin text-green-600" aria-hidden="true" />
                Reading backup file…
              </div>
            )}

            {importStep === 'needs-password' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <Lock className="text-blue-500 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">This backup is encrypted</p>
                    <p>Enter your backup password to continue.</p>
                  </div>
                </div>
                {importError && (
                  <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <div className="flex gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800" role="status">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Valid backup (v{pendingBackup.backupVersion})</p>
                    <p>{preview.summary}</p>
                  </div>
                </div>

                {/* Language restore option */}
                {pendingBackup.preferredLanguage && pendingBackup.preferredLanguage !== language && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-blue-600" aria-hidden="true" />
                      <p className="text-sm font-semibold text-blue-900">{t('data.previewLanguage')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                        <p className="font-medium text-gray-700">Backup Language</p>
                        <p className="text-gray-900 mt-0.5">
                          {LANGUAGE_CONFIG[pendingBackup.preferredLanguage]?.nativeName ?? pendingBackup.preferredLanguage}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                        <p className="font-medium text-gray-700">Current Language</p>
                        <p className="text-gray-900 mt-0.5">{LANGUAGE_CONFIG[language]?.nativeName ?? language}</p>
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
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm text-gray-700">
                            {option === 'backup' ? t('data.restoreLanguage') : t('data.keepCurrentLanguage')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview table */}
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm" role="table" aria-label="Restore preview">
                  <div className="grid grid-cols-3 text-center py-2 font-medium text-gray-500 text-xs uppercase tracking-wide bg-gray-50 rounded-t-lg">
                    <span>Category</span>
                    <span>New / Updated</span>
                    <span>Skipped</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-gray-700">Sessions</span>
                    <span className="font-semibold text-green-700">{preview.newRecords.sessions}</span>
                    <span className="text-gray-400">{preview.skippedDuplicates.sessions}</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-gray-700">Clubs</span>
                    <span className="font-semibold text-green-700">{preview.newRecords.clubs}</span>
                    <span className="text-gray-400">{preview.skippedDuplicates.clubs}</span>
                  </div>
                  <div className="grid grid-cols-3 text-center py-2.5">
                    <span className="text-gray-700">Video Analyses</span>
                    <span className="font-semibold text-green-700">{preview.newRecords.videoAnalyses}</span>
                    <span className="text-gray-400">{preview.skippedDuplicates.videoAnalyses}</span>
                  </div>
                  {preview.updatedRecords.communityUpdated && (
                    <div className="grid grid-cols-3 text-center py-2.5 bg-purple-50">
                      <span className="text-gray-700">Badges &amp; XP</span>
                      <span className="font-semibold text-purple-700">
                        {preview.updatedRecords.communityBadges ?? 0} badges · {preview.updatedRecords.communityXP ?? 0} XP
                      </span>
                      <span className="text-gray-400">—</span>
                    </div>
                  )}
                  {preview.updatedRecords.training && (
                    <div className="grid grid-cols-3 text-center py-2.5">
                      <span className="text-gray-700">Training Progress</span>
                      <span className="font-semibold text-green-700">Updated</span>
                      <span className="text-gray-400">—</span>
                    </div>
                  )}
                  {preview.updatedRecords.tutorialUpdated && (
                    <div className="grid grid-cols-3 text-center py-2.5">
                      <span className="text-gray-700">Tutorial Progress</span>
                      <span className="font-semibold text-green-700">Updated</span>
                      <span className="text-gray-400">—</span>
                    </div>
                  )}
                </div>

                {preview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5" role="alert">
                        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleMerge}>Merge</Button>
                    <p className="text-xs text-gray-400 text-center">Add new records to current data</p>
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setImportStep('confirming-replace')}
                    >
                      Replace
                    </Button>
                    <p className="text-xs text-gray-400 text-center">Overwrite all current data</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="w-full text-gray-500">{t('common.cancel')}</Button>
              </div>
            )}

            {importStep === 'confirming-replace' && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4" role="alertdialog">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
                  <div className="text-sm text-red-800 space-y-1">
                    <p className="font-semibold">This will overwrite your current data</p>
                    <p>{t('data.promptBeforeClear')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={() => setImportStep('preview')}>Go Back</Button>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReplace}>
                    Yes, Replace Everything
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'done' && restoreResult && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800" role="status" aria-live="polite">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-base">Restore complete</p>
                    <p>{restoreResult.summary}</p>
                    {restoreResult.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-red-600">
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
              <Info size={18} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
              <div className="text-xs text-gray-500 space-y-0.5">
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
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={18} aria-hidden="true" />
              {t('data.clearData')}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
              <p className="text-sm text-red-800">{t('data.exportBeforeClear')}</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 w-full"
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
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
