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
import type { CommunityState } from '@/lib/community/types';
import type { LanguageCode } from '@/lib/i18n';
import type { TutorialProgress } from '@/lib/tutorial/types';

export const BACKUP_FORMAT = 'swingiq-backup-v1';
export const CURRENT_BACKUP_VERSION = '1.2.0';
export const APP_VERSION = '1.1.0';
export const SCHEMA_VERSION = '1.2.0';

export interface SwingIQBackupData {
  profile: GolferProfileInput | null;
  sportProfiles: SportProfiles;
  clubs: LocalClub[];
  sportEquipment?: SportEquipment;
  sessions: LocalSession[];
  videoAnalyses: LocalVideoAnalysis[];
  training: TrainingProgress;
  settings: AppSettings;
  community?: CommunityState;
  tutorialProgress?: TutorialProgress;
  preferredLanguage?: LanguageCode;
}

export interface BackupMetadata {
  recordCounts: {
    sessions: number;
    clubs: number;
    videoAnalyses: number;
    milestones: number;
    drillsCompleted: number;
    achievementsEarned?: number;
    challengesCompleted?: number;
    xpTotal?: number;
    tutorialsCompleted?: number;
  };
  sportsIncluded: SportId[];
  dateRange: { earliest: string | null; latest: string | null };
  warnings: string[];
}

export interface SwingIQBackup {
  backupFormat: typeof BACKUP_FORMAT;
  backupVersion: string;
  appVersion: string;
  schemaVersion: string;
  createdAt: string;
  exportedAt: string;
  sourceInfo: {
    userAgent: string;
    platform: string;
  };
  dataScope: 'full';
  encrypted: false;
  preferredLanguage?: LanguageCode;
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
    communityBadges?: number;
    communityXP?: number;
    communityUpdated?: boolean;
    tutorialUpdated?: boolean;
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
