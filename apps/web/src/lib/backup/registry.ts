// ============================================================
// SwingIQ — Backup Data Registry
//
// PURPOSE:
//   Every feature that stores user data must register here.
//   This creates a single source of truth for what gets exported,
//   imported, validated, merged, and shown to users in the preview.
//
// HOW TO REGISTER A NEW FEATURE:
//   1. Create a BackupDataModule for your feature.
//   2. Call registerBackupModule(yourModule) at the bottom of this file.
//   3. The export/import system will automatically include it.
//
// REQUIREMENTS PER MODULE:
//   - id: unique snake_case identifier
//   - label: human-readable name shown in the restore preview
//   - description: one-sentence explanation for users
//   - sensitive: true if it contains personal or identifying data
//   - exportable: true if this data should be in the backup file
//   - getCount: returns how many records this module has (for preview)
//   - getSummaryLine: returns a user-readable summary string
// ============================================================

import type { SwingIQState } from '@/store';
import type { SwingIQBackup } from './schema';

// ── Type definitions ──────────────────────────────────────────

export interface BackupDataModule {
  /** Unique identifier (used as a key in registry lookups) */
  id: string;

  /** Human-readable label shown in the backup preview */
  label: string;

  /** One sentence explaining what this data covers */
  description: string;

  /**
   * Whether this module contains personally identifiable or
   * privacy-sensitive information. Used to generate the privacy notice.
   */
  sensitive: boolean;

  /** Whether this module's data is included in the backup file */
  exportable: boolean;

  /**
   * Returns the count of records this module has in the current state.
   * Used to populate the "Your backup includes X sessions" summary.
   */
  getCount: (state: SwingIQState) => number;

  /**
   * Returns a plain-English summary line shown in the export/restore preview.
   * Example: "38 practice sessions across 3 sports"
   */
  getSummaryLine: (state: SwingIQState) => string;

  /**
   * Returns the count from a backup file (used in restore preview).
   * Return null if this module's data is not present in the backup.
   */
  getBackupCount: (backup: SwingIQBackup) => number | null;
}

// ── Registry ──────────────────────────────────────────────────

const registry: Map<string, BackupDataModule> = new Map();

export function registerBackupModule(module: BackupDataModule): void {
  registry.set(module.id, module);
}

export function getBackupRegistry(): BackupDataModule[] {
  return Array.from(registry.values());
}

export function getExportableModules(): BackupDataModule[] {
  return getBackupRegistry().filter((m) => m.exportable);
}

export function getSensitiveModules(): BackupDataModule[] {
  return getBackupRegistry().filter((m) => m.sensitive);
}

// ── Core module registrations ─────────────────────────────────

registerBackupModule({
  id: 'golf_profile',
  label: 'Golf Profile',
  description: 'Handicap, goals, swing preferences, and skill level for golf.',
  sensitive: true,
  exportable: true,
  getCount: (s) => (s.profile ? 1 : 0),
  getSummaryLine: (s) => (s.profile ? '1 golf player profile' : 'No golf profile'),
  getBackupCount: (b) => (b.data.profile ? 1 : 0),
});

registerBackupModule({
  id: 'sport_profiles',
  label: 'Sport Profiles',
  description: 'Player profiles for Tennis, Baseball, Slow Pitch Softball, and Fast Pitch Softball.',
  sensitive: true,
  exportable: true,
  getCount: (s) => Object.keys(s.sportProfiles).length,
  getSummaryLine: (s) => {
    const count = Object.keys(s.sportProfiles).length;
    return count > 0 ? `${count} sport profile${count !== 1 ? 's' : ''}` : 'No non-golf sport profiles';
  },
  getBackupCount: (b) => Object.keys(b.data.sportProfiles ?? {}).length,
});

registerBackupModule({
  id: 'sessions',
  label: 'Practice Sessions',
  description: 'All recorded practice sessions including shot data, metrics, and notes.',
  sensitive: false,
  exportable: true,
  getCount: (s) => s.sessions.length,
  getSummaryLine: (s) => {
    const n = s.sessions.length;
    if (n === 0) return 'No sessions recorded';
    const sports = new Set(s.sessions.map((sess) => sess.sport));
    return `${n} session${n !== 1 ? 's' : ''} across ${sports.size} sport${sports.size !== 1 ? 's' : ''}`;
  },
  getBackupCount: (b) => b.data.sessions?.length ?? 0,
});

