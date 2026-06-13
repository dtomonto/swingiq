// ============================================================
// SwingVantage — First-Party Intelligence OS · dashboard aggregation (SERVER-ONLY)
// ------------------------------------------------------------
// Composes the admin Overview + Token-Savings breakdowns from the stores.
// Pure read-model — no fabrication. When no data exists yet, counts are 0 and
// the UI shows honest empty states. `dataSource` reflects whether the layer is
// DB-backed ('real') or running in the keyless in-process fallback ('placeholder').
// ============================================================

import {
  activityRepo, knowledgeRepo, canonicalRepo, patternRepo, cacheRepo, savingsRepo, evaluationRepo,
  taskRepo, reportRepo, isIntelligencePersistent, getSettings,
} from './store';
import { similarityBackend } from './embeddings';
import type {
  AIActivityEvent, KnowledgeItem, PatternMemory, TokenSavingsEntry, IntelligenceSettings, DataSource,
} from './types';

export interface OverviewMetrics {
  thirdPartyCalls: number;
  thirdPartyTokens: number;
  estimatedAiCostCents: number;
  aiCallsAvoided: number;
  tokensAvoided: number;
  estimatedCostSavedCents: number;
  cacheHitRate: number; // 0..1
  canonicalAnswersServed: number;
  knowledgeItemsTotal: number;
  knowledgeAwaitingReview: number;
  canonicalAnswersTotal: number;
  patternsOpen: number;
  evaluationsTotal: number;
}

export interface RepeatedQuestion { intent: string; count: number; estCostCents: number; }
export interface FeatureCost { feature: string; calls: number; costCents: number; }

/** Action OS roll-up — the clickable task queue + the report library. */
export interface ActionOsSummary {
  tasksTotal: number;
  criticalTasks: number;
  highPriorityTasks: number;
  needsAttentionTasks: number;
  openOpportunities: number;
  reportsTotal: number;
  reportsHot: number;
  reportsWarm: number;
  reportsCold: number;
}

export interface IntelligenceOverview {
  generatedAt: string;
  dataSource: DataSource;
  persistent: boolean;
  /** Which semantic-matching backend is active (real embeddings vs lexical). */
  similarityBackend: 'embeddings' | 'lexical';
  settings: IntelligenceSettings;
  metrics: OverviewMetrics;
  actionOs: ActionOsSummary;
  highestValueRepeatedQuestions: RepeatedQuestion[];
  highestCostWorkflows: FeatureCost[];
  topReusableKnowledge: Pick<KnowledgeItem, 'id' | 'title' | 'usageCount' | 'confidenceScore' | 'validationStatus'>[];
  topRecurringAiQualityIssues: Pick<PatternMemory, 'id' | 'patternTitle' | 'occurrenceCount'>[];
  topRecurringTechnicalIssues: Pick<PatternMemory, 'id' | 'patternTitle' | 'occurrenceCount'>[];
  recentActivity: AIActivityEvent[];
}

function sum(nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }
function round(n: number): number { return Number(n.toFixed(2)); }

