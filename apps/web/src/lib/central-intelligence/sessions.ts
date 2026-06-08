// ============================================================
// CentralIntelligenceOS — Valid-session engine (pure)
// ------------------------------------------------------------
// Defines what counts as a "valid session" for coaching memory AND
// for Founding Fathers qualification. A session only counts when it
// carries enough real data to improve the experience — abandoned,
// empty, failed, or duplicate entries never inflate the count.
//
// Sources supported today: manual entry, video analysis, image import,
// launch-monitor / simulator import (FS Golf, GSPro, E6, …). New
// sources slot in by mapping onto SessionLike / VideoAnalysisLike.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { SessionSource, SessionSummaryForMemory, SessionValidity } from './types';

/** Narrow view of a stored practice session (store LocalSession superset). */
export interface SessionLike {
  id: string;
  sport: SportId;
  name?: string;
  date?: string;
  created_at?: string;
  launch_monitor?: string;
  shot_count?: number;
  shots?: unknown[];
  diagnoses?: unknown[];
  swing_score?: number | null;
}

/** Narrow view of a stored video analysis (store LocalVideoAnalysis superset). */
export interface VideoAnalysisLike {
  id: string;
  session_id?: string | null;
  sport: SportId;
  file_name?: string;
  overall_score?: number;
  phases_count?: number;
  primary_issue?: string | null;
  created_at?: string;
}

export interface SessionInputs {
  sessions: SessionLike[];
  videoAnalyses: VideoAnalysisLike[];
}

function sessionSource(s: SessionLike): SessionSource {
  const lm = (s.launch_monitor ?? '').trim().toLowerCase();
  if (lm && lm !== 'none' && lm !== 'manual') return 'launch_monitor';
  return 'manual';
}

/**
 * A practice session is valid when it holds usable swing data: recorded
 * shots, a completed diagnosis, or a computed swing score. A bare row with
 * a name and zero data does not count.
 */
export function isValidSession(s: SessionLike): SessionValidity {
  const shotCount = s.shot_count ?? s.shots?.length ?? 0;
  const hasShots = shotCount > 0;
  const hasDiagnosis = (s.diagnoses?.length ?? 0) > 0;
  const hasScore = s.swing_score !== null && s.swing_score !== undefined;
  const source = sessionSource(s);

  if (hasShots || hasDiagnosis || hasScore) {
    const bits = [
      hasShots ? `${shotCount} shot${shotCount === 1 ? '' : 's'}` : null,
      hasDiagnosis ? 'diagnosis' : null,
      hasScore ? 'swing score' : null,
    ].filter(Boolean);
    return { valid: true, reason: `Has ${bits.join(' + ')}.`, source };
  }
  return { valid: false, reason: 'No usable swing data (empty or abandoned).', source };
}

/** A video analysis is valid when the analysis actually completed. */
export function isValidVideoAnalysis(v: VideoAnalysisLike): SessionValidity {
  const completed = (v.overall_score ?? 0) > 0 || (v.phases_count ?? 0) > 0;
  return completed
    ? { valid: true, reason: 'Completed video analysis.', source: 'video' }
    : { valid: false, reason: 'Video analysis did not complete.', source: 'video' };
}

/**
 * Count valid sessions for campaign qualification. Practice sessions and
 * STANDALONE video analyses each count once; a video analysis already tied
 * to a counted session is not double-counted (it's the same work unit).
 */
export function getValidSessionCount(inputs: SessionInputs): number {
  const validSessions = inputs.sessions.filter((s) => isValidSession(s).valid).length;
  const validStandaloneVideos = inputs.videoAnalyses.filter(
    (v) => !v.session_id && isValidVideoAnalysis(v).valid,
  ).length;
  return validSessions + validStandaloneVideos;
}

/** A per-source breakdown of valid sessions (for the admin Session Intelligence panel). */
export function getValidSessionBreakdown(inputs: SessionInputs): Record<SessionSource, number> {
  const out: Record<SessionSource, number> = {
    manual: 0, video: 0, image: 0, launch_monitor: 0, simulator: 0, practice: 0,
  };
  for (const s of inputs.sessions) {
    const v = isValidSession(s);
    if (v.valid) out[v.source] += 1;
  }
  for (const v of inputs.videoAnalyses) {
    if (!v.session_id && isValidVideoAnalysis(v).valid) out.video += 1;
  }
  return out;
}

/** Normalize a session into a one-line summary the coaching memory can store. */
export function summarizeSessionForMemory(s: SessionLike): SessionSummaryForMemory {
  const validity = isValidSession(s);
  const shotCount = s.shot_count ?? s.shots?.length ?? 0;
  const headline = validity.valid
    ? `${s.name || 'Session'} — ${shotCount} shots${s.swing_score != null ? `, score ${s.swing_score}` : ''}`
    : `${s.name || 'Session'} — no usable data`;
  return {
    id: s.id,
    sport: s.sport,
    source: validity.source,
    date: s.date || s.created_at || '',
    headline,
    primaryIssue: null,
    score: s.swing_score ?? null,
    shotCount,
  };
}
