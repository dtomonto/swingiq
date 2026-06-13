// ============================================================
// SwingVantage — First-Party Intelligence OS · Action Reports (SERVER-ONLY)
// ------------------------------------------------------------
// Durable, retention-tiered findings. Reports dedupe by fingerprint, generate
// Action Tasks from their findings (and link back), and move through hot →
// warm → cold tiers so we never keep unbounded duplicated report bodies:
//   • hot  — full body retained
//   • warm — body dropped; summary + findings + generated tasks kept
//   • cold — same as warm, archived for long-term reference
// Callers are already behind requireAdmin(). Keyless-first via ./store.
// ============================================================

import { reportRepo, getSettings } from './store';
import { genId } from './router';
import { stableHash, semanticFingerprint } from './fingerprint';
import { upsertTask } from './tasks';
import type {
  ActionReport, ReportType, ReportFinding, ReportLifecycle, RetentionTier,
  IntelligenceSettings, TaskCategory,
} from './types';

/** Stable dedup key for a report: type + source + the meaning of its title. */
export function reportFingerprint(facets: { type: string; source: string; title: string }): string {
  return `rfp_${stableHash(`${facets.type}::${facets.source}::${semanticFingerprint(facets.title)}`)}`;
}

/** Map a report type to the most fitting task category for generated tasks. */
const TYPE_TO_CATEGORY: Partial<Record<ReportType, TaskCategory>> = {
  'upload-reliability': 'upload', 'login-auth': 'authentication', 'video-analysis': 'video-analysis',
  'ai-quality': 'prompt-quality', 'seo-aeo-geo': 'seo-aeo-geo', 'ux-friction': 'mobile-ux',
  'conversion-funnel': 'conversion-funnel', 'revenue-opportunity': 'payments-monetization',
  'ads-monetization': 'ads-revenue', 'privacy-security': 'security', performance: 'performance',
  accessibility: 'accessibility', 'feature-gap': 'content-gap', 'growth-opportunity': 'growth',
  'admin-operations': 'admin-dashboard', 'user-journey': 'engagement', 'system-health': 'api',
};

export interface CreateReportInput {
  title: string;
  type: ReportType;
  source: string;
  executiveSummary?: string;
  findings?: ReportFinding[];
  recommendedActions?: string[];
  evidenceReferences?: string[];
  internalLearningTags?: string[];
  fullBody?: string | null;
}

