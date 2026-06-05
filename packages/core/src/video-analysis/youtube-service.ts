// ============================================================
// SwingVantage — YouTube Search Service
// Generates YouTube SEARCH links (never hardcoded video IDs).
// Privacy-safe: no YouTube API keys, no tracking beyond standard
// Google search referrals.
// ============================================================

import type { SwingPhase } from '../types';
import type { VisualIssueId } from './types';

const YT_BASE = 'https://www.youtube.com/results?search_query=';

/** Build a YouTube search URL from a plain-English query string. */
export function buildYouTubeSearchUrl(query: string): string {
  return YT_BASE + encodeURIComponent(query);
}

// ──────────────────────────────────────────────────────────────
// Phase-specific default search queries
// ──────────────────────────────────────────────────────────────

const PHASE_SEARCH_QUERIES: Record<SwingPhase, string> = {
  setup_address: 'golf setup and address fundamentals instruction',
  takeaway: 'golf takeaway drill correct backswing start',
  club_parallel_back: 'golf P3 position backswing club parallel ground',
  lead_arm_parallel: 'golf P4 halfway back lead arm parallel',
  top_of_backswing: 'top of backswing position golf instruction',
  transition: 'golf swing transition downswing start sequence',
  lead_arm_parallel_downswing: 'golf P6 downswing lead arm parallel',
  shaft_parallel_downswing: 'golf P7 delivery position shaft parallel downswing',
  impact: 'golf impact position correct hands ahead ball',
  post_impact: 'golf post impact extension follow through',
  finish: 'golf finish position balance full swing',
};

/** Get a YouTube search URL for a given swing phase. */
export function getPhaseSearchUrl(phase: SwingPhase): string {
  return buildYouTubeSearchUrl(PHASE_SEARCH_QUERIES[phase]);
}

// ──────────────────────────────────────────────────────────────
// Issue-specific default search queries
// ──────────────────────────────────────────────────────────────

const ISSUE_SEARCH_QUERIES: Partial<Record<VisualIssueId, string>> = {
  early_extension: 'fix early extension golf swing drill',
  sway_slide: 'fix lateral sway golf backswing drill',
  reverse_pivot: 'fix reverse pivot golf weight transfer',
  casting: 'fix casting golf swing lag drill',
  chicken_winging: 'fix chicken wing lead arm golf impact',
  over_the_top: 'fix over the top golf swing inside approach',
  flying_elbow: 'fix flying trail elbow golf backswing',
  head_movement_excessive: 'fix head movement golf swing stable head',
  weight_forward_setup: 'golf setup weight distribution fix',
  grip_too_strong_visual: 'golf grip too strong fix neutral grip',
  grip_too_weak_visual: 'golf weak grip fix instruction',
  open_stance: 'fix open stance golf alignment',
  closed_stance: 'fix closed stance golf alignment',
  ball_position_forward: 'golf ball position too far forward fix',
  ball_position_back: 'golf ball position too far back fix',
  poor_spine_angle: 'fix spine angle golf setup posture',
  flat_backswing: 'fix flat backswing golf swing plane',
  steep_backswing: 'fix steep backswing golf shallow swing',
  short_backswing: 'golf short backswing how to turn more',
  overswing: 'fix overswing golf past parallel',
  loss_of_posture: 'fix loss of posture golf spine angle',
  slide_through_impact: 'fix lateral slide impact golf rotation',
};

/** Get a YouTube search URL for a given visual swing issue. */
export function getIssueSearchUrl(issueId: VisualIssueId): string {
  const query = ISSUE_SEARCH_QUERIES[issueId] ?? `fix ${issueId.replace(/_/g, ' ')} golf swing`;
  return buildYouTubeSearchUrl(query);
}

/** Build a contextual YouTube search URL combining issue + camera angle context. */
export function buildContextualSearchUrl(
  issueId: VisualIssueId,
  phase: SwingPhase,
  _cameraAngle?: string,
): string {
  const issueQuery = ISSUE_SEARCH_QUERIES[issueId] ?? `${issueId.replace(/_/g, ' ')} golf fix`;
  const phaseLabel = phase.replace(/_/g, ' ');
  const combined = `${issueQuery} ${phaseLabel}`;
  return buildYouTubeSearchUrl(combined);
}
