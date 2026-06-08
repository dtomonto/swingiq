'use client';

// ============================================================
// CentralIntelligenceOS — Coach Mix: local-first admin store
// ------------------------------------------------------------
// Reactive localStorage store for the admin-authored Coach Mix data:
// custom/overridden coach profiles, approved learning sources, the
// learned-concept review queue, saved mixes, and the active mix.
//
// Mirrors lib/central-intelligence/store.ts (hand-rolled external
// store + useSyncExternalStore). Local-first/keyless like the rest of
// CIOS; a cloud adapter can replace `read`/`write` later without
// touching the engine. Pure helpers (no DOM) live alongside so the
// reducers stay unit-testable.
// ============================================================

import { useSyncExternalStore } from 'react';
import { SEED_COACH_PROFILES } from './seeds';
import { extractConcepts } from './extraction';
import {
  approveConcept,
  archiveConcept,
  editAndApproveConcept,
  markNeedsSourceReview,
  rejectConcept,
} from './review-queue';
import type {
  CoachMix,
  CoachProfile,
  LearnedConcept,
  LearningSource,
  Visibility,
} from './types';
import type { CoachMixVideoConcept } from './video';

const STORAGE_KEY = 'swingvantage_coach_mix_v1';

/** Admin overrides applied on top of the in-code seed profiles. */
export interface ProfileOverride {
  visibility?: Visibility;
  needsReview?: boolean;
  status?: 'active' | 'archived';
}

interface CoachMixStoreData {
  /** Net-new profiles the admin created (seeds live in code, not here). */
  customProfiles: CoachProfile[];
  /** Overrides keyed by profile id (works for seeds and custom alike). */
  profileOverrides: Record<string, ProfileOverride>;
  sources: LearningSource[];
  concepts: LearnedConcept[];
  mixes: CoachMix[];
  activeMixId: string | null;
  videoConcepts: CoachMixVideoConcept[];
}

const EMPTY: CoachMixStoreData = {
  customProfiles: [],
  profileOverrides: {},
  sources: [],
  concepts: [],
  mixes: [],
  activeMixId: null,
  videoConcepts: [],
};

let cache: CoachMixStoreData | null = null;
const listeners = new Set<() => void>();