registerBackupModule({
  id: 'clubs',
  label: 'Equipment',
  description: 'Golf clubs, bats, rackets, and all equipment details.',
  sensitive: false,
  exportable: true,
  getCount: (s) => s.clubs.length,
  getSummaryLine: (s) => {
    const n = s.clubs.length;
    return n > 0 ? `${n} club${n !== 1 ? 's' : ''} / equipment item${n !== 1 ? 's' : ''}` : 'No equipment recorded';
  },
  getBackupCount: (b) => b.data.clubs?.length ?? 0,
});

registerBackupModule({
  id: 'video_analyses',
  label: 'Video Analyses',
  description: 'Swing video analysis results, scores, and identified issues.',
  sensitive: false,
  exportable: true,
  getCount: (s) => s.video_analyses.length,
  getSummaryLine: (s) => {
    const n = s.video_analyses.length;
    return n > 0 ? `${n} video analysis result${n !== 1 ? 's' : ''}` : 'No video analyses';
  },
  getBackupCount: (b) => b.data.videoAnalyses?.length ?? 0,
});

registerBackupModule({
  id: 'training',
  label: 'Training Progress',
  description: 'Drill history, practice streaks, completed steps, and earned milestones.',
  sensitive: false,
  exportable: true,
  getCount: (s) => s.training.milestones_earned.length + Object.keys(s.training.drills_completed).length,
  getSummaryLine: (s) => {
    const milestones = s.training.milestones_earned.length;
    const drills = Object.keys(s.training.drills_completed).length;
    const streak = s.training.streak_days;
    const parts: string[] = [];
    if (streak > 0) parts.push(`${streak}-day streak`);
    if (drills > 0) parts.push(`${drills} drill${drills !== 1 ? 's' : ''} completed`);
    if (milestones > 0) parts.push(`${milestones} milestone${milestones !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' · ') : 'No training progress';
  },
  getBackupCount: (b) => (b.data.training?.milestones_earned?.length ?? 0) + Object.keys(b.data.training?.drills_completed ?? {}).length,
});

registerBackupModule({
  id: 'community',
  label: 'Badges, XP & Community',
  description: 'Achievement badges, XP points, challenge history, streaks, and privacy settings.',
  sensitive: true,
  exportable: true,
  getCount: (s) => s.community.achievementsEarned.length + s.community.challengesCompleted.length,
  getSummaryLine: (s) => {
    const badges = s.community.achievementsEarned.length;
    const xp = s.community.xpTotal;
    const challenges = s.community.challengesCompleted.length;
    const parts: string[] = [];
    if (badges > 0) parts.push(`${badges} badge${badges !== 1 ? 's' : ''}`);
    if (xp > 0) parts.push(`${xp} XP`);
    if (challenges > 0) parts.push(`${challenges} challenge${challenges !== 1 ? 's' : ''} completed`);
    return parts.length > 0 ? parts.join(' · ') : 'No community progress';
  },
  getBackupCount: (b) => (b.data.community?.achievementsEarned?.length ?? 0) + (b.data.community?.challengesCompleted?.length ?? 0),
});

registerBackupModule({
  id: 'tutorial_progress',
  label: 'Tutorial Progress',
  description: 'Which in-app guides you have completed or dismissed.',
  sensitive: false,
  exportable: true,
  getCount: (s) => s.tutorialProgress.completed.length + s.tutorialProgress.dismissed.length,
  getSummaryLine: (s) => {
    const n = s.tutorialProgress.completed.length;
    return n > 0 ? `${n} guide${n !== 1 ? 's' : ''} completed` : 'No guides completed yet';
  },
  getBackupCount: (b) => (b.data.tutorialProgress?.completed?.length ?? 0) + (b.data.tutorialProgress?.dismissed?.length ?? 0),
});

registerBackupModule({
  id: 'settings',
  label: 'App Settings',
  description: 'Language preference, measurement units, coaching style, and display options.',
  sensitive: false,
  exportable: true,
  getCount: () => 1, // settings is a single object, always 1
  getSummaryLine: (s) => {
    const lang = s.settings.language ?? 'en';
    const units = s.settings.units;
    return `Language: ${lang.toUpperCase()} · Units: ${units}`;
  },
  getBackupCount: () => 1,
});
