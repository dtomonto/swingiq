// ============================================================
// SwingVantage — Auto-Sync config shapes + defaults
//
// These are intentionally kept OUT of the main zustand store and the
// backup schema: they describe a *device-specific* relationship to a
// file/folder (which can't and shouldn't travel inside a backup), so
// they live in IndexedDB next to the file handles themselves.
// ============================================================

export interface AutoSaveConfig {
  /** User turned periodic auto-save on. */
  enabled: boolean;
  /** How often the periodic save runs, in minutes. */
  intervalMinutes: number;
  /** Friendly file name to show in the UI (the handle has no path). */
  fileLabel: string | null;
  /** ISO timestamp of the last successful auto-save. */
  lastSavedAt: string | null;
  /** Content signature of the last save, so unchanged data is skipped. */
  lastSavedHash: string | null;
}

export interface AutoRestoreConfig {
  /** User turned automatic "continue progress" scanning on. */
  enabled: boolean;
  /** Friendly folder name to show in the UI. */
  dirLabel: string | null;
  /** ISO timestamp of the last folder scan. */
  lastScanAt: string | null;
  /**
   * Signature (`name|lastModified`) of the backup we last continued from,
   * so we don't re-prompt for a file the user already applied or dismissed.
   */
  appliedSignature: string | null;
}

export const DEFAULT_AUTOSAVE_CONFIG: AutoSaveConfig = {
  enabled: false,
  intervalMinutes: 10,
  fileLabel: null,
  lastSavedAt: null,
  lastSavedHash: null,
};

export const DEFAULT_AUTORESTORE_CONFIG: AutoRestoreConfig = {
  enabled: false,
  dirLabel: null,
  lastScanAt: null,
  appliedSignature: null,
};

/** Allowed periodic cadences (minutes) surfaced in the UI. */
export const AUTOSAVE_INTERVALS = [5, 10, 30, 60] as const;