function read(): CoachMixStoreData {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = EMPTY;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<CoachMixStoreData>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(mutate: (d: CoachMixStoreData) => CoachMixStoreData): void {
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

export function useCoachMixData(): CoachMixStoreData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function newId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
    }
  } catch {
    /* fall through */
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ── Pure helpers (testable without the DOM) ─────────────────

/** Apply an admin override onto a profile (immutable). */
export function applyOverride(profile: CoachProfile, override?: ProfileOverride): CoachProfile {
  if (!override) return profile;
  return {
    ...profile,
    visibility: override.visibility ?? profile.visibility,
    needsReview: override.needsReview ?? profile.needsReview,
    status: override.status ?? profile.status,
  };
}

/** Seeds + custom profiles with overrides applied, in a stable order. */
export function mergeProfiles(
  customProfiles: CoachProfile[],
  overrides: Record<string, ProfileOverride>,
): CoachProfile[] {
  const seeds = SEED_COACH_PROFILES.map((p) => applyOverride(p, overrides[p.id]));
  const custom = customProfiles.map((p) => applyOverride(p, overrides[p.id]));
  return [...seeds, ...custom];
}

// ── Profiles ────────────────────────────────────────────────

export function getAllProfiles(): CoachProfile[] {
  const d = read();
  return mergeProfiles(d.customProfiles, d.profileOverrides);
}

export function setProfileOverride(id: string, patch: ProfileOverride): void {
  write((d) => ({
    ...d,
    profileOverrides: { ...d.profileOverrides, [id]: { ...d.profileOverrides[id], ...patch } },
  }));
}

export function addCustomProfile(profile: CoachProfile): void {
  write((d) => ({ ...d, customProfiles: [...d.customProfiles, profile] }));
}

// ── Sources ─────────────────────────────────────────────────

export function getSources(): LearningSource[] {
  return read().sources;
}

/** Add a source; returns the stored record (with a fresh id). */
export function addSource(input: Omit<LearningSource, 'id' | 'createdAt'>): LearningSource {
  const source: LearningSource = { ...input, id: newId('src'), createdAt: new Date().toISOString() };
  write((d) => ({ ...d, sources: [...d.sources, source] }));
  return source;
}

export function removeSource(id: string): void {
  write((d) => ({
    ...d,
    sources: d.sources.filter((s) => s.id !== id),
    concepts: d.concepts.filter((c) => c.sourceId !== id),
  }));
}

/**
 * Extract concepts from a stored source into the review queue. Returns the
 * concepts added (empty if the source is not cleared to learn from).
 */
export function extractFromSource(sourceId: string): LearnedConcept[] {
  const source = read().sources.find((s) => s.id === sourceId);
  if (!source) return [];
  const extracted = extractConcepts(source);
  if (extracted.length > 0) {
    write((d) => ({ ...d, concepts: [...d.concepts, ...extracted] }));
  }
  return extracted;
}

// ── Review queue ────────────────────────────────────────────

export function getConcepts(): LearnedConcept[] {
  return read().concepts;
}

export type ConceptDecision = 'approve' | 'reject' | 'archive' | 'needs_source_review';

export function decideConcept(id: string, decision: ConceptDecision, editedRewrite?: string): void {
  write((d) => ({
    ...d,
    concepts: d.concepts.map((c) => {
      if (c.id !== id) return c;
      switch (decision) {
        case 'approve':
          return editedRewrite ? editAndApproveConcept(c, editedRewrite) : approveConcept(c);
        case 'reject':
          return rejectConcept(c);
        case 'archive':
          return archiveConcept(c);
        case 'needs_source_review':
          return markNeedsSourceReview(c);
      }
    }),
  }));
}

// ── Mixes ───────────────────────────────────────────────────

export function getMixes(): CoachMix[] {
  return read().mixes;
}

/** Upsert a mix. If it has no id (or a preview id), a real one is assigned. */
export function saveMix(mix: Omit<CoachMix, 'id' | 'createdAt'> & Partial<Pick<CoachMix, 'id' | 'createdAt'>>): CoachMix {
  const existingId = mix.id && mix.id !== 'admin_preview' ? mix.id : undefined;
  const record: CoachMix = {
    ...mix,
    id: existingId ?? newId('mix'),
    createdAt: mix.createdAt ?? new Date().toISOString(),
  };
  write((d) => {
    const without = d.mixes.filter((m) => m.id !== record.id);
    return { ...d, mixes: [...without, record] };
  });
  return record;
}

export function deleteMix(id: string): void {
  write((d) => ({
    ...d,
    mixes: d.mixes.filter((m) => m.id !== id),
    activeMixId: d.activeMixId === id ? null : d.activeMixId,
  }));
}

export function getActiveMixId(): string | null {
  return read().activeMixId;
}

export function setActiveMixId(id: string | null): void {
  write((d) => ({ ...d, activeMixId: id }));
}

export function getActiveMix(): CoachMix | null {
  const d = read();
  return d.mixes.find((m) => m.id === d.activeMixId) ?? null;
}

// ── Video concepts ──────────────────────────────────────────

export function getVideoConcepts(): CoachMixVideoConcept[] {
  return read().videoConcepts;
}

export function addVideoConcept(concept: CoachMixVideoConcept): void {
  write((d) => ({ ...d, videoConcepts: [concept, ...d.videoConcepts] }));
}

export function setVideoConceptStatus(id: string, status: CoachMixVideoConcept['approvalStatus']): void {
  write((d) => ({
    ...d,
    videoConcepts: d.videoConcepts.map((v) => (v.id === id ? { ...v, approvalStatus: status } : v)),
  }));
}

export function removeVideoConcept(id: string): void {
  write((d) => ({ ...d, videoConcepts: d.videoConcepts.filter((v) => v.id !== id) }));
}

/** Test/maintenance helper — clears all Coach Mix local data. */
export function clearCoachMixStore(): void {
  write(() => EMPTY);
}
