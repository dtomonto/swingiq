'use client';

// ============================================================
// CentralIntelligenceOS — Coach Mix: user coaching preference
// ------------------------------------------------------------
// The athlete's own "Preferred Coaching Style" choice. Local-first
// (localStorage), reactive via useSyncExternalStore — mirrors the
// admin coach-mix store. Pure helpers are exported for unit tests.
//
// This is the USER's choice only; it never reads or writes admin data.
// ============================================================

import { useSyncExternalStore } from 'react';
import { DEFAULT_USER_STYLE_ID, getUserStyle, type UserCoachingStyle } from './user-styles';

const STORAGE_KEY = 'swingvantage_user_coaching_style_v1';

interface UserPrefData {
  /** The chosen UserCoachingStyle id, or null for "use the default". */
  styleId: string | null;
}

const EMPTY: UserPrefData = { styleId: null };

let cache: UserPrefData | null = null;
const listeners = new Set<() => void>();

function read(): UserPrefData {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = EMPTY;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<UserPrefData>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: UserPrefData): void {
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

/** Normalize a stored id to a known style id (falls back to default). */
export function normalizeStyleId(styleId: string | null | undefined): string {
  return getUserStyle(styleId).id;
}

export interface UseUserCoachingStyle {
  /** The chosen style id, or null when none chosen yet. */
  styleId: string | null;
  /** The resolved style object (always defined — defaults when unset). */
  style: UserCoachingStyle;
  /** Persist a new choice. `null` clears back to the default. */
  setStyleId: (id: string | null) => void;
}

export function useUserCoachingStyle(): UseUserCoachingStyle {
  const data = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    styleId: data.styleId,
    style: getUserStyle(data.styleId ?? DEFAULT_USER_STYLE_ID),
    setStyleId: (id) => write({ styleId: id }),
  };
}

/** Non-hook reader (e.g. for analytics or SSR-safe defaults). */
export function getUserStyleId(): string | null {
  return read().styleId;
}

/** Test/maintenance helper. */
export function clearUserCoachingStyle(): void {
  write(EMPTY);
}
