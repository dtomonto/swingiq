import type {
  GolferProfileInput,
  SportId,
} from '@swingiq/core';
import type {
  SportProfiles,
  LocalClub,
  LocalSession,
  LocalVideoAnalysis,
  TrainingProgress,
  AppSettings,
  SportEquipment,
} from '@/store';

export const BACKUP_FORMAT = 'swingiq-backup-v1';
export const CURRENT_BACKUP_VERSION = '1.1.0';
export const APP_VERSION = '1.0.0';

export interface SwingIQBackupData {
  profile: GolferProfileInput | null;
  sportProfiles: SportProfiles;
  clubs: LocalClub[];
  sportEquipment?: SportEquipment;
  sessions: LocalSession[];
  videoAnalyses: LocalVideoAnalysis[];
  training: TrainingProgress;
  settings: AppSettings;
}

export interface BackupMetadata {
  recordCounts: {
    sessions: number;
    clubs: number;
    videoAnalyses: number;
    milestones: number;
    drillsCompleted: number;
  };
  sportsIncluded: SportId[];
  dateRange: { earliest: string | null; latest: string | null };
  warnings: string[];
}

export interface SwingIQBackup {
  backupFormat: typeof BACKUP_FORMAT;
  backupVersion: string;
  appVersion: string;
  createdAt: string;
  exportedAt: string;
  sourceInfo: {
    userAgent: string;
    platform: string;
  };
  dataScope: 'full';
  encrypted: false;
  data: SwingIQBackupData;
  metadata: BackupMetadata;
}

export interface BackupValidationResult {
  valid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
}

export interface RestorePreview {
  newRecords: {
    sessions: number;
    clubs: number;
    videoAnalyses: number;
  };
  updatedRecords: {
    profile: boolean;
    sportProfiles: string[];
    training: boolean;
  };
  skippedDuplicates: {
    sessions: number;
    clubs: number;
    videoAnalyses: number;
  };
  categories: string[];
  warnings: string[];
  summary: string;
}

export interface RestoreResult extends RestorePreview {
  errors: string[];
}
