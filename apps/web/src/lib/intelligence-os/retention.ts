// ============================================================
// SwingVantage — First-Party Intelligence OS · retention sweeper (SERVER-ONLY)
// ------------------------------------------------------------
// Hot → warm → cold layering, driven by the settings thresholds:
//   - rawEventRetentionDays: after N days, "summarize" raw AI events by dropping
//     the (already short) prompt/response summaries' bulk — we keep the hashes,
//     metadata, costs and links, but blank the free-text summaries so old events
//     occupy minimal space while staying auditable + countable.
//   - lowValueArchiveDays: after N days, delete low-value events (fallback/error
//     or never-promoted, no feedback) that carry no learning value.
//
// PRESERVED ALWAYS: approved/needs-review knowledge, canonical answers, the
// token-savings ledger, patterns, and any event already promoted to knowledge.
// Idempotent + best-effort per row. 0 in a setting disables that rule.
// ============================================================

import { activityRepo, getSettings } from './store';
import type { AIActivityEvent } from './types';

export interface RetentionReport {
  ranAt: string;
  rawEventRetentionDays: number;
  lowValueArchiveDays: number;
  scanned: number;
  summarized: number;
  archived: number;
  preserved: number;
}

function daysAgoIso(days: number): number {
  return Date.now() - days * 24 * 3600 * 1000;
}

/** A low-value event: a fallback/error or a never-promoted event with no feedback. */
function isLowValue(e: AIActivityEvent): boolean {
  if (e.promotedKnowledgeId) return false; // it taught the system something
  if (e.userFeedback === 'positive' || e.adminFeedback === 'approved') return false;
  return e.status === 'fallback' || e.status === 'error' || (e.qualityScore !== null && e.qualityScore < 0.3) || e.confidenceScore < 0.4;
}

/** Whether an event's free-text has already been summarized away. */
function isSummarized(e: AIActivityEvent): boolean {
  return e.promptSummary === '' && e.responseSummary === '';
}

export async function runRetentionSweep(now: number = Date.now()): Promise<RetentionReport> {
  const settings = await getSettings();
  const events = await activityRepo.list();
  const report: RetentionReport = {
    ranAt: new Date(now).toISOString(),
    rawEventRetentionDays: settings.rawEventRetentionDays,
    lowValueArchiveDays: settings.lowValueArchiveDays,
    scanned: events.length,
    summarized: 0, archived: 0, preserved: 0,
  };

  const archiveCutoff = settings.lowValueArchiveDays > 0 ? daysAgoIso(settings.lowValueArchiveDays) : null;
  const summarizeCutoff = settings.rawEventRetentionDays > 0 ? daysAgoIso(settings.rawEventRetentionDays) : null;

  for (const e of events) {
    const createdMs = new Date(e.createdAt).getTime();

    // 1) Archive (delete) old low-value, non-promoted events.
    if (archiveCutoff !== null && createdMs < archiveCutoff && isLowValue(e)) {
      await activityRepo.remove(e.id);
      report.archived += 1;
      continue;
    }

    // 2) Summarize older events: keep metadata/hashes/costs, drop free-text.
    if (summarizeCutoff !== null && createdMs < summarizeCutoff && !isSummarized(e)) {
      await activityRepo.update(e.id, { promptSummary: '', responseSummary: '', dataSource: 'imported' });
      report.summarized += 1;
      continue;
    }

    report.preserved += 1;
  }

  return report;
}
