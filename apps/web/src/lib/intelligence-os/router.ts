// ============================================================
// First-Party Intelligence OS — the intelligence router
// ------------------------------------------------------------
// resolveWithFirstPartyIntelligence() is the seam existing AI features adopt
// gradually. It tries the cheapest reliable path first and only falls through
// to a third-party model for genuine novelty/uncertainty:
//
//   1. Exact answer cache      2. Canonical first-party answer
//   3. Deterministic rules     4. Retrieval over first-party knowledge
//   5. (Small/local model)     6. Third-party AI (exception handler)
//
// Strategy framing: third-party models become *exception handlers, not the
// default engine*. Every avoided call is recorded in the token-savings ledger;
// every novel third-party answer becomes a knowledge candidate for promotion.
//
// The core functions are PURE (operate on passed-in arrays) so they're unit-
// testable without I/O. resolve() composes them with injectable deps that
// default to the real store.
// ============================================================

import { semanticFingerprint, textSimilarity, stableHash } from './fingerprint';
import { classifySensitivity, canAutoServe, redactPii, hashUserId, type Sensitivity } from './privacy';
import type {
  AnswerCache, CanonicalAnswer, KnowledgeItem, IntelligenceSettings,
  AiActivityEvent, AnswerFormat, Sport, AiSource,
} from './types';
import {
  cacheRepo, canonicalRepo, knowledgeRepo, aiEventsRepo, tokenSavingsRepo, getSettings,
} from './store';
import { fingerprint } from './fingerprint';

// ── Request / response shapes ─────────────────────────────────
export interface IntelligenceRequest {
  query: string;
  feature: string;
  source: AiSource;
  sport?: Sport | null;
  userId?: string | null;
  /** Caller knows this references a single user's private data. */
  personalized?: boolean;
  answerFormat?: AnswerFormat;
}

export interface NormalizedRequest {
  query: string;
  redactedQuery: string;
  feature: string;
  source: AiSource;
  sport: Sport | null;
  userIdHash: string | null;
  semanticFp: string;
  sensitivity: Sensitivity;
  answerFormat: AnswerFormat;
}

export type ServedBy =
  | 'Exact Cache' | 'Canonical Answer' | 'Rule Engine' | 'Retrieval'
  | 'Small Model' | 'Third-Party AI' | 'Needs Third-Party AI';

export interface IntelligenceDecision {
  response: string | null;
  servedBy: ServedBy;
  confidenceScore: number | null;
  thirdPartyAiUsed: boolean;
  providerUsed: string | null;
  modelUsed: string | null;
  tokensUsed: number | null;
  estimatedCost: number | null;
  knowledgeIdsUsed: string[];
  cacheHit: boolean;
  shouldCreateLearningCandidate: boolean;
  safetyFlags: string[];
  /** When AI was needed but no provider callback was supplied. */
  needsThirdParty: boolean;
}

// ── 1. Normalize ──────────────────────────────────────────────
export function normalizeIntelligenceRequest(req: IntelligenceRequest): NormalizedRequest {
  const query = (req.query || '').trim();
  return {
    query,
    redactedQuery: redactPii(query),
    feature: req.feature,
    source: req.source,
    sport: req.sport ?? null,
    userIdHash: hashUserId(req.userId),
    semanticFp: semanticFingerprint(query),
    sensitivity: classifySensitivity(query, req.personalized ?? false),
    answerFormat: req.answerFormat ?? 'Coaching Response',
  };
}

// ── 2. Exact cache ────────────────────────────────────────────
export function findExactCacheMatch(
  req: NormalizedRequest,
  caches: AnswerCache[],
  now = Date.now(),
): AnswerCache | null {
  const key = `${req.semanticFp}:${req.sport ?? 'any'}`;
  const altKey = req.semanticFp;
  for (const c of caches) {
    if (c.cacheKey !== key && c.cacheKey !== altKey && c.semanticFingerprint !== req.semanticFp) continue;
    if (c.invalidationReason) continue;
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now) continue;
    // Sensitive/personalized cache entries are never reused globally.
    if (!canAutoServe(c.sensitivity) && req.sensitivity !== c.sensitivity) continue;
    return c;
  }
  return null;
}

