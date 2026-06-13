// ============================================================
// SwingVantage — First-Party Intelligence OS · routing engine (SERVER-ONLY)
// ------------------------------------------------------------
// resolveWithFirstPartyIntelligence() routes a request through the cheapest
// reliable path before ever paying a third-party model:
//   1 exact cache · 2 canonical answer · 3 deterministic rules ·
//   4 first-party knowledge retrieval · 5 small/local model (seam) ·
//   6 third-party AI (only when nothing above is reliable).
//
// Third-party calls are PLUGGABLE (opts.callThirdParty) so this module stays
// pure + unit-testable and keyless-first. ./provider-adapter.ts wires the real
// AI gateway. Every AI call is logged; reusable answers become knowledge
// candidates; avoided calls are written to the token-savings ledger.
// ============================================================

import {
  activityRepo, knowledgeRepo, canonicalRepo, cacheRepo, savingsRepo, patternRepo, getSettings,
} from './store';
import {
  hashText, semanticFingerprint, buildCacheKey, knowledgeFingerprint,
  detectSafetyFlags, summarize,
} from './fingerprint';
import { semanticSimilarityHybrid, similarityWithVectors } from './embeddings';
import { ESTIMATED_COST_PER_1K_TOKENS_CENTS, MIN_TRUSTWORTHY_CONFIDENCE } from './config';
import type {
  AIActivityEvent, KnowledgeItem, CanonicalAnswer, AnswerCacheEntry, TokenSavingsEntry,
  PatternMemory, IntelligenceSettings, Provider, Sport, SourceSystem, SafetyFlag,
  AnswerFormat, KnowledgeType, PatternType, SavingsServedBy,
} from './types';

export function genId(prefix: string): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return `io_${prefix}_${c.randomUUID()}`;
  // Fallback without Math.random: 16 secure random bytes → hex.
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `io_${prefix}_${hex}`;
}

function estimateCostCents(provider: Provider | null, inputTokens: number, outputTokens: number): number {
  const key = provider && ESTIMATED_COST_PER_1K_TOKENS_CENTS[provider] ? provider : 'other';
  const rate = ESTIMATED_COST_PER_1K_TOKENS_CENTS[key];
  return Number((((inputTokens / 1000) * rate.input) + ((outputTokens / 1000) * rate.output)).toFixed(4));
}

// ── Request normalization ─────────────────────────────────────
export interface IntelligenceRequestInput {
  sourceSystem: SourceSystem;
  feature: string;
  sport?: Sport;
  audience?: string;
  /** The actual prompt / user question. */
  request: string;
  answerFormat?: AnswerFormat;
  userIdHash?: string | null;
  relatedSessionId?: string | null;
  relatedVideoId?: string | null;
  relatedReportId?: string | null;
  relatedTaskId?: string | null;
}

export interface NormalizedRequest extends IntelligenceRequestInput {
  sport: Sport;
  promptHash: string;
  semanticFp: string;
  cacheKey: string;
  safetyFlags: SafetyFlag[];
  /** True when the request is personalized/privacy-sensitive → no global reuse. */
  personalized: boolean;
  summary: string;
}

export function normalizeIntelligenceRequest(input: IntelligenceRequestInput, settings: IntelligenceSettings): NormalizedRequest {
  const sport: Sport = input.sport ?? 'none';
  const safetyFlags = detectSafetyFlags(input.request, settings.privacyExclusionKeywords);
  const personalized = safetyFlags.includes('privacy') || safetyFlags.includes('personalized')
    || settings.privacyExclusionKeywords.some((w) => w && input.request.toLowerCase().includes(w.toLowerCase()));
  return {
    ...input,
    sport,
    promptHash: hashText(input.request),
    semanticFp: semanticFingerprint(input.request),
    cacheKey: buildCacheKey({ feature: input.feature, sport, audience: input.audience, request: input.request }),
    safetyFlags,
    personalized,
    summary: summarize(input.request),
  };
}

// ── Step 1 · exact cache ──────────────────────────────────────
export async function findExactCacheMatch(req: NormalizedRequest): Promise<AnswerCacheEntry | null> {
  if (req.personalized) return null; // never reuse personalized answers globally
  const entries = await cacheRepo.list();
  const now = Date.now();
  const hit = entries.find((e) => e.cacheKey === req.cacheKey
    && !e.personalized
    && (!e.expiresAt || new Date(e.expiresAt).getTime() > now)
    && !e.invalidationReason);
  return hit ?? null;
}

