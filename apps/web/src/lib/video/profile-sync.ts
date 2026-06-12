'use client';

// ============================================================
// SwingVantage — Swing analysis → profile bridge
// ------------------------------------------------------------
// When an AI video analysis completes, this records it as a swing
// on the user's PROFILE: a metadata row in the account-synced
// Zustand `video_analyses` slice (store key `swingiq-store`). That
// store is reconciled to the Supabase `video_analyses` table by the
// relational sync provider when a user is signed in, so each swing
// becomes durable, cross-device, per-profile history (an account
// can hold an unbounded number — well past 10).
//
// Before this bridge existed, `addVideoAnalysis` had no caller, so
// the synced slice stayed empty: the non-golf dashboard's "Recent
// Analyses" always showed "No video analyses yet" even right after a
// successful analysis, and nothing about a swing ever reached the
// account. The full text analysis + replay clip remain device-local
// by privacy design (see history.ts / clip-store.ts); only honest
// summary metadata is recorded here — never a fabricated score.
// ============================================================

import { useSwingVantageStore, type LocalVideoAnalysis } from '@/store';
import type { AIVisualAnalysis, VisualSport } from '@swingiq/core';

export interface AnalysisProfileSyncInput {
  sport: VisualSport;
  /** Original file name, used as the swing's display label on the dashboard. */
  fileName?: string;
  declaredCameraAngle?: string;
  analysis: AIVisualAnalysis;
}

/**
 * Map a completed analysis onto the profile's swing-history metadata shape.
 * Exported for unit testing the field derivation independently of the store.
 *
 * `overall_score` is intentionally 0: vision analysis produces no swing score
 * (only `overallConfidence`, which measures certainty, not quality). The
 * dashboard hides a 0 score rather than show a misleading number — keeping the
 * "never fabricate data" rule. The honest signals carried are the primary
 * issue, phases observed, issue count, sport, camera angle and timestamp.
 */
export function buildProfileVideoAnalysis(
  input: AnalysisProfileSyncInput,
): Omit<LocalVideoAnalysis, 'id' | 'created_at'> {
  const { analysis } = input;
  return {
    session_id: null,
    sport: input.sport,
    file_name: input.fileName?.trim() || `${input.sport} swing`,
    overall_score: 0,
    camera_angle: input.declaredCameraAngle ?? '',
    phases_count: analysis.detectedPhases?.length ?? 0,
    issues_count: analysis.topPriorities?.length ?? 0,
    primary_issue: analysis.topPriorities?.[0]?.issue ?? null,
    // The full validated analysis — persisted on the profile (Supabase
    // `video_analyses.analysis` jsonb) so the complete historical data from the
    // swing, not just its summary, stays on the account across devices.
    analysis,
  };
}

/**
 * Record a completed analysis as a swing on the user's profile. Best-effort:
 * a store failure must never fail the analysis, so this swallows errors and is
 * safe to call from the (non-React) background-task pipeline via the store's
 * vanilla `getState()` accessor.
 */
export function syncAnalysisToProfile(input: AnalysisProfileSyncInput): void {
  try {
    useSwingVantageStore.getState().addVideoAnalysis(buildProfileVideoAnalysis(input));
  } catch {
    // non-critical — the swing still lives in local history + IndexedDB clip
  }
}