/** Create a report, or dedupe into an existing same-fingerprint report. */
export async function upsertReport(input: CreateReportInput): Promise<{ report: ActionReport; deduped: boolean }> {
  const now = new Date().toISOString();
  const fingerprint = reportFingerprint({ type: input.type, source: input.source, title: input.title });
  const findings = input.findings ?? [];

  const existing = (await reportRepo.list()).find((r) => r.fingerprint === fingerprint && !r.archived);
  if (existing) {
    const updated = await reportRepo.update(existing.id, {
      findings: findings.length ? findings : existing.findings,
      executiveSummary: input.executiveSummary ?? existing.executiveSummary,
      lifecycleStatus: existing.lifecycleStatus === 'resolved' ? 'monitoring' : existing.lifecycleStatus,
    });
    return { report: updated ?? existing, deduped: true };
  }

  const severities = findings.map((f) => f.severity);
  const sevCount = (s: string) => severities.filter((x) => x === s).length;
  const report: ActionReport = {
    id: genId('report'),
    title: input.title,
    type: input.type,
    source: input.source,
    lifecycleStatus: 'generated',
    severitySummary: `${sevCount('critical')} critical · ${sevCount('high')} high · ${sevCount('medium')} medium`,
    prioritySummary: `${findings.length} finding(s)`,
    executiveSummary: input.executiveSummary ?? '',
    findings,
    generatedTaskIds: [],
    evidenceReferences: input.evidenceReferences ?? [],
    recommendedActions: input.recommendedActions ?? [],
    internalLearningTags: input.internalLearningTags ?? [],
    searchMetadata: [input.title, input.type, input.source, ...findings.map((f) => f.title)].join(' ').toLowerCase(),
    retentionTier: 'hot',
    duplicateGroupId: null,
    fingerprint,
    fullBody: input.fullBody ?? null,
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
  return { report: await reportRepo.create(report), deduped: false };
}

/** Generate an Action Task per finding, link them back, advance lifecycle. */
export async function generateTasksFromReport(reportId: string): Promise<{ report: ActionReport; createdTaskIds: string[] } | null> {
  const report = await reportRepo.get(reportId);
  if (!report) return null;
  const category = TYPE_TO_CATEGORY[report.type] ?? 'bug';
  const createdTaskIds: string[] = [];

  for (const f of report.findings) {
    const { task } = await upsertTask({
      title: f.title,
      severity: f.severity,
      category,
      source: `report:${report.id}`,
      evidenceSummary: f.detail,
      suggestedNextAction: f.recommendation,
      relatedReportIds: [report.id],
      signature: f.title,
    });
    if (!createdTaskIds.includes(task.id)) createdTaskIds.push(task.id);
  }

  const generatedTaskIds = Array.from(new Set([...report.generatedTaskIds, ...createdTaskIds]));
  const updated = await reportRepo.update(reportId, {
    generatedTaskIds,
    lifecycleStatus: 'converted-to-tasks',
  });
  return { report: updated ?? report, createdTaskIds };
}

export async function setReportLifecycle(id: string, status: ReportLifecycle): Promise<ActionReport | undefined> {
  return reportRepo.update(id, { lifecycleStatus: status, archived: status === 'archived' ? true : undefined });
}

/**
 * Move a report to a retention tier. Demoting out of `hot` drops the full body
 * (summary + findings + generated tasks are always preserved). `cold` archives.
 */
export async function setReportRetention(id: string, tier: RetentionTier): Promise<ActionReport | undefined> {
  const patch: Partial<ActionReport> = { retentionTier: tier };
  if (tier !== 'hot') patch.fullBody = null;
  if (tier === 'cold') patch.archived = true;
  return reportRepo.update(id, patch);
}

/** Recommend a tier from age + settings (used by an optional retention sweep). */
export function recommendedRetentionTier(
  report: Pick<ActionReport, 'createdAt' | 'lifecycleStatus'>,
  settings: Pick<IntelligenceSettings, 'rawEventRetentionDays' | 'lowValueArchiveDays'>,
  now = Date.now(),
): RetentionTier {
  const ageDays = (now - new Date(report.createdAt).getTime()) / 86_400_000;
  if (ageDays >= settings.lowValueArchiveDays && settings.lowValueArchiveDays > 0) return 'cold';
  if (ageDays >= settings.rawEventRetentionDays && settings.rawEventRetentionDays > 0) return 'warm';
  return 'hot';
}

// ── Age-based retention sweep (wired to a daily cron) ─────────
const TIER_RANK: Record<RetentionTier, number> = { hot: 0, warm: 1, cold: 2 };

export interface RetentionSweepResult {
  scanned: number;
  demotedToWarm: number;
  demotedToCold: number;
  bodiesDropped: number;
  unchanged: number;
}

/**
 * Demote reports to their age-recommended retention tier (hot → warm → cold),
 * dropping the full body on the first demotion out of hot. Only demotes (never
 * promotes), so manual escalations to a hotter tier are preserved. Idempotent:
 * a report already at/below its recommended tier is left untouched. Driven by
 * the report's age and the IntelligenceSettings retention windows.
 */
export async function sweepReportRetention(now = Date.now()): Promise<RetentionSweepResult> {
  const settings = await getSettings();
  const reports = await reportRepo.list();
  const result: RetentionSweepResult = { scanned: 0, demotedToWarm: 0, demotedToCold: 0, bodiesDropped: 0, unchanged: 0 };

  for (const r of reports) {
    if (r.archived) { result.unchanged += 1; continue; }
    result.scanned += 1;
    const target = recommendedRetentionTier(r, settings, now);
    // Only demote (recommended tier is strictly colder than current).
    if (TIER_RANK[target] <= TIER_RANK[r.retentionTier]) { result.unchanged += 1; continue; }
    const hadBody = r.fullBody !== null;
    await setReportRetention(r.id, target);
    if (hadBody) result.bodiesDropped += 1;
    if (target === 'warm') result.demotedToWarm += 1;
    else if (target === 'cold') result.demotedToCold += 1;
  }
  return result;
}
