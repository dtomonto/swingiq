// ============================================================
// SwingVantage — Backup Migration Layer
//
// Upgrades older backup files to the current schema before
// they are imported. Add a new migration function whenever
// a schema-breaking change is shipped.
//
// HOW TO ADD A MIGRATION:
//   1. Define a migration function: migrateV_X_to_V_Y(data)
//   2. Add an entry to MIGRATION_CHAIN with the version pair.
//   3. The migrate() function applies all needed steps in order.
//
// MIGRATION RULES:
//   - Never mutate the original backup object; always spread.
//   - Prefer adding optional fields with sensible defaults.
//   - Delete deprecated fields only when safe to do so.
//   - Log a descriptive warning[] entry for each upgrade step.
// ============================================================

import type { SwingVantageBackup } from './schema';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

export interface MigrationResult {
  backup: SwingVantageBackup;
  warnings: string[];
  migratedFrom: string;
  migratedTo: string;
  stepsApplied: string[];
}

// ── Version constants ──────────────────────────────────────────

export const SUPPORTED_VERSIONS = ['1.0.0', '1.1.0', '1.2.0'] as const;
export type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number];

// ── Migration functions ────────────────────────────────────────

/**
 * v1.0.0 → v1.1.0
 * Added: preferredLanguage at root + data level, community.lastExportAt,
 * community.exportCount, community.activityFeed, community.privacy.
 */
function migrateV100toV110(backup: SwingVantageBackup): SwingVantageBackup {
  return {
    ...backup,
    backupVersion: '1.1.0',
    schemaVersion: '1.1.0',
    preferredLanguage: backup.preferredLanguage ?? backup.data?.settings?.language,
    data: {
      ...backup.data,
      community: backup.data.community
        ? {
            ...backup.data.community,
            lastExportAt: backup.data.community.lastExportAt ?? null,
            exportCount: backup.data.community.exportCount ?? 0,
            activityFeed: backup.data.community.activityFeed ?? [],
            privacy: backup.data.community.privacy ?? {
              profileVisibility: 'private',
              feedVisibility: 'private',
              leaderboardOptOut: false,
              hideExactMetrics: false,
              showImprovementOnly: false,
              allowFollowers: false,
            },
          }
        : undefined,
    },
  };
}

/**
 * v1.1.0 → v1.2.0
 * Added: data.tutorialProgress, metadata.recordCounts.achievementsEarned,
 * metadata.recordCounts.challengesCompleted, metadata.recordCounts.xpTotal,
 * metadata.recordCounts.tutorialsCompleted.
 */
function migrateV110toV120(backup: SwingVantageBackup): SwingVantageBackup {
  const community = backup.data.community;

  return {
    ...backup,
    backupVersion: '1.2.0',
    schemaVersion: '1.2.0',
    appVersion: backup.appVersion ?? '1.1.0',
    data: {
      ...backup.data,
      tutorialProgress: backup.data.tutorialProgress ?? DEFAULT_TUTORIAL_PROGRESS,
    },
    metadata: {
      ...backup.metadata,
      recordCounts: {
        ...backup.metadata.recordCounts,
        achievementsEarned: community?.achievementsEarned?.length ?? 0,
        challengesCompleted: community?.challengesCompleted?.length ?? 0,
        xpTotal: community?.xpTotal ?? 0,
        tutorialsCompleted: 0, // unknown from old backup
      },
    },
  };
}

// ── Migration chain ────────────────────────────────────────────

interface MigrationStep {
  from: string;
  to: string;
  label: string;
  fn: (backup: SwingVantageBackup) => SwingVantageBackup;
}

const MIGRATION_CHAIN: MigrationStep[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    label: 'Add language preference and community export tracking',
    fn: migrateV100toV110,
  },
  {
    from: '1.1.0',
    to: '1.2.0',
    label: 'Add tutorial progress and enhanced backup metadata',
    fn: migrateV110toV120,
  },
];

// ── Main migrate() entry point ─────────────────────────────────

/**
 * Upgrades a backup file to the current schema version.
 * Safe to call on already-current backups (returns unchanged).
 *
 * @returns MigrationResult with the upgraded backup and audit log.
 *          If migration is not possible, returns the original with a warning.
 */
export function migrateBackup(backup: SwingVantageBackup): MigrationResult {
  const originalVersion = backup.backupVersion ?? 'unknown';
  const warnings: string[] = [];
  const stepsApplied: string[] = [];

  // Already current
  if (backup.backupVersion === '1.2.0') {
    return {
      backup,
      warnings,
      migratedFrom: originalVersion,
      migratedTo: originalVersion,
      stepsApplied,
    };
  }

  // Attempt step-by-step migration
  let current = backup;
  for (const step of MIGRATION_CHAIN) {
    if (current.backupVersion === step.from) {
      current = step.fn(current);
      stepsApplied.push(`${step.from} → ${step.to}: ${step.label}`);
    }
    if (current.backupVersion === '1.2.0') break;
  }

  if (stepsApplied.length > 0) {
    warnings.push(
      `This backup was created with an older version of SwingVantage (v${originalVersion}). ` +
        `It was automatically upgraded to v${current.backupVersion} before importing. ` +
        `Review the restored data to make sure everything looks correct.`,
    );
  } else if (current.backupVersion !== '1.2.0') {
    warnings.push(
      `This backup version (v${originalVersion}) is not recognised. ` +
        `Some data may be missing or displayed incorrectly.`,
    );
  }

  return {
    backup: current,
    warnings,
    migratedFrom: originalVersion,
    migratedTo: current.backupVersion,
    stepsApplied,
  };
}

/**
 * Returns true if the backup requires migration before it can be used.
 */
export function needsMigration(backup: SwingVantageBackup): boolean {
  return backup.backupVersion !== '1.2.0';
}
