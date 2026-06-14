// ============================================================
// GrowthOS — Label + badge configuration
// ------------------------------------------------------------
// Maps enum values to display labels and Tailwind badge classes built
// from SEMANTIC THEME TOKENS (not raw gray/green/amber palette), so the
// badges stay WCAG-AA legible in every theme — including the light Coach
// Mode the admin renders in. Foregrounds use the `*-text` accents (tuned
// per theme to clear AA on background/card); fills/borders use the matching
// status token at low alpha. Keeping this here means every module badges
// things identically.
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
  real:        { label: 'Real',        className: 'text-success-text bg-success/10 border-success/30' },
  imported:    { label: 'Imported',    className: 'text-link bg-link/10 border-link/30' },
  estimated:   { label: 'Estimated',   className: 'text-warning-text bg-warning/10 border-warning/30' },
  placeholder: { label: 'Placeholder', className: 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/30' },
  mock:        { label: 'Demo data',   className: 'text-muted-foreground bg-muted border-border' },
};

// ── Priority bands ────────────────────────────────────────────
export const PRIORITY_BADGE: Record<PriorityBand, BadgeStyle> = {
  critical: { label: 'Critical', className: 'text-error-text bg-error/10 border-error/30' },
  high:     { label: 'High',     className: 'text-warning-text bg-warning/10 border-warning/30' },
  medium:   { label: 'Medium',   className: 'text-link bg-link/10 border-link/30' },
  low:      { label: 'Low',      className: 'text-muted-foreground bg-muted border-border' },
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
    return 'text-success-text bg-success/10 border-success/30';
  }
  // in motion
  if (/(running|in-progress|in progress|negotiating|measuring|scheduled|ready|pitched|contacted|researching|reactivated)/.test(s)) {
    return 'text-link bg-link/10 border-link/30';
  }
  // warning / needs attention
  if (/(paused|at-risk|at risk|refresh|review|blocked|past-due|underdeveloped|prioritized|pending|unknown|draft|brief)/.test(s)) {
    return 'text-warning-text bg-warning/10 border-warning/30';
  }
  // negative / dead
  if (/(churned|declined|denied|stopped|rejected|inconclusive|unusable|cancelled|sunset|expired|overfunded)/.test(s)) {
    return 'text-error-text bg-error/10 border-error/30';
  }
  // neutral (idea, draft, archived, todo, …)
  return 'text-muted-foreground bg-muted border-border';
}

/** Scale -> badge class (confidence, relevance, risk inputs). */
export function scaleBadgeClass(scale: string): string {
  const s = scale.toLowerCase();
  if (s === 'high') return 'text-success-text bg-success/10 border-success/30';
  if (s === 'medium') return 'text-warning-text bg-warning/10 border-warning/30';
  return 'text-muted-foreground bg-muted border-border';
}