// ── Step 2 · canonical answer ─────────────────────────────────
export async function findCanonicalAnswer(req: NormalizedRequest, settings: IntelligenceSettings): Promise<{ answer: CanonicalAnswer; similarity: number } | null> {
  if (req.personalized) return null;
  const all = await canonicalRepo.list();
  const eligible = all.filter((a) => a.validationStatus === 'approved' && a.allowedAutoServe);
  let best: { answer: CanonicalAnswer; similarity: number } | null = null;
  for (const a of eligible) {
    // Block when a safety flag requires review.
    if (a.safetyFlags.some((f) => settings.reviewRequiredSafetyFlags.includes(f))) continue;
    const triggerHit = a.triggerPhrases.some((p) => req.request.toLowerCase().includes(p.toLowerCase()));
    const exactFp = a.semanticFingerprint === req.semanticFp;
    const sim = exactFp || triggerHit ? 1 : await similarityWithVectors(req.request, null, a.canonicalQuestion, a.embedding);
    if (sim >= settings.semanticMatchThreshold && a.confidenceScore >= settings.autoServeConfidenceThreshold) {
      if (!best || sim > best.similarity) best = { answer: a, similarity: sim };
    }
  }
  return best;
}

// ── Step 4 · first-party knowledge retrieval ──────────────────
export interface ScoredKnowledge { item: KnowledgeItem; similarity: number }