// ── 3. Canonical answer ───────────────────────────────────────
export function findCanonicalAnswer(
  req: NormalizedRequest,
  answers: CanonicalAnswer[],
  settings: Pick<IntelligenceSettings, 'autoServeThreshold' | 'semanticMatchThreshold'>,
): CanonicalAnswer | null {
  const ql = req.query.toLowerCase();
  let best: CanonicalAnswer | null = null;
  let bestScore = 0;
  for (const a of answers) {
    if (a.sport && req.sport && a.sport !== req.sport) continue;
    if (!a.allowedAutoServe) continue;
    if (!canAutoServe(a.sensitivity)) continue;
    // Trigger-phrase hit is a strong exact-ish signal.
    const phraseHit = a.triggerPhrases.some((p) => ql.includes(p.toLowerCase()));
    const sim = a.semanticFingerprint === req.semanticFp
      ? 1
      : textSimilarity(req.query, a.canonicalQuestion);
    const score = phraseHit ? Math.max(sim, 0.9) : sim;
    const conf = a.confidenceScore ?? 0;
    if (score >= settings.semanticMatchThreshold && conf >= settings.autoServeThreshold && score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

// ── 4. Retrieval over knowledge ───────────────────────────────
export function retrieveKnowledge(
  req: NormalizedRequest,
  items: KnowledgeItem[],
  limit = 3,
): Array<{ item: KnowledgeItem; score: number }> {
  return items
    .filter((k) => !k.archived && k.validationStatus !== 'Rejected')
    .map((item) => ({ item, score: textSimilarity(req.query, `${item.canonicalQuestion} ${item.topic} ${item.tags.join(' ')}`) }))
    .filter((r) => r.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ── 5/6. Confidence + decision to escalate ────────────────────
export function scoreConfidence(signals: {
  cacheHit?: boolean;
  canonicalConf?: number | null;
  retrievalTopScore?: number;
}): number {
  if (signals.cacheHit) return 0.95;
  if (signals.canonicalConf != null) return signals.canonicalConf;
  return Math.min(0.7, signals.retrievalTopScore ?? 0);
}

export function shouldUseThirdPartyAI(
  confidence: number,
  settings: Pick<IntelligenceSettings, 'autoServeThreshold'>,
): boolean {
  return confidence < settings.autoServeThreshold;
}

// ── Cost model (estimate avoided spend honestly) ──────────────
// Rough blended public rate; used only for "estimated" savings, never billed.
const COST_PER_1K_INPUT = 0.005;
const COST_PER_1K_OUTPUT = 0.015;
export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}

// ── Composed resolver (with injectable deps for tests) ────────
export interface ResolveDeps {
  caches: AnswerCache[];
  canonical: CanonicalAnswer[];
  knowledge: KnowledgeItem[];
  settings: Pick<IntelligenceSettings, 'autoServeThreshold' | 'semanticMatchThreshold'>;
  /** Optional adapter that actually calls a third-party model. */
  callThirdParty?: (req: NormalizedRequest) => Promise<{
    response: string; provider: string; model: string; inputTokens: number; outputTokens: number;
  }>;
}

/**
 * Pure orchestration: given the current first-party assets, decide how to
 * answer. No I/O — `resolve()` (below) wires this to the store + ledger.
 */
export async function decide(req: NormalizedRequest, deps: ResolveDeps): Promise<IntelligenceDecision> {
  const base: IntelligenceDecision = {
    response: null, servedBy: 'Needs Third-Party AI', confidenceScore: null,
    thirdPartyAiUsed: false, providerUsed: null, modelUsed: null, tokensUsed: null,
    estimatedCost: null, knowledgeIdsUsed: [], cacheHit: false,
    shouldCreateLearningCandidate: false, safetyFlags: [], needsThirdParty: false,
  };

  // 1. Exact cache
  const cache = findExactCacheMatch(req, deps.caches);
  if (cache) {
    return { ...base, response: cache.response, servedBy: 'Exact Cache', cacheHit: true, confidenceScore: 0.95 };
  }

  // 2. Canonical answer
  const canonical = findCanonicalAnswer(req, deps.canonical, deps.settings);
  if (canonical) {
    return {
      ...base, response: canonical.canonicalAnswer, servedBy: 'Canonical Answer',
      confidenceScore: canonical.confidenceScore, knowledgeIdsUsed: canonical.sourceKnowledgeIds,
    };
  }

  // 3. Rule engine (deterministic) — none registered yet; seam reserved.

  // 4. Retrieval — strong match can answer directly from approved knowledge.
  const retrieved = retrieveKnowledge(req, deps.knowledge);
  const top = retrieved[0];
  if (top && top.score >= deps.settings.semanticMatchThreshold && top.item.validationStatus === 'Approved') {
    return {
      ...base, response: top.item.canonicalAnswer, servedBy: 'Retrieval',
      confidenceScore: scoreConfidence({ retrievalTopScore: top.score }),
      knowledgeIdsUsed: [top.item.id],
    };
  }

  // 5/6. Escalate to third-party AI (the exception path).
  const confidence = scoreConfidence({ retrievalTopScore: top?.score ?? 0 });
  if (!shouldUseThirdPartyAI(confidence, deps.settings)) {
    // Confidence high enough on retrieval even if below match threshold.
    if (top) {
      return {
        ...base, response: top.item.canonicalAnswer, servedBy: 'Retrieval',
        confidenceScore: confidence, knowledgeIdsUsed: [top.item.id],
      };
    }
  }

  if (!deps.callThirdParty) {
    // Honest: AI is needed but no provider supplied — never fabricate an answer.
    return { ...base, needsThirdParty: true, servedBy: 'Needs Third-Party AI' };
  }

  const ai = await deps.callThirdParty(req);
  return {
    ...base, response: ai.response, servedBy: 'Third-Party AI', thirdPartyAiUsed: true,
    providerUsed: ai.provider, modelUsed: ai.model, tokensUsed: ai.inputTokens + ai.outputTokens,
    estimatedCost: estimateCost(ai.inputTokens, ai.outputTokens), confidenceScore: 0.6,
    // Novel third-party answers are reuse candidates IF non-sensitive.
    shouldCreateLearningCandidate: canAutoServe(req.sensitivity),
  };
}

// ── logAIActivity / recordTokenSavings / candidate creation ───
export async function logAIActivity(input: {
  req: NormalizedRequest;
  decision: IntelligenceDecision;
  responseSummary: string;
}): Promise<AiActivityEvent> {
  const now = new Date().toISOString();
  const { req, decision } = input;
  const event: AiActivityEvent = {
    id: `evt-${stableHash(`${req.semanticFp}:${now}`)}`,
    dataSource: 'real', createdAt: now, updatedAt: now,
    sourceSystem: req.source, feature: req.feature, sport: req.sport,
    userIntent: req.redactedQuery.slice(0, 120),
    promptHash: req.semanticFp, promptSummary: req.redactedQuery.slice(0, 200),
    responseHash: semanticFingerprint(input.responseSummary), responseSummary: input.responseSummary.slice(0, 280),
    provider: decision.providerUsed, model: decision.modelUsed,
    inputTokens: null, outputTokens: decision.tokensUsed, estimatedCost: decision.estimatedCost,
    latencyMs: null, status: decision.needsThirdParty ? 'skipped' : 'ok',
    confidenceScore: decision.confidenceScore, safetyFlags: decision.safetyFlags, qualityScore: null,
    userFeedback: 'none', adminFeedback: 'none', relatedUserIdHash: req.userIdHash,
    relatedSessionId: null, relatedVideoId: null, relatedReportId: null, relatedTaskId: null,
    fingerprint: fingerprint({ category: req.source, feature: req.feature, sport: req.sport, signature: req.query } as never),
    reusePotential: decision.shouldCreateLearningCandidate ? 0.6 : 0.2,
  };
  await aiEventsRepo.create(event);
  return event;
}

export async function recordTokenSavings(input: {
  decision: IntelligenceDecision;
  feature: string;
  avoidedProvider?: string | null;
  avoidedModel?: string | null;
  avoidedInputTokens?: number;
  avoidedOutputTokens?: number;
}): Promise<void> {
  if (input.decision.thirdPartyAiUsed || input.decision.needsThirdParty) return; // nothing avoided
  const avoidedIn = input.avoidedInputTokens ?? 800;
  const avoidedOut = input.avoidedOutputTokens ?? 500;
  const now = new Date().toISOString();
  const servedBy = input.decision.servedBy;
  const eventType = servedBy === 'Exact Cache' ? 'cache_hit'
    : servedBy === 'Canonical Answer' ? 'canonical_served'
    : servedBy === 'Rule Engine' ? 'rule_served' : 'retrieval_served';
  await tokenSavingsRepo.create({
    id: `ts-${stableHash(`${input.feature}:${now}:${Math.random()}`)}`,
    dataSource: 'real', createdAt: now, updatedAt: now,
    eventType, sourceFeature: input.feature,
    avoidedProvider: input.avoidedProvider ?? null, avoidedModel: input.avoidedModel ?? null,
    avoidedInputTokens: avoidedIn, avoidedOutputTokens: avoidedOut,
    estimatedCostSaved: estimateCost(avoidedIn, avoidedOut),
    servedBy: servedBy === 'Third-Party AI' || servedBy === 'Needs Third-Party AI' || servedBy === 'Small Model'
      ? 'Retrieval' : servedBy,
    relatedCacheId: null, relatedKnowledgeId: input.decision.knowledgeIdsUsed[0] ?? null,
    relatedCanonicalAnswerId: null,
  });
}

/**
 * Top-level entry point. Normalizes, decides using live first-party assets,
 * logs the activity, and records token savings when AI was avoided.
 */
export async function resolveWithFirstPartyIntelligence(
  req: IntelligenceRequest,
  callThirdParty?: ResolveDeps['callThirdParty'],
): Promise<{ decision: IntelligenceDecision; event: AiActivityEvent; normalized: NormalizedRequest }> {
  const normalized = normalizeIntelligenceRequest(req);
  const [caches, canonical, knowledge, settings] = await Promise.all([
    cacheRepo.list(), canonicalRepo.list(), knowledgeRepo.list(), getSettings(),
  ]);
  const decision = await decide(normalized, { caches, canonical, knowledge, settings, callThirdParty });
  const event = await logAIActivity({
    req: normalized, decision, responseSummary: decision.response ?? '(escalated to third-party AI)',
  });
  await recordTokenSavings({ decision, feature: req.feature });
  return { decision, event, normalized };
}
