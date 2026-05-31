'use client';

// ============================================================
// SwingIQ — Export Prompt Component
// Contextual export reminder shown after key moments:
// - After completing a session
// - After unlocking a milestone
// - After completing a challenge
// - After a personal best
// - Before destructive actions
// ============================================================

import { useState } from 'react';
import { Download, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportUserData, downloadBackup } from '@/lib/backup/export';

type ExportPromptTrigger =
  | 'after_session'
  | 'after_milestone'
  | 'after_challenge'
  | 'after_personal_best'
  | 'before_clear'
  | 'backup_recommended'
  | 'generic';

interface ExportPromptProps {
  trigger?: ExportPromptTrigger;
  onDismiss?: () => void;
  onExported?: () => void;
  compact?: boolean;
}

const PROMPT_MESSAGES: Record<ExportPromptTrigger, string> = {
  after_session: 'data.promptAfterSession',
  after_milestone: 'data.promptAfterMilestone',
  after_challenge: 'data.promptAfterChallenge',
  after_personal_best: 'data.promptAfterPersonalBest',
  before_clear: 'data.promptBeforeClear',
  backup_recommended: 'data.promptExportReminder',
  generic: 'data.promptProtect',
};

export function ExportPrompt({
  trigger = 'generic',
  onDismiss,
  onExported,
  compact = false,
}: ExportPromptProps) {
  const { t } = useLanguage();
  const store = useSwingIQStore();
  const [exported, setExported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleExport() {
    setLoading(true);
    try {
      const backup = exportUserData(store);
      downloadBackup(backup);
      store.recordExport();
      setExported(true);
      onExported?.();
      setTimeout(() => setExported(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  const messageKey = PROMPT_MESSAGES[trigger];
  const isCritical = trigger === 'before_clear';

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
          isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}
        role="alert"
      >
        <Shield
          size={16}
          className={isCritical ? 'text-red-600 flex-shrink-0' : 'text-amber-600 flex-shrink-0'}
          aria-hidden="true"
        />
        <p className={`text-sm flex-1 ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>
          {t(messageKey) || t('data.promptProtect')}
        </p>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={loading || exported}
          className="flex-shrink-0"
        >
          {exported ? '✓' : <Download size={14} aria-hidden="true" />}
          {exported ? 'Exported!' : t('data.downloadBackup')}
        </Button>
        {!isCritical && onDismiss && (
          <button
            onClick={handleDismiss}
            aria-label={t('common.close')}
            className="text-amber-500 hover:text-amber-700 p-1 flex-shrink-0"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 ${
        isCritical
          ? 'bg-red-50 border-red-200'
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
      }`}
      role={isCritical ? 'alertdialog' : 'complementary'}
      aria-label={t('data.downloadBackup')}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCritical ? 'bg-red-100' : 'bg-green-100'
          }`}
          aria-hidden="true"
        >
          <Shield
            size={20}
            className={isCritical ? 'text-red-600' : 'text-green-600'}
          />
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${isCritical ? 'text-red-900' : 'text-green-900'}`}
          >
            {isCritical ? t('data.exportBeforeClear') : t('data.promptValueOfData')}
          </p>
          <p className={`text-sm mt-1 ${isCritical ? 'text-red-700' : 'text-green-700'}`}>
            {t(messageKey) || t('data.promptProtect')}
          </p>
        </div>
        {!isCritical && onDismiss && (
          <button
            onClick={handleDismiss}
            aria-label={t('common.close')}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleExport}
          disabled={loading || exported}
          variant={isCritical ? 'danger' : 'primary'}
        >
          <Download size={16} aria-hidden="true" />
          {loading ? t('common.loading') : exported ? '✓ Exported!' : t('data.exportFull')}
        </Button>
        {!isCritical && onDismiss && (
          <Button variant="outline" onClick={handleDismiss}>
            {t('common.cancel')}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 italic">
        {t('data.promptIncludesLanguage')}
      </p>
    </div>
  );
}
