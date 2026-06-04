// ============================================================
// GrowthOS — Display formatting helpers
// ============================================================

/** $1,200 / $0 / — */
export function formatUsd(n: number | null | undefined, opts?: { compact?: boolean }): string {
  if (n === null || n === undefined) return '—';
  if (opts?.compact && Math.abs(n) >= 1000) {
    return `$${formatCompact(n)}`;
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** 0.034 -> "3.4%". Pass already-percent values with `raw: true`. */
export function formatPercent(n: number | null | undefined, opts?: { raw?: boolean; decimals?: number }): string {
  if (n === null || n === undefined) return '—';
  const value = opts?.raw ? n : n * 100;
  return `${value.toFixed(opts?.decimals ?? 1)}%`;
}

/** 12500 -> "12.5K", 2_400_000 -> "2.4M" */
export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** 3 -> "3.0x" */
export function formatMultiple(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1)}x`;
}

/** Short, friendly date. "—" when absent. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "in 3 days", "2 days ago", "today". */
export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/** Convert a kebab/snake enum value into Title Case for display. */
export function humanize(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    // keep common acronyms upper-cased
    .replace(/\b(Seo|Aeo|Geo|Cta|Cac|Roi|Roas|Ai|Crm|Cro|Sms|Pr|Ugc|Ltv|Kpi|Utm)\b/gi, (m) => m.toUpperCase());
}
