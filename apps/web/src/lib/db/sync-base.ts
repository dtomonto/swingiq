// ============================================================
// SwingVantage — Sync base (the common ancestor for delete-sync)
//
// After every successful sync, we record a fingerprint of what the device
// and the cloud now AGREE on: a content hash per entity (and per singleton).
// On the next sign-in this "base" lets a 3-way merge tell the difference
// between "this item is new" and "this item was deleted on another device"
// — so deletions propagate instead of being resurrected, while genuinely
// new items on either side are still kept.
//
// Stored per user in localStorage (it only ever describes THIS device's
// last agreement with the cloud, so it is correctly device-local).
// ============================================================

import type { SwingVantageState } from '@/store';
import { djb2 } from './cloud-repo';

export interface SyncBase {
  v: 1;
  clubs: Record<string, string>;
  sessions: Record<string, string>;
  video: Record<string, string>;
  tennis: Record<string, string>;
  pickleball: Record<string, string>;
  padel: Record<string, string>;
  baseball: Record<string, string>;
  softball_slow: Record<string, string>;
  softball_fast: Record<string, string>;
  sportProfiles: Record<string, string>;
  profile: string | null;
  training: string;
  settings: string;
  community: string;
  tutorial: string;
  agent: string;
}

export const hashOf = (v: unknown): string => djb2(JSON.stringify(v ?? null));

const byId = <T extends { id: string }>(arr: T[]): Record<string, string> =>
  Object.fromEntries(arr.map((e) => [e.id, hashOf(e)]));

/** Fingerprint the current store state as the new agreed base. */
export function computeBase(s: SwingVantageState): SyncBase {
  return {
    v: 1,
    clubs: byId(s.clubs),
    sessions: byId(s.sessions),
    video: byId(s.video_analyses),
    tennis: byId(s.sportEquipment.tennis),
    pickleball: byId(s.sportEquipment.pickleball),
    padel: byId(s.sportEquipment.padel),
    baseball: byId(s.sportEquipment.baseball),
    softball_slow: byId(s.sportEquipment.softball_slow),
    softball_fast: byId(s.sportEquipment.softball_fast),
    sportProfiles: Object.fromEntries(
      Object.entries(s.sportProfiles)
        .filter(([, v]) => !!v)
        .map(([k, v]) => [k, hashOf(v)]),
    ),
    profile: s.profile ? hashOf(s.profile) : null,
    training: hashOf(s.training),
    settings: hashOf(s.settings),
    community: hashOf(s.community),
    tutorial: hashOf(s.tutorialProgress),
    agent: hashOf(s.agent),
  };
}

const keyFor = (userId: string) => `swingiq.syncBase.${userId}`;

// Record<string,string> maps the 3-way merge indexes directly (base.clubs[id]).
const RECORD_FIELDS = [
  'clubs', 'sessions', 'video', 'tennis', 'pickleball', 'padel',
  'baseball', 'softball_slow', 'softball_fast', 'sportProfiles',
] as const;
// Singleton fingerprints the merge compares as plain hashes.
const STRING_FIELDS = ['training', 'settings', 'community', 'tutorial', 'agent'] as const;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * A base is only usable if it's the right version AND structurally complete —
 * the 3-way merge indexes `base.clubs[id]`, `base.training`, etc. directly, so a
 * truncated/corrupt `{ v: 1 }` blob would throw mid-merge. Validate the shape so
 * a bad base degrades safely to `null` (→ non-destructive union on next sync).
 */
function isValidBase(p: unknown): p is SyncBase {
  if (!isObject(p) || p.v !== 1) return false;
  for (const f of RECORD_FIELDS) if (!isObject(p[f])) return false;
  for (const f of STRING_FIELDS) if (typeof p[f] !== 'string') return false;
  if (!(p.profile === null || typeof p.profile === 'string')) return false;
  return true;
}

export function loadBase(userId: string): SyncBase | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidBase(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBase(userId: string, base: SyncBase): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(base));
  } catch {
    /* quota / private mode — non-critical; next sign-in falls back to union merge */
  }
}
