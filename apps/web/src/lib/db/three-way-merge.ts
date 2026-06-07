// ============================================================
// SwingVantage — 3-way merge (cross-device delete-sync)
//
// Given the common ancestor (base = last agreed state), the current device
// (local), and the account (cloud), produce the merged state that:
//   • keeps items created on EITHER side since the base,
//   • propagates DELETES made on either side (an item that existed in the
//     base but is now gone from one side is removed, not resurrected),
//   • on a genuine edit-vs-edit conflict, prefers the side that changed
//     (cloud only when it alone changed; otherwise this device).
//
// This replaces the additive union merge, which never deleted anything.
// ============================================================

import type { SwingVantageState, SportProfiles } from '@/store';
import type { SyncBase } from './sync-base';
import { hashOf } from './sync-base';
import type { SingletonPresence } from './cloud-repo';

// ── Lists keyed by `id` ──────────────────────────────────────
function mergeList<T extends { id: string }>(
  base: Record<string, string>, local: T[], cloud: T[],
): T[] {
  const cloudById = new Map(cloud.map((e) => [e.id, e]));
  const localIds = new Set(local.map((e) => e.id));
  const out: T[] = [];

  // Walk local first (preserves this device's ordering).
  for (const l of local) {
    const c = cloudById.get(l.id);
    const inBase = l.id in base;
    if (c) {
      const localChanged = hashOf(l) !== base[l.id];
      const cloudChanged = hashOf(c) !== base[l.id];
      out.push(cloudChanged && !localChanged ? c : l);
    } else if (!inBase) {
      out.push(l); // created on this device, not yet in cloud → keep
    } // else: was in base, now gone from cloud → deleted elsewhere → drop
  }

  // Append items that exist only in the cloud.
  for (const c of cloud) {
    if (localIds.has(c.id)) continue;
    if (!(c.id in base)) out.push(c); // created on another device → add
    // else: was in base, now gone locally → deleted here → drop
  }
  return out;
}

// ── Map keyed by sport (sportProfiles) ───────────────────────
function mergeSportProfiles(
  base: Record<string, string>, local: SportProfiles, cloud: SportProfiles,
): SportProfiles {
  const out: SportProfiles = {};
  const sports = new Set([
    ...Object.keys(base), ...Object.keys(local), ...Object.keys(cloud),
  ]);
  for (const sp of sports) {
    const key = sp as keyof SportProfiles;
    const l = local[key];
    const c = cloud[key];
    const inBase = sp in base;
    if (l && c) {
      const localChanged = hashOf(l) !== base[sp];
      const cloudChanged = hashOf(c) !== base[sp];
      out[key] = cloudChanged && !localChanged ? c : l;
    } else if (l && !c) {
      if (!inBase) out[key] = l;
    } else if (!l && c) {
      if (!inBase) out[key] = c;
    }
  }
  return out;
}

// ── Always-present singleton (training/settings/community/…) ──
function mergeSingleton<T>(
  baseHash: string, local: T, cloud: T, cloudPresent: boolean,
): T {
  if (!cloudPresent) return local; // cloud has no row → no opinion → keep local
  const localChanged = hashOf(local) !== baseHash;
  const cloudChanged = hashOf(cloud) !== baseHash;
  return cloudChanged && !localChanged ? cloud : local;
}

// ── Nullable singleton (golf profile can be deleted) ─────────
function mergeProfile<T>(
  baseHash: string | null, local: T | null, cloud: T | null,
): T | null {
  const inBase = baseHash !== null;
  if (local && cloud) {
    const localChanged = hashOf(local) !== baseHash;
    const cloudChanged = hashOf(cloud) !== baseHash;
    return cloudChanged && !localChanged ? cloud : local;
  }
  if (local && !cloud) return inBase ? null : local; // deleted elsewhere vs new here
  if (!local && cloud) return inBase ? null : cloud; // deleted here vs new elsewhere
  return null;
}

/**
 * 3-way merge of the whole store. `cloud` is the account's loaded state (with
 * defaults filled for absent domains); `presence` says which singletons truly
 * exist in the cloud so a default isn't mistaken for a real change.
 */
export function threeWayMerge(
  base: SyncBase,
  local: SwingVantageState,
  cloud: SwingVantageState,
  presence: SingletonPresence,
): Partial<SwingVantageState> {
  return {
    profile: mergeProfile(base.profile, local.profile, cloud.profile),
    sportProfiles: mergeSportProfiles(base.sportProfiles, local.sportProfiles, cloud.sportProfiles),
    clubs: mergeList(base.clubs, local.clubs, cloud.clubs),
    sessions: mergeList(base.sessions, local.sessions, cloud.sessions),
    video_analyses: mergeList(base.video, local.video_analyses, cloud.video_analyses),
    sportEquipment: {
      tennis: mergeList(base.tennis, local.sportEquipment.tennis, cloud.sportEquipment.tennis),
      pickleball: mergeList(base.pickleball ?? {}, local.sportEquipment.pickleball, cloud.sportEquipment.pickleball),
      padel: mergeList(base.padel ?? {}, local.sportEquipment.padel, cloud.sportEquipment.padel),
      baseball: mergeList(base.baseball, local.sportEquipment.baseball, cloud.sportEquipment.baseball),
      softball_slow: mergeList(base.softball_slow, local.sportEquipment.softball_slow, cloud.sportEquipment.softball_slow),
      softball_fast: mergeList(base.softball_fast, local.sportEquipment.softball_fast, cloud.sportEquipment.softball_fast),
    },
    training: mergeSingleton(base.training, local.training, cloud.training, presence.training),
    settings: mergeSingleton(base.settings, local.settings, cloud.settings, presence.settings),
    community: mergeSingleton(base.community, local.community, cloud.community, presence.community),
    tutorialProgress: mergeSingleton(base.tutorial, local.tutorialProgress, cloud.tutorialProgress, presence.tutorial),
    agent: mergeSingleton(base.agent, local.agent, cloud.agent, presence.agent),
  };
}
