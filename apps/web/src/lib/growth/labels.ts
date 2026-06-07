// ============================================================
// GrowthOS — Label + badge configuration
// ------------------------------------------------------------
// Maps enum values to display labels and Tailwind badge classes using
// the existing admin dark palette (gray-950/900/800 + accent tints).
// Keeping this here means every module badges things identically.
// ============================================================

import type { DataSource } from './types';
import type { PriorityBand } from './scoring';

export interface BadgeStyle {
  label: string;
  /** Tailwind classes for text + bg tint + border. */
  className: string;
}

// ── Data source — the honesty layer ───────────────────────────
export const DATA_SOURCE_BADGE: Record<DataSource, BadgeStyle> = {
  real:        { label: 'Real',        className: 'text-green-400 bg-green-400/10 border-green-400/30' },
  imported:    { label: 'Imported',    className: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  estimated:   { label: 'Estimated',   className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  placeholder: { label: 'Placeholder', className: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  mock:        { label: 'Demo data',   className: 'text-gray-400 bg-gray-400/10 border-gray-500/30' },
};

// ── Priority bands ────────────────────────────────────────────
export const PRIORITY_BADGE: Record<PriorityBand, BadgeStyle> = {
  critical: { label: 'Critical', className: 'text-red-400 bg-red-400/10 border-red-400/30' },
  high:     { label: 'High',     className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  medium:   { label: 'Medium',   className: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  low:      { label: 'Low',      className: 'text-gray-400 bg-gray-400/10 border-gray-500/30' },
};

/**
 * Generic status -> badge class. Statuses across modules fall into a few
 * semantic buckets (positive / active / warning / negative / neutral); we
 * match on substrings so every module's status enum is covered without a
 * giant per-enum table.
 */
export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  // positive / done
  if (/(done|published|completed|live|won|active|granted|approved|scaled|activated|advocate)/.test(s)) {
    return 'text-green-400 bg-green-400/10 border-green-400/30';
  }
  // in motion
  if (/(running|in-progress|in progress|negotiating|measuring|scheduled|ready|pitched|contacted|researching|reactivated)/.test(s)) {
    return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
  }
  // warning / needs attention
  if (/(paused|at-risk|at risk|refresh|review|blocked|past-due|underdeveloped|prioritized|pending|unknown|draft|brief)/.test(s)) {
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  }
  // negative / dead
  if (/(churned|declined|denied|stopped|rejected|inconclusive|unusable|cancelled|sunset|expired|overfunded)/.test(s)) {
    return 'text-red-400 bg-red-400/10 border-red-400/30';
  }
  // neutral (idea, draft, archived, todo, …)
  return 'text-gray-400 bg-gray-400/10 border-gray-500/30';
}

/** Scale -> badge class (confidence, relevance, risk inputs). */
export function scaleBadgeClass(scale: string): string {
  const s = scale.toLowerCase();
  if (s === 'high') return 'text-green-400 bg-green-400/10 border-green-400/30';
  if (s === 'medium') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  return 'text-gray-400 bg-gray-400/10 border-gray-500/30';
}
