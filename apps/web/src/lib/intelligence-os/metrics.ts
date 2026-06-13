// ============================================================
// First-Party Intelligence OS — metrics & aggregation
// ------------------------------------------------------------
// Pure aggregators over the record sets, plus an async overview snapshot the
// admin pages read. Honest: when no real data exists yet the numbers reflect
// the demo seed and the UI labels the source accordingly.
// ============================================================

import type {
  AiActivityEvent, KnowledgeItem, PatternMemory,
  TokenSavingsEntry, ActionTask,
} from './types';
import {
  aiEventsRepo, knowledgeRepo, canonicalRepo, patternsRepo, tokenSavingsRepo,
  tasksRepo, isIntelligencePersistent,
} from './store';

export interface TokenSavingsSummary {
  aiCallsAvoided: number;
  tokensAvoided: number;
  estimatedCostSaved: number;
  thirdPartyCalls: number;
  thirdPartyTokens: number;
  thirdPartyCost: number;
  cacheHitRate: number; // 0..1
  byFeature: Array<{ feature: string; costSaved: number; tokensAvoided: number }>;
  byProvider: Array<{ provider: string; cost: number; calls: number }>;
}

export function summarizeTokenSavings(
  events: AiActivityEvent[],
  ledger: TokenSavingsEntry[],
): TokenSavingsSummary {
  const aiCallsAvoided = ledger.length;
  const tokensAvoided = ledger.reduce((s, l) => s + l.avoidedInputTokens + l.avoidedOutputTokens, 0);
  const estimatedCostSaved = ledger.reduce((s, l) => s + l.estimatedCostSaved, 0);

  const thirdParty = events.filter((e) => e.provider && e.status !== 'skipped');
  const thirdPartyCalls = thirdParty.length;
  const thirdPartyTokens = thirdParty.reduce((s, e) => s + (e.inputTokens ?? 0) + (e.outputTokens ?? 0), 0);
  const thirdPartyCost = thirdParty.reduce((s, e) => s + (e.estimatedCost ?? 0), 0);

  const totalAnswerable = aiCallsAvoided + thirdPartyCalls;
  const cacheHitRate = totalAnswerable > 0 ? aiCallsAvoided / totalAnswerable : 0;

  const featureMap = new Map<string, { costSaved: number; tokensAvoided: number }>();
  for (const l of ledger) {
    const e = featureMap.get(l.sourceFeature) ?? { costSaved: 0, tokensAvoided: 0 };
    e.costSaved += l.estimatedCostSaved;
    e.tokensAvoided += l.avoidedInputTokens + l.avoidedOutputTokens;
    featureMap.set(l.sourceFeature, e);
  }
  const providerMap = new Map<string, { cost: number; calls: number }>();
  for (const e of thirdParty) {
    const key = e.provider ?? 'unknown';
    const p = providerMap.get(key) ?? { cost: 0, calls: 0 };
    p.cost += e.estimatedCost ?? 0;
    p.calls += 1;
    providerMap.set(key, p);
  }

  return {
    aiCallsAvoided, tokensAvoided, estimatedCostSaved,
    thirdPartyCalls, thirdPartyTokens, thirdPartyCost, cacheHitRate,
    byFeature: [...featureMap.entries()].map(([feature, v]) => ({ feature, ...v })).sort((a, b) => b.costSaved - a.costSaved),
    byProvider: [...providerMap.entries()].map(([provider, v]) => ({ provider, ...v })).sort((a, b) => b.cost - a.cost),
  };
}

export interface OverviewSnapshot {
  thirdPartyCalls: number;
  thirdPartyTokens: number;
  thirdPartyCost: number;
  aiCallsAvoided: number;
  tokensAvoided: number;
  estimatedCostSaved: number;
  cacheHitRate: number;
  canonicalAnswers: number;
  canonicalServed: number;
  knowledgeItems: number;
  knowledgeAwaitingReview: number;
  openPatterns: number;
  criticalTasks: number;
  highPriorityTasks: number;
  needsAttentionTasks: number;
  openOpportunities: number;
  topRepeatedQuestions: PatternMemory[];
  topReusableKnowledge: KnowledgeItem[];
  topRecurringIssues: PatternMemory[];
  persistent: boolean;
}

const NEEDS_ATTENTION_STATUSES = new Set(['New', 'Triaged', 'Needs Review', 'Waiting']);

export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const [events, ledger, knowledge, canonical, patterns, tasks] = await Promise.all([
    aiEventsRepo.list(), tokenSavingsRepo.list(), knowledgeRepo.list(),
    canonicalRepo.list(), patternsRepo.list(), tasksRepo.list(),
  ]);
  const savings = summarizeTokenSavings(events, ledger);
  const live = tasks.filter((t) => !t.archived);

  return {
    thirdPartyCalls: savings.thirdPartyCalls,
    thirdPartyTokens: savings.thirdPartyTokens,
    thirdPartyCost: savings.thirdPartyCost,
    aiCallsAvoided: savings.aiCallsAvoided,
    tokensAvoided: savings.tokensAvoided,
    estimatedCostSaved: savings.estimatedCostSaved,
    cacheHitRate: savings.cacheHitRate,
    canonicalAnswers: canonical.length,
    canonicalServed: canonical.reduce((s, c) => s + c.usageCount, 0),
    knowledgeItems: knowledge.filter((k) => !k.archived).length,
    knowledgeAwaitingReview: knowledge.filter((k) => k.validationStatus === 'Candidate' || k.validationStatus === 'Needs Review').length,
    openPatterns: patterns.filter((p) => p.status === 'Open' || p.status === 'Monitoring').length,
    criticalTasks: live.filter((t) => t.severity === 'critical' && !isDone(t)).length,
    highPriorityTasks: live.filter((t) => (t.severity === 'high' || t.priority === 'p1') && !isDone(t)).length,
    needsAttentionTasks: live.filter((t) => NEEDS_ATTENTION_STATUSES.has(t.status)).length,
    openOpportunities: live.filter((t) => t.category === 'Opportunity' && !isDone(t)).length,
    topRepeatedQuestions: patterns.filter((p) => p.patternType === 'Recurring User Question').sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5),
    topReusableKnowledge: [...knowledge].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
    topRecurringIssues: [...patterns].sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5),
    persistent: isIntelligencePersistent(),
  };
}

function isDone(t: ActionTask): boolean {
  return t.status === 'Fixed' || t.status === 'Verified' || t.status === 'Archived' || t.status === 'Ignored';
}
