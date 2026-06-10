// ============================================================
// SwingVantage — RecordAssist: saved camera-angle presets
// ------------------------------------------------------------
// Local-first foundation for "record the same angle again" retests. Stored
// in localStorage (mirrors the rest of the app's local-first persistence).
// Defensive — never throws, returns [] when storage is unavailable.
// ============================================================

import type { RecordAssistSport, SportActionId, CameraView, CameraOrientation } from './types';

const KEY = 'swingiq-record-assist-angles';
const MAX = 20;

export interface SavedAngle {
  sport: RecordAssistSport;
  action: SportActionId;
  view: CameraView;
  orientation: CameraOrientation;
  savedAt: number;
}

function read(): SavedAngle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedAngle[]) : [];
  } catch {
    return [];
  }
}

function write(angles: SavedAngle[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(angles.slice(0, MAX)));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function getSavedAngles(): SavedAngle[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

/** Save (dedupe by sport+action, keeping the most recent). */
export function saveAnglePreset(angle: SavedAngle): SavedAngle[] {
  const existing = read().filter((a) => !(a.sport === angle.sport && a.action === angle.action));
  const next = [angle, ...existing].slice(0, MAX);
  write(next);
  return next;
}

export function removeSavedAngle(sport: RecordAssistSport, action: SportActionId): SavedAngle[] {
  const next = read().filter((a) => !(a.sport === sport && a.action === action));
  write(next);
  return next;
}
