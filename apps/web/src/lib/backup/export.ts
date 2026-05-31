import type { SwingIQState } from '@/store';
import type { SportId } from '@swingiq/core';
import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_VERSION,
  APP_VERSION,
  SCHEMA_VERSION,
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
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    exportedAt: now,
    sourceInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    },
    dataScope: 'full',
    encrypted: false,
    preferredLanguage: state.settings.language,
    data: {
      profile: state.profile,
      sportProfiles: state.sportProfiles,
      clubs: state.clubs,
      sessions: state.sessions,
      videoAnalyses: state.video_analyses,
      training: state.training,
      settings: state.settings,
      community: state.community,
      tutorialProgress: state.tutorialProgress,
      preferredLanguage: state.settings.language,
    },
    metadata: {
      recordCounts: {
        sessions: state.sessions.length,
        clubs: state.clubs.length,
        videoAnalyses: state.video_analyses.length,
        milestones: state.training.milestones_earned.length,
        drillsCompleted: Object.keys(state.training.drills_completed).length,
        achievementsEarned: state.community.achievementsEarned.length,
        challengesCompleted: state.community.challengesCompleted.length,
        xpTotal: state.community.xpTotal,
        tutorialsCompleted: state.tutorialProgress.completed.length,
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

export function generateBackupFilename(backup: SwingIQBackup, encrypted = false): string {
  const date = new Date(backup.createdAt).toISOString().split('T')[0];
  return encrypted
    ? `swingiq-backup-${date}.swingiqbackup`
    : `swingiq-backup-${date}.json`;
}

export function downloadBackup(backup: SwingIQBackup, encryptedBlob?: string): void {
  const isEncrypted = typeof encryptedBlob === 'string';
  const content = isEncrypted ? encryptedBlob : JSON.stringify(backup, null, 2);
  const mimeType = isEncrypted ? 'application/octet-stream' : 'application/json';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateBackupFilename(backup, isEncrypted);
  a.click();
  URL.revokeObjectURL(url);
}
