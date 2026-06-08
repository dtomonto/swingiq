// ============================================================
// SwingVantage Admin — Audit Reports: the audit registry
// ------------------------------------------------------------
// Single source of truth for WHICH internal audits exist, what each
// one does, how often it runs, and where its report lands. Mirrors
// docs/scheduled-audits-registry.md so adding a new audit later is a
// one-entry change here (the hub + Command Center read from this).
//
// The dynamic bits (last-run date, latest report path, findings) come
// from the synced snapshot in data.ts — this file is static metadata.
// ============================================================

export interface AuditDefinition {
  /** Stable id, also the docs/audits/<reportCategory> folder when scheduled. */
  id: string;
  /** Short human label. */
  label: string;
  /** Plain-English "what this audit checks / produces". */
  blurb: string;
  /** Display cadence ("Monthly", "Weekly", "On commit", …). */
  cadence: string;
  /** Cron expression when scheduled (for computing the next run); null if not. */
  cron: string | null;
  /** The docs/audits/<category> folder this audit writes to, if any. */
  reportCategory?: string;
  /** A deep link to the live tool this audit feeds, when one exists. */
  href?: string;
}

/**
 * The audits, in the order the hub shows them. Kept in lock-step with
 * docs/scheduled-audits-registry.md.
 */
export const AUDITS: AuditDefinition[] = [
  {
    id: 'seo-aeo-geo',
    label: 'SEO / AEO / GEO',
    blurb:
      'Fixes safe technical SEO, enhances existing pages, and drafts (never publishes) new content for search & AI answer engines.',
    cadence: 'Monthly',
    cron: '7 9 1 * *',
    reportCategory: 'seo-aeo-geo',
    href: '/admin/seo',
  },
  {
    id: 'ai-features',
    label: 'AI features',
    blurb:
      'Audits and improves every AI surface — video-vision, AI Coach/agents, prompts, model IDs, fallbacks, AI security and honest capability copy.',
    cadence: 'Monthly',
    cron: '23 8 1 * *',
    reportCategory: 'ai-features',
    href: '/admin/ai-analyses',
  },
  {
    id: 'engagement',
    label: 'Engagement / retention',
    blurb:
      'Audits the "Today’s Fix" engagement layer (framing copy, Swing Passport, ethical streaks, comeback flows, challenges) and checks for dark patterns.',
    cadence: 'Monthly',
    cron: '39 9 1 * *',
    reportCategory: 'engagement',
  },
  {
    id: 'build-health',
    label: 'Build / CI health',
    blurb:
      'Checks GitHub PRs + failing CI and local type-check / lint / build; fixes safe breakages so the tree stays healthy.',
    cadence: 'Weekly (Mondays)',
    cron: '47 8 * * 1',
    reportCategory: 'build-health',
  },
  {
    id: 'security',
    label: 'Security',
    blurb:
      'Gitleaks secret scan, npm audit (fails on critical), lint/type-check and the custom security scanner — every push + weekly.',
    cadence: 'Every push + weekly',
    cron: null,
    href: '/admin/security',
  },
  {
    id: 'master',
    label: 'Master report',
    blurb:
      'Merges every audit above into ONE executive report + at-a-glance dashboard + machine-readable JSON. Runs last.',
    cadence: 'Monthly',
    cron: '0 11 1 * *',
  },
];

export const findAudit = (id: string): AuditDefinition | undefined =>
  AUDITS.find((a) => a.id === id);

// ── next-run from cron (minute hour day-of-month month day-of-week) ──────────
// Deliberately small: supports the few fields our crons use (numbers, '*',
// and a numeric day-of-week / day-of-month). Returns null when it can't tell.

function nextFromCron(cron: string, from: Date): Date | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minRaw, hourRaw, domRaw, , dowRaw] = parts;
  const minute = Number(minRaw);
  const hour = Number(hourRaw);
  if (!Number.isFinite(minute) || !Number.isFinite(hour)) return null;

  // Monthly on a fixed day-of-month (e.g. "7 9 1 * *").
  if (domRaw !== '*' && Number.isFinite(Number(domRaw))) {
    const dom = Number(domRaw);
    const candidate = new Date(from.getFullYear(), from.getMonth(), dom, hour, minute, 0, 0);
    if (candidate > from) return candidate;
    return new Date(from.getFullYear(), from.getMonth() + 1, dom, hour, minute, 0, 0);
  }

  // Weekly on a fixed day-of-week (e.g. "47 8 * * 1" = Mondays).
  if (dowRaw !== '*' && Number.isFinite(Number(dowRaw))) {
    const dow = Number(dowRaw) % 7;
    const candidate = new Date(from);
    candidate.setHours(hour, minute, 0, 0);
    const dayDiff = (dow - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + dayDiff);
    if (candidate <= from) candidate.setDate(candidate.getDate() + 7);
    return candidate;
  }

  return null;
}

/** Next scheduled run for an audit, or null if it isn't time-scheduled. */
export function nextRun(audit: AuditDefinition, from: Date = new Date()): Date | null {
  return audit.cron ? nextFromCron(audit.cron, from) : null;
}