export async function retrieveKnowledge(req: NormalizedRequest, settings: IntelligenceSettings, limit = 5): Promise<ScoredKnowledge[]> {
  const all = await knowledgeRepo.list();
  const scored: ScoredKnowledge[] = [];
  for (const item of all) {
    if (item.archived || item.validationStatus === 'rejected') continue;
    if (req.sport !== 'none' && item.sport !== 'none' && item.sport !== 'cross-sport' && item.sport !== req.sport) continue;
    if (item.safetyFlags.some((f) => settings.reviewRequiredSafetyFlags.includes(f)) && !req.personalized) {
      // safety-flagged knowledge stays surfaceable to admins but not auto-served
    }
    const sim = Math.max(
      await similarityWithVectors(req.request, null, item.canonicalQuestion, item.embedding),
      await semanticSimilarityHybrid(item.userIntent, req.request),
    );
    if (sim > 0.1) scored.push({ item, similarity: sim });
  }
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

// ── Confidence + decision ─────────────────────────────────────
export function scoreConfidence(parts: { similarity: number; sourceConfidence: number; successCount?: number; failureCount?: number }): number {
  const { similarity, sourceConfidence, successCount = 0, failureCount = 0 } = parts;
  const total = successCount + failureCount;
  const outcomeBoost = total > 0 ? (successCount / total) : 0.5;
  const raw = similarity * 0.5 + sourceConfidence * 0.35 + outcomeBoost * 0.15;
  return Number(Math.max(0, Math.min(1, raw)).toFixed(3));
}

export function shouldUseThirdPartyAI(parts: { bestConfidence: number; settings: IntelligenceSettings; personalized: boolean }): boolean {
  if (parts.personalized) return true; // personalized work isn't reused; route to AI
  return parts.bestConfidence < parts.settings.autoServeConfidenceThreshold;
}

// ── Capture: log an AI activity event ─────────────────────────
export interface LogAIActivityInput {
  req: NormalizedRequest;
  provider: Provider;
  model: string | null;
  response: string;
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
  latencyMs?: number | null;
  status?: AIActivityEvent['status'];
  confidenceScore?: number;
  qualityScore?: number | null;
}

export async function logAIActivity(input: LogAIActivityInput): Promise<AIActivityEvent> {
  const { req } = input;
  const costCents = input.costCents ?? estimateCostCents(input.provider, input.inputTokens, input.outputTokens);
  const event: AIActivityEvent = {
    id: genId('evt'),
    sourceSystem: req.sourceSystem,
    feature: req.feature,
    sport: req.sport,
    userIntent: req.summary,
    promptHash: req.promptHash,
    promptSummary: req.summary,
    responseHash: hashText(input.response),
    responseSummary: summarize(input.response),
    provider: input.provider,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCostCents: costCents,
    latencyMs: input.latencyMs ?? null,
    status: input.status ?? 'ok',
    confidenceScore: input.confidenceScore ?? 0.5,
    safetyFlags: req.safetyFlags,
    qualityScore: input.qualityScore ?? null,
    userFeedback: null,
    adminFeedback: null,
    relatedUserIdHash: req.userIdHash ?? null,
    relatedSessionId: req.relatedSessionId ?? null,
    relatedVideoId: req.relatedVideoId ?? null,
    relatedReportId: req.relatedReportId ?? null,
    relatedTaskId: req.relatedTaskId ?? null,
    promotedKnowledgeId: null,
    dataSource: 'real',
    createdAt: new Date().toISOString(),
  };
  return activityRepo.create(event);
}

// ── Promote: create a knowledge candidate (deduped) ───────────
const SOURCE_TO_KNOWLEDGE_TYPE: Record<SourceSystem, KnowledgeType> = {
  'ai-coach': 'coaching-answer',
  'video-analysis': 'swing-diagnosis-pattern',
  'drill-plan': 'drill-recommendation',
  'retest-plan': 'retest-recommendation',
  'admin-report': 'admin-operating-procedure',
  'seo-audit': 'seo-pattern',
  'ux-audit': 'ux-pattern',
  'support-response': 'support-answer',
  'claude-code-fix-packet': 'claude-code-repair-pattern',
  'manual-admin-entry': 'admin-operating-procedure',
};

/**
 * Turn a reusable AI event into a knowledge candidate. Dedupes by fingerprint:
 * a matching item gets its occurrence/evidence/confidence updated instead of a
 * duplicate being created. Personalized/privacy events are never promoted.
 */
export async function createKnowledgeCandidate(event: AIActivityEvent, fullResponse: string, settings: IntelligenceSettings): Promise<KnowledgeItem | null> {
  if (event.safetyFlags.includes('privacy') || event.safetyFlags.includes('personalized')) return null;
  if (event.confidenceScore < settings.knowledgePromotionThreshold) return null;

  const fp = knowledgeFingerprint({
    userIntent: event.userIntent, sport: event.sport, topic: event.feature, answer: fullResponse,
  });
  const existing = (await knowledgeRepo.list()).find((k) => k.fingerprint === fp);
  if (existing) {
    const updated = await knowledgeRepo.update(existing.id, {
      usageCount: existing.usageCount + 1,
      sourceEventIds: Array.from(new Set([...existing.sourceEventIds, event.id])).slice(-50),
      confidenceScore: Number(Math.min(1, existing.confidenceScore + 0.02).toFixed(3)),
      lastUsedAt: new Date().toISOString(),
    });
    if (updated) await activityRepo.update(event.id, { promotedKnowledgeId: updated.id });
    return updated ?? existing;
  }

  const now = new Date().toISOString();
  const item: KnowledgeItem = {
    id: genId('know'),
    title: summarize(event.userIntent, 80) || event.feature,
    knowledgeType: SOURCE_TO_KNOWLEDGE_TYPE[event.sourceSystem],
    sport: event.sport,
    topic: event.feature,
    userIntent: event.userIntent,
    canonicalQuestion: event.promptSummary,
    canonicalAnswer: fullResponse,
    shortAnswer: summarize(fullResponse, 160),
    structuredSteps: [],
    evidenceSummary: `Captured from ${event.sourceSystem} (${event.provider}/${event.model ?? 'n/a'}).`,
    fingerprint: fp,
    sourceEventIds: [event.id],
    sourceReportIds: event.relatedReportId ? [event.relatedReportId] : [],
    sourceTaskIds: event.relatedTaskId ? [event.relatedTaskId] : [],
    confidenceScore: event.confidenceScore,
    validationStatus: 'candidate',
    approvedByAdmin: null,
    safetyFlags: event.safetyFlags,
    usageCount: 1,
    successCount: 0,
    failureCount: 0,
    lastUsedAt: now,
    embedding: null, // computed on approval (best-effort, when embeddings configured)
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
  const created = await knowledgeRepo.create(item);
  await activityRepo.update(event.id, { promotedKnowledgeId: created.id });
  return created;
}

// ── Token savings ledger ──────────────────────────────────────
export interface RecordTokenSavingsInput {
  sourceFeature: string;
  servedBy: SavingsServedBy;
  avoidedProvider: Provider | null;
  avoidedModel: string | null;
  avoidedInputTokens: number;
  avoidedOutputTokens: number;
  costCents?: number;
  relatedCacheId?: string | null;
  relatedKnowledgeId?: string | null;
  relatedCanonicalAnswerId?: string | null;
  dataSource?: TokenSavingsEntry['dataSource'];
}

export async function recordTokenSavings(input: RecordTokenSavingsInput): Promise<TokenSavingsEntry> {
  const cost = input.costCents ?? estimateCostCents(input.avoidedProvider, input.avoidedInputTokens, input.avoidedOutputTokens);
  const entry: TokenSavingsEntry = {
    id: genId('save'),
    eventType: 'ai-call-avoided',
    sourceFeature: input.sourceFeature,
    avoidedProvider: input.avoidedProvider,
    avoidedModel: input.avoidedModel,
    avoidedInputTokens: input.avoidedInputTokens,
    avoidedOutputTokens: input.avoidedOutputTokens,
    estimatedCostSavedCents: cost,
    servedBy: input.servedBy,
    relatedCacheId: input.relatedCacheId ?? null,
    relatedKnowledgeId: input.relatedKnowledgeId ?? null,
    relatedCanonicalAnswerId: input.relatedCanonicalAnswerId ?? null,
    // honest: when we estimate avoided tokens (not from a real prior call) it's estimated
    dataSource: input.dataSource ?? 'estimated',
    createdAt: new Date().toISOString(),
  };
  return savingsRepo.create(entry);
}

// ── Pattern memory (deduped) ──────────────────────────────────
export async function recordPattern(input: {
  patternTitle: string; patternType: PatternType; summary: string;
  affectedFeature: string; affectedSport?: Sport; affectedRoute?: string | null;
  relatedEventId?: string | null; recommendedPrevention?: string; recommendedAutomation?: string; tags?: string[];
}): Promise<PatternMemory> {
  const fp = knowledgeFingerprint({
    userIntent: input.patternTitle, sport: input.affectedSport ?? 'none', topic: input.affectedFeature, answer: input.summary,
  });
  const existing = (await patternRepo.list()).find((p) => p.fingerprint === fp);
  const now = new Date().toISOString();
  if (existing) {
    const updated = await patternRepo.update(existing.id, {
      occurrenceCount: existing.occurrenceCount + 1,
      evidenceCount: existing.evidenceCount + (input.relatedEventId ? 1 : 0),
      lastSeenAt: now,
      relatedEventIds: input.relatedEventId
        ? Array.from(new Set([...existing.relatedEventIds, input.relatedEventId])).slice(-100)
        : existing.relatedEventIds,
      confidenceScore: Number(Math.min(1, existing.confidenceScore + 0.03).toFixed(3)),
    });
    return updated ?? existing;
  }
  const pattern: PatternMemory = {
    id: genId('pat'),
    patternTitle: input.patternTitle,
    patternType: input.patternType,
    summary: input.summary,
    fingerprint: fp,
    affectedFeature: input.affectedFeature,
    affectedSport: input.affectedSport ?? 'none',
    affectedRoute: input.affectedRoute ?? null,
    occurrenceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    evidenceCount: input.relatedEventId ? 1 : 0,
    confidenceScore: 0.4,
    recommendedPrevention: input.recommendedPrevention ?? '',
    recommendedAutomation: input.recommendedAutomation ?? '',
    relatedKnowledgeIds: [],
    relatedEventIds: input.relatedEventId ? [input.relatedEventId] : [],
    relatedTaskIds: [],
    relatedReportIds: [],
    status: 'open',
    tags: input.tags ?? [],
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
  };
  return patternRepo.create(pattern);
}

// ── The router ────────────────────────────────────────────────
export interface ThirdPartyResult {
  text: string;
  provider: Provider;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
  latencyMs?: number | null;
  confidence?: number;
}

export interface SmallModelResult { text: string; confidence?: number; }

export interface ResolveOptions {
  /** Real third-party call. Omit for keyless/dry-run (decision flags needsThirdParty). */
  callThirdParty?: (req: NormalizedRequest) => Promise<ThirdPartyResult>;
  /** Deterministic rule engine seam (step 3). Return a string to short-circuit. */
  ruleEngine?: (req: NormalizedRequest) => Promise<string | null> | string | null;
  /** Small/local/low-cost model seam (step 5) — tried before third-party AI.
   *  Return null to defer to third-party. Served answers count as avoided
   *  third-party calls in the savings ledger. */
  smallModel?: (req: NormalizedRequest) => Promise<SmallModelResult | null> | SmallModelResult | null;
  /** Whether to write reusable AI output as a knowledge candidate (default true). */
  promoteToKnowledge?: boolean;
}

export type ServedBy = 'exact-cache' | 'canonical-answer' | 'rule-engine' | 'knowledge' | 'small-model' | 'third-party-ai' | 'none';

export interface IntelligenceDecision {
  response: string | null;
  servedBy: ServedBy;
  confidenceScore: number;
  thirdPartyAiUsed: boolean;
  providerUsed: Provider | null;
  modelUsed: string | null;
  tokensUsed: number;
  estimatedCostCents: number;
  knowledgeIdsUsed: string[];
  cacheHit: boolean;
  shouldCreateLearningCandidate: boolean;
  safetyFlags: SafetyFlag[];
  eventId: string | null;
  savingsId: string | null;
  /** True when AI was needed but no provider was supplied (keyless). */
  needsThirdParty: boolean;
}

export async function resolveWithFirstPartyIntelligence(
  input: IntelligenceRequestInput,
  opts: ResolveOptions = {},
): Promise<IntelligenceDecision> {
  const settings = await getSettings();
  const req = normalizeIntelligenceRequest(input, settings);

  const base: IntelligenceDecision = {
    response: null, servedBy: 'none', confidenceScore: 0, thirdPartyAiUsed: false,
    providerUsed: null, modelUsed: null, tokensUsed: 0, estimatedCostCents: 0,
    knowledgeIdsUsed: [], cacheHit: false, shouldCreateLearningCandidate: false,
    safetyFlags: req.safetyFlags, eventId: null, savingsId: null, needsThirdParty: false,
  };

  // 1 · exact cache
  const cached = await findExactCacheMatch(req);
  if (cached) {
    await cacheRepo.update(cached.id, { usageCount: cached.usageCount + 1, lastHitAt: new Date().toISOString() });
    const savings = await recordTokenSavings({
      sourceFeature: req.feature, servedBy: 'exact-cache',
      avoidedProvider: cached.providerOriginallyUsed, avoidedModel: cached.modelOriginallyUsed,
      avoidedInputTokens: Math.round(cached.tokenCostOriginal * 0.7), avoidedOutputTokens: Math.round(cached.tokenCostOriginal * 0.3),
      costCents: cached.costCentsOriginal, relatedCacheId: cached.id, dataSource: 'real',
    });
    return { ...base, response: cached.response, servedBy: 'exact-cache', confidenceScore: cached.confidenceScore, cacheHit: true, savingsId: savings.id };
  }

  // 2 · canonical answer
  const canonical = await findCanonicalAnswer(req, settings);
  if (canonical) {
    const conf = scoreConfidence({ similarity: canonical.similarity, sourceConfidence: canonical.answer.confidenceScore });
    await canonicalRepo.update(canonical.answer.id, {
      usageCount: canonical.answer.usageCount + 1,
      aiCallsAvoided: canonical.answer.aiCallsAvoided + 1,
      lastValidatedAt: canonical.answer.lastValidatedAt,
    });
    const savings = await recordTokenSavings({
      sourceFeature: req.feature, servedBy: 'canonical-answer',
      avoidedProvider: 'anthropic', avoidedModel: null,
      avoidedInputTokens: 500, avoidedOutputTokens: 500, relatedCanonicalAnswerId: canonical.answer.id,
    });
    return { ...base, response: canonical.answer.canonicalAnswer, servedBy: 'canonical-answer', confidenceScore: conf, knowledgeIdsUsed: canonical.answer.sourceKnowledgeIds, savingsId: savings.id };
  }

  // 3 · deterministic rule engine (seam)
  if (opts.ruleEngine) {
    const ruled = await opts.ruleEngine(req);
    if (ruled) {
      const savings = await recordTokenSavings({
        sourceFeature: req.feature, servedBy: 'rule-engine', avoidedProvider: 'anthropic', avoidedModel: null,
        avoidedInputTokens: 400, avoidedOutputTokens: 300,
      });
      return { ...base, response: ruled, servedBy: 'rule-engine', confidenceScore: 0.9, savingsId: savings.id };
    }
  }

  // 4 · first-party knowledge retrieval
  const knowledge = await retrieveKnowledge(req, settings);
  const top = knowledge[0];
  if (top && !req.personalized) {
    const approved = top.item.validationStatus === 'approved';
    const conf = scoreConfidence({
      similarity: top.similarity, sourceConfidence: top.item.confidenceScore,
      successCount: top.item.successCount, failureCount: top.item.failureCount,
    });
    const blockedBySafety = top.item.safetyFlags.some((f) => settings.reviewRequiredSafetyFlags.includes(f));
    if (approved && conf >= settings.autoServeConfidenceThreshold && !blockedBySafety) {
      await knowledgeRepo.update(top.item.id, { usageCount: top.item.usageCount + 1, lastUsedAt: new Date().toISOString() });
      const savings = await recordTokenSavings({
        sourceFeature: req.feature, servedBy: 'retrieval', avoidedProvider: 'anthropic', avoidedModel: null,
        avoidedInputTokens: 600, avoidedOutputTokens: 500, relatedKnowledgeId: top.item.id,
      });
      return { ...base, response: top.item.canonicalAnswer, servedBy: 'knowledge', confidenceScore: conf, knowledgeIdsUsed: [top.item.id], savingsId: savings.id };
    }
  }

  // 5 · small/local/low-cost model — tried before paying a frontier model.
  if (opts.smallModel && !req.personalized) {
    const small = await opts.smallModel(req);
    if (small && small.text) {
      const savings = await recordTokenSavings({
        sourceFeature: req.feature, servedBy: 'small-model', avoidedProvider: 'anthropic', avoidedModel: null,
        avoidedInputTokens: 600, avoidedOutputTokens: 500,
      });
      return { ...base, response: small.text, servedBy: 'small-model', confidenceScore: small.confidence ?? 0.7, savingsId: savings.id };
    }
  }

  // 6 · third-party AI — nothing reliable was served above, so AI is needed.
  // (shouldUseThirdPartyAI stays exported for callers that want to pre-check a
  //  candidate confidence before even building a request.)
  if (!opts.callThirdParty) {
    // Keyless / dry-run: surface the best unserved knowledge match for context.
    return { ...base, knowledgeIdsUsed: top ? [top.item.id] : [], needsThirdParty: true, thirdPartyAiUsed: false };
  }

  const result = await opts.callThirdParty(req);
  const confidence = result.confidence ?? Math.max(MIN_TRUSTWORTHY_CONFIDENCE, 0.6);
  const event = await logAIActivity({
    req, provider: result.provider, model: result.model, response: result.text,
    inputTokens: result.inputTokens, outputTokens: result.outputTokens, costCents: result.costCents,
    latencyMs: result.latencyMs ?? null, confidenceScore: confidence,
  });

  let candidate: KnowledgeItem | null = null;
  if (opts.promoteToKnowledge !== false) {
    candidate = await createKnowledgeCandidate(event, result.text, settings);
  }

  return {
    ...base,
    response: result.text,
    servedBy: 'third-party-ai',
    confidenceScore: confidence,
    thirdPartyAiUsed: true,
    providerUsed: result.provider,
    modelUsed: result.model,
    tokensUsed: result.inputTokens + result.outputTokens,
    estimatedCostCents: event.estimatedCostCents,
    knowledgeIdsUsed: candidate ? [candidate.id] : [],
    shouldCreateLearningCandidate: candidate !== null,
    eventId: event.id,
  };
}

// ── Cache writeback helper (callers store high-confidence reusable answers) ──
export async function upsertCacheEntry(input: {
  req: NormalizedRequest; response: string; responseType: AnswerFormat;
  provider: Provider | null; model: string | null; tokens: number; costCents: number; confidence: number; ttlHours?: number;
}): Promise<AnswerCacheEntry | null> {
  if (input.req.personalized) return null; // never cache personalized answers globally
  const settings = await getSettings();
  const ttl = input.ttlHours ?? settings.cacheTtlHours;
  const now = new Date();
  const entry: AnswerCacheEntry = {
    id: genId('cache'),
    cacheKey: input.req.cacheKey,
    semanticFingerprint: input.req.semanticFp,
    requestSummary: input.req.summary,
    response: input.response,
    responseType: input.responseType,
    confidenceScore: input.confidence,
    source: 'exact-cache',
    providerOriginallyUsed: input.provider,
    modelOriginallyUsed: input.model,
    tokenCostOriginal: input.tokens,
    costCentsOriginal: input.costCents,
    personalized: false,
    safetyFlags: input.req.safetyFlags,
    usageCount: 0,
    lastHitAt: null,
    expiresAt: ttl > 0 ? new Date(now.getTime() + ttl * 3600_000).toISOString() : null,
    invalidationReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return cacheRepo.create(entry);
}
