'use client';

// ============================================================
// SwingIQ — Backup Health Banner
// Shows backup status on community dashboard, profile, Data Center.
// ============================================================

import Link from 'next/link';
import { Shield, AlertTriangle, Download } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateBackupHealth, getHealthColor, formatLastExport } from '@/lib/community/backup-health';
import { cn } from '@/lib/utils';

interface BackupHealthBannerProps {
  compact?: boolean;
  showExportButton?: boolean;
  className?: string;
}

export function BackupHealthBanner({
  compact = false,
  showExportButton = true,
  className,
}: BackupHealthBannerProps) {
  const { sessions, video_analyses, training, community } = useSwingIQStore();
  const { t } = useLanguage();

  const health = calculateBackupHealth(
    sessions,
    video_analyses,
    training,
    community.lastExportAt,
    community.exportCount
  );

  const colorClass = getHealthColor(health.status);

  const statusLabel = {
    current: t('data.healthCurrent'),
    recommended: t('data.healthRecommended'),
    urgent: t('data.healthUrgent'),
    none: t('data.healthNone'),
  }[health.status];

  const statusDesc = {
    current: t('data.healthCurrentDesc'),
    recommended: t('data.healthRecommendedDesc'),
    urgent: t('data.healthUrgentDesc'),
    none: t('data.healthNoneDesc'),
  }[health.status];

  const Icon = health.status === 'current' ? Shield
    : health.status === 'none' ? Download
    : AlertTriangle;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium', colorClass, className)}>
        <Icon size={14} aria-hidden="true" />
        <span>{statusLabel}</span>
        {health.sessionsSinceExport > 0 && (
          <span className="text-xs opacity-75">· {health.sessionsSinceExport} sessions since last export</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('flex gap-3 rounded-xl border p-4', colorClass, className)}
      role="status"
      aria-label={`${t('data.health')}: ${statusLabel}`}
    >
      <Icon size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold">{statusLabel}</p>
          <p className="text-xs opacity-75">
            {t('data.lastExport')}: {formatLastExport(health.lastExportAt)}
          </p>
        </div>
        <p className="text-sm mt-0.5 opacity-90">{statusDesc}</p>
        {health.sessionsSinceExport > 0 && (
          <p className="text-xs mt-1 opacity-75">
            {health.sessionsSinceExport} {t('data.sessionsSinceExport')}
          </p>
        )}
        {showExportButton && health.status !== 'current' && (
          <Link
            href="/data"
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold underline underline-offset-2 hover:no-underline"
          >
            <Download size={12} aria-hidden="true" />
            {t('data.exportFull')}
          </Link>
        )}
      </div>
    </div>
  );
}
