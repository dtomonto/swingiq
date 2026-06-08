'use client';

// ============================================================
// SwingVantage — usePriorityResult (read-only)
// ------------------------------------------------------------
// A reactive view of the athlete's synthesized priorities (lib/priority/engine)
// for any consumer that wants the #1 thing to work on — e.g. the dashboard
// IntentPicker — WITHOUT owning the snapshot side-effect. PriorityPanel remains
// the single writer of priority snapshots; this hook only reads.
//
// NOTE: the input shaping below intentionally mirrors PriorityPanel so both see
// the same priorities. If you change one, change the other (or unify later).
// ============================================================
import { useMemo, useRef } from 'react';
import { useSwingVantageStore } from '@/store';
import { analyzeClubGaps, type ClubGapInput } from '@swingiq/core';
import {
  computeAthletePriorities,
  type PrioritySessionInput,
  type DiagnosisLike,
} from './engine';
import type { PriorityResult } from './types';

/** Minimal session shape this reads — store sessions are structurally compatible. */
export interface StoreSessionLike {
  id: string;
  date?: string;
  created_at: string;
  sport?: string | null;
  diagnoses?: DiagnosisLike[];
  shots?: { club_data?: { face_to_path?: number | null; club_path?: number | null } }[];
}

/**
 * Pure: pick the golf sessions (golf or untagged) the priority engine works on,
 * shape them, and report whether any carried club/face data. Extracted so it can
 * be unit-tested without the store.
 */
export function selectGolfSessions(sessions: StoreSessionLike[]): {
  prioritySessions: PrioritySessionInput[];
  hasClubFaceData: boolean;
} {
  const golf = sessions.filter((s) => s.sport === 'golf' || !s.sport);
  const prioritySessions = golf.map((s) => ({
    id: s.id,
    date: s.date || s.created_at,
    diagnoses: s.diagnoses ?? [],
  }));
  const hasClubFaceData = golf.some((s) =>
    s.shots?.some((sh) => sh.club_data?.face_to_path != null || sh.club_data?.club_path != null),
  );
  return { prioritySessions, hasClubFaceData };
}

/** Reactive, read-only priority result. Does NOT record snapshots. */
export function usePriorityResult(): PriorityResult {
  const sessions = useSwingVantageStore((s) => s.sessions);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);
  const snapshots = useSwingVantageStore((s) => s.prioritySnapshots);

  // Compare against the snapshot from the previous visit (captured once).
  const previousRef = useRef(snapshots[snapshots.length - 1] ?? null);

  return useMemo(() => {
    const { prioritySessions, hasClubFaceData } = selectGolfSessions(sessions);
    const gapInputs: ClubGapInput[] = clubs.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      typical_carry: c.typical_carry,
      sort_order: c.sort_order,
    }));
    const gap = clubs.length >= 2 ? analyzeClubGaps(gapInputs) : null;
    const videoIssues = videoAnalyses
      .filter((v) => !!v.primary_issue)
      .map((v) => ({ issue: v.primary_issue as string, date: v.created_at }));

    return computeAthletePriorities({
      sessions: prioritySessions,
      videoIssues,
      gapping: gap ? { grade: gap.overall_grade, summary: gap.summary } : null,
      hasClubFaceData,
      previous: previousRef.current,
    });
  }, [sessions, clubs, videoAnalyses]);
}
