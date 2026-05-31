import type { SwingIQState } from '@/store';
import type { SportId } from '@swingiq/core';
import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_VERSION,
  APP_VERSION,
  type SwingIQBackup,
} from './schema';

export function exportUserData(state: SwingIQState): SwingIQBackup {
  const now = new Date().toISOString();

  const sportIds = new Set<SportId>();
  state.sessions.forEach((s) => sportIds.add(s.sport));
  state.video_analyses.forEach((v) => sportIds.add(v.sport));
  Object.keys(state.sportProfiles).forEach((k) => sportIds.add(k as SportId));
  if (state.profile) sportIds.add('golf');

  const sessionDates = state.sessions
    .map((s) => s.date)
    .filter(Boolean)
    .sort();

  return {
    backupFormat: BACKUP_FORMAT,
    backupVersion: CURRENT_BACKUP_VERSION,
    appVersion: APP_VERSION,
    createdAt: now,
    exportedAt: now,
    sourceInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    },
    dataScope: 'full',
    encrypted: false,
    data: {
      profile: state.profile,
      sportProfiles: state.sportProfiles,
      clubs: state.clubs,
      sessions: state.sessions,
      videoAnalyses: state.video_analyses,
      training: state.training,
      settings: state.settings,
    },
    metadata: {
      recordCounts: {
        sessions: state.sessions.length,
        clubs: state.clubs.length,
        videoAnalyses: state.video_analyses.length,
        milestones: state.training.milestones_earned.length,
        drillsCompleted: Object.keys(state.training.drills_completed).length,
      },
      sportsIncluded: Array.from(sportIds),
      dateRange: {
        earliest: sessionDates[0] ?? null,
        latest: sessionDates[sessionDates.length - 1] ?? null,
      },
      warnings: [],
    },
  };
}

export function generateBackupFilename(backup: SwingIQBackup): string {
  const date = new Date(backup.createdAt).toISOString().split('T')[0];
  return `swingiq-backup-${date}.json`;
}

export function downloadBackup(backup: SwingIQBackup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateBackupFilename(backup);
  a.click();
  URL.revokeObjectURL(url);
}
