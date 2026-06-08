'use client';

// ============================================================
// CentralIntelligenceOS — Client memory store (local-first)
// ------------------------------------------------------------
// Reactive localStorage store for the user-scoped intelligence the
// main app store doesn't already track: derived coaching memories,
// consent + privacy preferences, an explicit primary-sport choice,
// the cached (server-confirmed) Founding Member claim, and earned
// achievements. Mirrors the athletic-journey store precedent and can
// later be account-mirrored like BodySync.
//
// PRIVACY: everything here is this user's own data on this device.
// The server is the authority for the Founding member NUMBER; what we
// cache here is only the confirmed result, for instant UI.
// ============================================================

import { useSyncExternalStore } from 'react';
import type { SportId } from '@swingiq/core';
import type { UserMemory } from './types';

const STORAGE_KEY = 'swingvantage_central_intelligence_v1';

export interface ConsentRecord {
  consentType: 'personalization' | 'product_improvement' | 'communications';
  status: 'granted' | 'revoked';
  textVersion: string;
  updatedAt: string;
}

export interface PrivacyPreferences {
  /** Use my data to personalize my own coaching experience. Default ON. */
  personalization: boolean;
  /** Contribute anonymized, aggregated data to improve the product. Default ON. */
  productImprovement: boolean;
}

export interface CachedFoundingClaim {
  memberNumber: number | null;
  status: string;
  qualifiedAt: string | null;
  lastSyncedAt: string;
}

interface CIStoreData {
  memories: UserMemory[];
  consents: ConsentRecord[];
  privacy: PrivacyPreferences;
  primarySportOverride: SportId | null;
  foundingClaim: CachedFoundingClaim | null;
  achievementsEarned: string[];
}

const DEFAULT_PRIVACY: PrivacyPreferences = { personalization: true, productImprovement: true };

const EMPTY: CIStoreData = {
  memories: [],
  consents: [],
  privacy: DEFAULT_PRIVACY,
  primarySportOverride: null,
  foundingClaim: null,
  achievementsEarned: [],
};

let cache: CIStoreData | null = null;
const listeners = new Set<() => void>();

function read(): CIStoreData {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = EMPTY;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw
      ? { ...EMPTY, ...(JSON.parse(raw) as Partial<CIStoreData>), privacy: { ...DEFAULT_PRIVACY, ...(JSON.parse(raw)?.privacy ?? {}) } }
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(mutate: (d: CIStoreData) => CIStoreData): void {
  const next = mutate(read());
  cache = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full / unavailable — keep the in-memory copy.
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React hook: the full reactive CentralIntelligence store snapshot. */
export function useCentralIntelligenceData(): CIStoreData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

// ── Memories ──────────────────────────────────────────────────

export function getMemories(): UserMemory[] {
  return read().memories;
}

/** Persist a derived memory. Dedupes by (memoryType + sport + summary). */
export function saveUserMemory(memory: UserMemory): void {
  write((d) => {
    const isDup = d.memories.some(
      (m) => m.memoryType === memory.memoryType && m.sport === memory.sport && m.summary === memory.summary,
    );
    if (isDup) return d;
    return { ...d, memories: [...d.memories, memory].slice(-500) };
  });
}

export function saveUserMemories(memories: UserMemory[]): void {
  for (const m of memories) saveUserMemory(m);
}

export function clearMemories(): void {
  write((d) => ({ ...d, memories: [] }));
}

// ── Primary sport ─────────────────────────────────────────────

export function getPrimarySportOverride(): SportId | null {
  return read().primarySportOverride;
}

export function setPrimarySportOverride(sport: SportId | null): void {
  write((d) => ({ ...d, primarySportOverride: sport }));
}

// ── Consent + privacy ─────────────────────────────────────────

export function getConsents(): ConsentRecord[] {
  return read().consents;
}

export function recordConsent(
  consentType: ConsentRecord['consentType'],
  status: ConsentRecord['status'],
  textVersion = 'v1',
): void {
  write((d) => ({
    ...d,
    consents: [
      ...d.consents.filter((c) => c.consentType !== consentType),
      { consentType, status, textVersion, updatedAt: new Date().toISOString() },
    ],
  }));
}

export function getPrivacyPreferences(): PrivacyPreferences {
  return read().privacy;
}

export function setPrivacyPreference(key: keyof PrivacyPreferences, value: boolean): void {
  write((d) => ({ ...d, privacy: { ...d.privacy, [key]: value } }));
}

// ── Cached Founding claim (server is the authority) ───────────

export function getCachedFoundingClaim(): CachedFoundingClaim | null {
  return read().foundingClaim;
}

export function setCachedFoundingClaim(claim: CachedFoundingClaim | null): void {
  write((d) => ({ ...d, foundingClaim: claim }));
}

// ── Achievements ──────────────────────────────────────────────

export function hasAchievement(id: string): boolean {
  return read().achievementsEarned.includes(id);
}

export function earnAchievement(id: string): void {
  write((d) =>
    d.achievementsEarned.includes(id)
      ? d
      : { ...d, achievementsEarned: [...d.achievementsEarned, id] },
  );
}

export function getEarnedAchievements(): string[] {
  return read().achievementsEarned;
}

/** Test/maintenance helper — clears all CentralIntelligence local data. */
export function clearCentralIntelligenceStore(): void {
  write(() => EMPTY);
}