export async function getIntelligenceOverview(): Promise<IntelligenceOverview> {
  const [events, knowledge, canonical, patterns, cache, savings, evaluations, tasks, reports, settings] = await Promise.all([
    activityRepo.list(), knowledgeRepo.list(), canonicalRepo.list(), patternRepo.list(),
    cacheRepo.list(), savingsRepo.list(), evaluationRepo.list(), taskRepo.list(), reportRepo.list(), getSettings(),
  ]);

  const liveTasks = tasks.filter((t) => !t.archived);
  const isDone = (s: string) => s === 'fixed' || s === 'verified' || s === 'archived' || s === 'ignored';
  const needsAttention = new Set(['new', 'triaged', 'needs-review', 'waiting']);
  const liveReports = reports.filter((r) => !r.archived);
  const actionOs: ActionOsSummary = {
    tasksTotal: liveTasks.length,
    criticalTasks: liveTasks.filter((t) => t.severity === 'critical' && !isDone(t.status)).length,
    highPriorityTasks: liveTasks.filter((t) => (t.severity === 'high' || t.priority === 'p1') && !isDone(t.status)).length,
    needsAttentionTasks: liveTasks.filter((t) => needsAttention.has(t.status)).length,
    openOpportunities: liveTasks.filter((t) => t.category === 'opportunity' && !isDone(t.status)).length,
    reportsTotal: liveReports.length,
    reportsHot: liveReports.filter((r) => r.retentionTier === 'hot').length,
    reportsWarm: liveReports.filter((r) => r.retentionTier === 'warm').length,
    reportsCold: liveReports.filter((r) => r.retentionTier === 'cold').length,
  };

  const thirdPartyEvents = events.filter((e) => e.provider !== 'first-party' && e.provider !== 'none');
  const cacheHits = sum(cache.map((c) => c.usageCount));
  const cacheLookups = cacheHits + thirdPartyEvents.length;

  const metrics: OverviewMetrics = {
    thirdPartyCalls: thirdPartyEvents.length,
    thirdPartyTokens: sum(thirdPartyEvents.map((e) => e.inputTokens + e.outputTokens)),
    estimatedAiCostCents: round(sum(thirdPartyEvents.map((e) => e.estimatedCostCents))),
    aiCallsAvoided: savings.length,
    tokensAvoided: sum(savings.map((s) => s.avoidedInputTokens + s.avoidedOutputTokens)),
    estimatedCostSavedCents: round(sum(savings.map((s) => s.estimatedCostSavedCents))),
    cacheHitRate: cacheLookups > 0 ? Number((cacheHits / cacheLookups).toFixed(3)) : 0,
    canonicalAnswersServed: sum(canonical.map((c) => c.usageCount)),
    knowledgeItemsTotal: knowledge.length,
    knowledgeAwaitingReview: knowledge.filter((k) => k.validationStatus === 'candidate' || k.validationStatus === 'needs-review').length,
    canonicalAnswersTotal: canonical.length,
    patternsOpen: patterns.filter((p) => p.status === 'open' || p.status === 'monitoring').length,
    evaluationsTotal: evaluations.length,
  };

  // Highest-value repeated questions: group events by promptHash.
  const byPrompt = new Map<string, RepeatedQuestion>();
  for (const e of thirdPartyEvents) {
    const k = e.promptHash;
    const cur = byPrompt.get(k) ?? { intent: e.userIntent || e.promptSummary, count: 0, estCostCents: 0 };
    cur.count += 1; cur.estCostCents = round(cur.estCostCents + e.estimatedCostCents);
    byPrompt.set(k, cur);
  }
  const highestValueRepeatedQuestions = Array.from(byPrompt.values())
    .filter((q) => q.count > 1)
    .sort((a, b) => (b.count * b.estCostCents) - (a.count * a.estCostCents)).slice(0, 8);

  // Highest-cost workflows: group by feature.
  const byFeature = new Map<string, FeatureCost>();
  for (const e of thirdPartyEvents) {
    const cur = byFeature.get(e.feature) ?? { feature: e.feature, calls: 0, costCents: 0 };
    cur.calls += 1; cur.costCents = round(cur.costCents + e.estimatedCostCents);
    byFeature.set(e.feature, cur);
  }
  const highestCostWorkflows = Array.from(byFeature.values()).sort((a, b) => b.costCents - a.costCents).slice(0, 8);

  const topReusableKnowledge = [...knowledge]
    .sort((a, b) => b.usageCount - a.usageCount).slice(0, 8)
    .map((k) => ({ id: k.id, title: k.title, usageCount: k.usageCount, confidenceScore: k.confidenceScore, validationStatus: k.validationStatus }));

  const aiQuality = patterns.filter((p) => p.patternType === 'recurring-ai-quality-issue');
  const technical = patterns.filter((p) => p.patternType === 'recurring-technical-bug' || p.patternType === 'recurring-upload-issue');
  const topRecurringAiQualityIssues = [...aiQuality].sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5)
    .map((p) => ({ id: p.id, patternTitle: p.patternTitle, occurrenceCount: p.occurrenceCount }));
  const topRecurringTechnicalIssues = [...technical].sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5)
    .map((p) => ({ id: p.id, patternTitle: p.patternTitle, occurrenceCount: p.occurrenceCount }));

  const recentActivity = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  return {
    generatedAt: new Date().toISOString(),
    dataSource: isIntelligencePersistent() ? 'real' : 'placeholder',
    persistent: isIntelligencePersistent(),
    similarityBackend: similarityBackend(),
    settings,
    metrics,
    actionOs,
    highestValueRepeatedQuestions,
    highestCostWorkflows,
    topReusableKnowledge,
    topRecurringAiQualityIssues,
    topRecurringTechnicalIssues,
    recentActivity,
  };
}

// ── Token-savings breakdowns (for the Token Savings page) ─────
export interface SavingsBreakdown {
  totalSavedCents: number;
  totalTokensAvoided: number;
  totalCallsAvoided: number;
  byServedBy: { label: string; calls: number; costCents: number }[];
  byProvider: { label: string; calls: number; costCents: number }[];
  byFeature: { label: string; calls: number; costCents: number }[];
}

function groupSavings(rows: TokenSavingsEntry[], key: (r: TokenSavingsEntry) => string): { label: string; calls: number; costCents: number }[] {
  const m = new Map<string, { label: string; calls: number; costCents: number }>();
  for (const r of rows) {
    const label = key(r) || 'unknown';
    const cur = m.get(label) ?? { label, calls: 0, costCents: 0 };
    cur.calls += 1; cur.costCents = round(cur.costCents + r.estimatedCostSavedCents);
    m.set(label, cur);
  }
  return Array.from(m.values()).sort((a, b) => b.costCents - a.costCents);
}

export async function getSavingsBreakdown(): Promise<SavingsBreakdown> {
  const rows = await savingsRepo.list();
  return {
    totalSavedCents: round(sum(rows.map((r) => r.estimatedCostSavedCents))),
    totalTokensAvoided: sum(rows.map((r) => r.avoidedInputTokens + r.avoidedOutputTokens)),
    totalCallsAvoided: rows.length,
    byServedBy: groupSavings(rows, (r) => r.servedBy),
    byProvider: groupSavings(rows, (r) => r.avoidedProvider ?? 'unknown'),
    byFeature: groupSavings(rows, (r) => r.sourceFeature),
  };
}
