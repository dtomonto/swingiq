// ============================================================
// SwingVantage Admin — Action Center: shared types
// ------------------------------------------------------------
// The Action Center (/admin/approvals) is the single "what needs me"
// inbox. It does NOT reimplement any tool — it asks each existing tool,
// via a thin adapter, "what of yours needs the owner right now?" and
// renders one tidy list that deep-links back to the native surface.
// ============================================================

export type ActionSeverity = 'info' | 'success' | 'warning' | 'critical';

/** One thing (or batch of things) that needs the owner's attention. */
export interface ActionItem {
  /** Unique across all sources, e.g. 'feature-education:needs-review'. */
  id: string;
  /** Adapter id, e.g. 'feature-education'. */
  source: string;
  /** Human label for the source, e.g. 'Feature Education'. */
  sourceLabel: string;
  /** Short headline, e.g. '3 learning drafts await review'. */
  title: string;
  /** Optional one-line context. */
  detail?: string;
  severity: ActionSeverity;
  /** How many underlying items (drives the count badge + totals). */
  count: number;
  /** Deep link to the native tool that actually handles this. */
  href: string;
  /** CTA label, e.g. 'Review'. */
  cta?: string;
}

/** A source that can report its pending work to the Action Center. */
export interface ActionSourceAdapter {
  id: string;
  label: string;
  /**
   * Collect current action items. MUST be defensive (never throw) — the
   * collector wraps it in try/catch, but adapters should degrade to [].
   */
  collect: () => Promise<ActionItem[]> | ActionItem[];
}

const SEVERITY_RANK: Record<ActionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

/** Sort by severity (critical first), then larger counts, then source. */
export function compareActionItems(a: ActionItem, b: ActionItem): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    b.count - a.count ||
    a.source.localeCompare(b.source)
  );
}

/** Roll-up numbers for the inbox header + Command Center alert. */
export interface ActionSummary {
  /** Number of distinct rows. */
  items: number;
  /** Sum of every row's underlying count — the honest "things" total. */
  total: number;
  /** True when anything is critical. */
  hasCritical: boolean;
}

export function summarizeActions(items: ActionItem[]): ActionSummary {
  return {
    items: items.length,
    total: items.reduce((n, i) => n + Math.max(0, i.count), 0),
    hasCritical: items.some((i) => i.severity === 'critical'),
  };
}
