'use client';

// ============================================================
// SwingVantage — Athletic Journey: local persistence
// ------------------------------------------------------------
// Self-contained, reactive localStorage store for the journey-only
// inputs the main app store doesn't already track: optional ratings,
// self-assessments, completed milestones, in-development sport
// interest, athlete-entered profile extras, and the stage/momentum
// history timeline. Reads the MAIN store read-only via adapters;
// this never mutates app state. Mirrors the AGI history/commitment
// precedent. Account-sync can later mirror this key like BodySync.
// ============================================================

import { useSyncExternalStore } from 'react';
import type { SportId } from '@swingiq/core';
import type {
  JourneyProfileExtra,
  JourneySnapshot,
  PlayerRating,
  RatingType,
  SelfAssessment,
  SportInterest,
  SportInterestType,
} from './types';

const STORAGE_KEY = 'swingvantage_athletic_journey_v1';

interface JourneyStoreData {
  ratings: PlayerRating[];
  selfAssessments: Partial<Record<SportId, SelfAssessment[]>>;
  completedMilestones: Partial<Record<SportId, string[]>>;
  interests: SportInterest[];
  profileExtras: Partial<Record<SportId, JourneyProfileExtra>>;
  history: Partial<Record<SportId, JourneySnapshot[]>>;
}

const EMPTY: JourneyStoreData = {
  ratings: [],
  selfAssessments: {},
  completedMilestones: {},
  interests: [],
  profileExtras: {},
  history: {},
};

let cache: JourneyStoreData | null = null;
const listeners = new Set<() => void>();

function read(): JourneyStoreData {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = EMPTY;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<JourneyStoreData>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(mutate: (d: JourneyStoreData) => JourneyStoreData): void {
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

// ── Reactive subscription (useSyncExternalStore) ──────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React hook: the full reactive journey-store snapshot. */
export function useJourneyStoreData(): JourneyStoreData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

// ── Ratings ───────────────────────────────────────────────────

export function getRatings(): PlayerRating[] {
  return read().ratings;
}

export function getRating(sport: SportId, type: RatingType): PlayerRating | null {
  return read().ratings.find((r) => r.sport === sport && r.ratingType === type) ?? null;
}

/** Insert or replace a rating of the same sport + type. */
export function upsertRating(rating: PlayerRating): void {
  write((d) => ({
    ...d,
    ratings: [
      ...d.ratings.filter((r) => !(r.sport === rating.sport && r.ratingType === rating.ratingType)),
      rating,
    ],
  }));
}

export function removeRating(sport: SportId, type: RatingType): void {
  write((d) => ({
    ...d,
    ratings: d.ratings.filter((r) => !(r.sport === sport && r.ratingType === type)),
  }));
}

// ── Self-assessments ──────────────────────────────────────────

export function getSelfAssessments(sport: SportId): SelfAssessment[] {
  return read().selfAssessments[sport] ?? [];
}

export function setSelfAssessment(sport: SportId, branchId: string, rating: number): void {
  write((d) => {
    const current = d.selfAssessments[sport] ?? [];
    const next = [
      ...current.filter((a) => a.branchId !== branchId),
      { branchId, rating, dateRecorded: new Date().toISOString() },
    ];
    return { ...d, selfAssessments: { ...d.selfAssessments, [sport]: next } };
  });
}

// ── Milestones ────────────────────────────────────────────────

export function getCompletedMilestones(sport: SportId): string[] {
  return read().completedMilestones[sport] ?? [];
}

export function toggleMilestone(sport: SportId, id: string): void {
  write((d) => {
    const current = d.completedMilestones[sport] ?? [];
    const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
    return { ...d, completedMilestones: { ...d.completedMilestones, [sport]: next } };
  });
}

// ── In-development sport interest ─────────────────────────────

export function getInterests(): SportInterest[] {
  return read().interests;
}

export function hasInterest(sport: SportId, type: SportInterestType): boolean {
  return read().interests.some((i) => i.sport === sport && i.interestType === type);
}

export function addInterest(sport: SportId, interestType: SportInterestType): void {
  if (hasInterest(sport, interestType)) return;
  write((d) => ({
    ...d,
    interests: [...d.interests, { sport, interestType, createdAt: new Date().toISOString() }],
  }));
}

// ── Athlete-entered profile extras ────────────────────────────

export function getProfileExtra(sport: SportId): JourneyProfileExtra {
  return read().profileExtras[sport] ?? {};
}

export function setProfileExtra(sport: SportId, patch: Partial<JourneyProfileExtra>): void {
  write((d) => ({
    ...d,
    profileExtras: { ...d.profileExtras, [sport]: { ...(d.profileExtras[sport] ?? {}), ...patch } },
  }));
}

// ── Stage / momentum history ──────────────────────────────────

export function getHistory(sport: SportId): JourneySnapshot[] {
  return read().history[sport] ?? [];
}

/** Record today's snapshot (dedupes per calendar day; keeps last 180). */
export function recordSnapshot(sport: SportId, snap: JourneySnapshot): void {
  // Idempotent: if today's snapshot is already stored with identical values,
  // do nothing. A write here creates a NEW store reference and notifies every
  // subscriber. Because useAthleticJourney records the snapshot from an effect
  // that also reads this store, a needless write re-triggers that effect and
  // spins an infinite render loop (React error #185). Skipping the no-op write
  // keeps the store reference stable when nothing has changed.
  const today = (read().history[sport] ?? []).find((s) => s.date === snap.date);
  if (
    today &&
    today.stageCode === snap.stageCode &&
    today.stageOrder === snap.stageOrder &&
    today.momentum === snap.momentum &&
    today.confidence === snap.confidence
  ) {
    return;
  }
  write((d) => {
    const current = d.history[sport] ?? [];
    const withoutToday = current.filter((s) => s.date !== snap.date);
    const next = [...withoutToday, snap].slice(-180);
    return { ...d, history: { ...d.history, [sport]: next } };
  });
}

/** Test/maintenance helper — clears all journey-local data. */
export function clearJourneyStore(): void {
  write(() => EMPTY);
}
