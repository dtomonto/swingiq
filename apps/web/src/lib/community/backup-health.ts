// ============================================================
// SwingVantage Community — Backup Health
// Calculates backup status and provides messaging.
// ============================================================

import type { BackupHealth, BackupHealthStatus } from './types';
import type { LocalSession, LocalVideoAnalysis, TrainingProgress } from '@/store';

const SESSION_THRESHOLD_RECOMMENDED = 3;
const SESSION_THRESHOLD_URGENT = 10;

export function calculateBackupHealth(
  sessions: LocalSession[],
  videoAnalyses: LocalVideoAnalysis[],
  training: TrainingProgress,
  lastExportAt: string | null,
  exportCount: number
): BackupHealth {
  const totalItems = sessions.length + videoAnalyses.length;

  if (totalItems === 0) {
    return {
      status: 'none',
      lastExportAt: null,
      sessionsSinceExport: 0,
      milestonesUnprotected: 0,
      exportCount,
    };
  }

  if (!lastExportAt || exportCount === 0) {
    return {
      status: 'none',
      lastExportAt: null,
      sessionsSinceExport: totalItems,
      milestonesUnprotected: training.milestones_earned.length,
      exportCount,
    };
  }

  const exportDate = new Date(lastExportAt);

  // Count sessions created after last export
  const sessionsSinceExport = sessions.filter(s => new Date(s.created_at) > exportDate).length
    + videoAnalyses.filter(v => new Date(v.created_at) > exportDate).length;

  let status: BackupHealthStatus;
  if (sessionsSinceExport === 0) {
    status = 'current';
  } else if (sessionsSinceExport < SESSION_THRESHOLD_RECOMMENDED) {
    status = 'current';
  } else if (sessionsSinceExport < SESSION_THRESHOLD_URGENT) {
    status = 'recommended';
  } else {
    status = 'urgent';
  }

  return {
    status,
    lastExportAt,
    sessionsSinceExport,
    milestonesUnprotected: 0, // milestones are included in export, so if exported recently they are safe
    exportCount,
  };
}

export function getHealthColor(status: BackupHealthStatus): string {
  switch (status) {
    case 'current': return 'text-green-600 bg-green-50 border-green-200';
    case 'recommended': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
    case 'none': return 'text-orange-600 bg-orange-50 border-orange-200';
  }
}

export function getHealthIcon(status: BackupHealthStatus): string {
  switch (status) {
    case 'current': return '✅';
    case 'recommended': return '⚠️';
    case 'urgent': return '🚨';
    case 'none': return '💾';
  }
}

export function formatLastExport(lastExportAt: string | null): string {
  if (!lastExportAt) return 'Never';
  const date = new Date(lastExportAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
