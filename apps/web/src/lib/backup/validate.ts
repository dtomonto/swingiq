// ============================================================
// SwingVantage — Backup Validation + Security Parser
//
// SECURITY MODEL:
//   - Files are parsed as plain text and JSON.parse()d — no eval.
//   - Structure is validated before any field is consumed.
//   - Prototype pollution is blocked by checking __proto__, constructor,
//     and prototype keys in the top-level object.
//   - File size is capped at 50 MB server-side and client-side.
//   - Accepted MIME/extension types are enforced.
//   - No backup content is sent to third-party services.
//   - Backup files are processed entirely client-side.
// ============================================================

import {
  BACKUP_FORMAT,
  type SwingVantageBackup,
  type BackupValidationResult,
} from './schema';
import { migrateBackup, needsMigration } from './migrate';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ── Prototype-pollution guard ──────────────────────────────────

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function containsDangerousKeys(obj: unknown, depth = 0): boolean {
  if (depth > 10) return false; // cap recursion depth
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    if (typeof (obj as Record<string, unknown>)[key] === 'object') {
      if (containsDangerousKeys((obj as Record<string, unknown>)[key], depth + 1)) {
        return true;
      }
    }
  }
  return false;
}

// ── Array depth / size guard ───────────────────────────────────

function estimateObjectComplexity(obj: unknown, depth = 0): number {
  if (depth > 20) return 0;
  if (!obj || typeof obj !== 'object') return 1;
  let count = 0;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    count += estimateObjectComplexity(val, depth + 1);
    if (count > 500_000) return count; // short-circuit
  }
  return count;
}

function isValidSemver(v: unknown): boolean {
  return typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v);
}

// ── Core validation ────────────────────────────────────────────

export function validateBackupFile(parsed: unknown): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      version: 'unknown',
      errors: ['File is not a valid JSON object'],
      warnings,
    };
  }

  // Security: prototype pollution check
  if (containsDangerousKeys(parsed)) {
    return {
      valid: false,
      version: 'unknown',
      errors: ['This file contains unsafe content and cannot be imported'],
      warnings,
    };
  }

  // Security: complexity / bomb check
  const complexity = estimateObjectComplexity(parsed);
  if (complexity > 500_000) {
    return {
      valid: false,
      version: 'unknown',
      errors: ['This file is too complex to import safely. It may have been corrupted or tampered with.'],
      warnings,
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Format check
  if (obj.backupFormat !== BACKUP_FORMAT) {
    errors.push(
      `This does not appear to be a SwingVantage backup file. ` +
        `Expected format "${BACKUP_FORMAT}", got "${String(obj.backupFormat ?? 'unknown')}".`,
    );
  }

  // Version check
  if (!isValidSemver(obj.backupVersion)) {
    errors.push('This backup file is missing a valid version number.');
  }

  // Timestamp check
  if (!obj.createdAt || typeof obj.createdAt !== 'string') {
    errors.push('This backup file is missing a creation date.');
  }

  // Data block check
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    errors.push('This backup file is missing its data block.');
  } else {
    const data = obj.data as Record<string, unknown>;

    if ('sessions' in data && !Array.isArray(data.sessions)) {
      errors.push('The sessions data in this backup is not in the expected format.');
    }
    if ('clubs' in data && !Array.isArray(data.clubs)) {
      errors.push('The equipment data in this backup is not in the expected format.');
    }
    if ('videoAnalyses' in data && !Array.isArray(data.videoAnalyses)) {
      errors.push('The video analysis data in this backup is not in the expected format.');
    }
  }

  // Metadata check (soft warning only)
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    warnings.push(
      'This backup is missing summary metadata. Counts will not be available in the preview.',
    );
  }

  const version = typeof obj.backupVersion === 'string' ? obj.backupVersion : 'unknown';
  return { valid: errors.length === 0, version, errors, warnings };
}

// ── File parser + auto-migration ──────────────────────────────

export interface ParseBackupResult {
  backup: SwingVantageBackup | null;
  error: string | null;
  warnings: string[];
  migrated: boolean;
  migratedFrom?: string;
}

/**
 * Reads a File, validates it, and migrates it to the current schema if needed.
 * Returns a plain-English error string on failure (never throws).
 */
export async function parseBackupFile(file: File): Promise<ParseBackupResult> {
  const warnings: string[] = [];

  // Extension check
  if (!file.name.endsWith('.json') && !file.name.endsWith('.swingiqbackup')) {
    return {
      backup: null,
      error: 'Only .json or .swingiqbackup backup files can be imported.',
      warnings,
      migrated: false,
    };
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      backup: null,
      error: `This file is too large to import (${Math.round(file.size / 1024 / 1024)} MB). The maximum is 50 MB.`,
      warnings,
      migrated: false,
    };
  }

  // Parse JSON
  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    return {
      backup: null,
      error: 'This file could not be read as a backup. It may be corrupted or in the wrong format.',
      warnings,
      migrated: false,
    };
  }

  // Validate structure
  const result = validateBackupFile(parsed);
  if (!result.valid) {
    return {
      backup: null,
      error: result.errors[0] ?? 'This file does not appear to be a valid SwingVantage backup.',
      warnings: result.warnings,
      migrated: false,
    };
  }

  // Collect any soft validation warnings
  warnings.push(...result.warnings);

  let backup = parsed as SwingVantageBackup;
  let migrated = false;
  let migratedFrom: string | undefined;

  // Auto-migrate if needed
  if (needsMigration(backup)) {
    const migResult = migrateBackup(backup);
    backup = migResult.backup;
    migrated = migResult.stepsApplied.length > 0;
    migratedFrom = migResult.migratedFrom;
    warnings.push(...migResult.warnings);
  }

  return { backup, error: null, warnings, migrated, migratedFrom };
}
