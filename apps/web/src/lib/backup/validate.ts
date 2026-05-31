import {
  BACKUP_FORMAT,
  type SwingIQBackup,
  type BackupValidationResult,
} from './schema';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function isValidSemver(v: unknown): boolean {
  return typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v);
}

export function validateBackupFile(parsed: unknown): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, version: 'unknown', errors: ['File is not a valid JSON object'], warnings };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.backupFormat !== BACKUP_FORMAT) {
    errors.push(`Invalid backup format: expected "${BACKUP_FORMAT}", got "${obj.backupFormat}"`);
  }

  if (!isValidSemver(obj.backupVersion)) {
    errors.push('Missing or invalid backupVersion');
  }

  if (!obj.createdAt || typeof obj.createdAt !== 'string') {
    errors.push('Missing createdAt timestamp');
  }

  if (!obj.data || typeof obj.data !== 'object') {
    errors.push('Missing data field');
  } else {
    const data = obj.data as Record<string, unknown>;
    if ('sessions' in data && !Array.isArray(data.sessions)) {
      errors.push('data.sessions must be an array');
    }
    if ('clubs' in data && !Array.isArray(data.clubs)) {
      errors.push('data.clubs must be an array');
    }
    if ('videoAnalyses' in data && !Array.isArray(data.videoAnalyses)) {
      errors.push('data.videoAnalyses must be an array');
    }
  }

  if (!obj.metadata || typeof obj.metadata !== 'object') {
    warnings.push('Missing metadata — counts will not be available');
  }

  const version = typeof obj.backupVersion === 'string' ? obj.backupVersion : 'unknown';
  return { valid: errors.length === 0, version, errors, warnings };
}

export async function parseBackupFile(
  file: File,
): Promise<{ backup: SwingIQBackup | null; error: string | null }> {
  if (!file.name.endsWith('.json') && !file.name.endsWith('.swingiqbackup')) {
    return { backup: null, error: 'Only .json or .swingiqbackup backup files are accepted' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { backup: null, error: 'File exceeds the 50 MB size limit' };
  }

  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    return { backup: null, error: 'File could not be parsed as JSON' };
  }

  const result = validateBackupFile(parsed);
  if (!result.valid) {
    return { backup: null, error: result.errors.join('; ') };
  }

  return { backup: parsed as SwingIQBackup, error: null };
}
