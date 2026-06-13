// ============================================================
// SwingVantage — First-Party Intelligence OS · admin service layer (SERVER-ONLY)
// ------------------------------------------------------------
// Admin-facing operations used by the API routes: promote an event to a
// knowledge candidate, review/approve/reject/archive knowledge, create &
// approve canonical answers, record evaluations, and export knowledge.
// Every caller is already behind requireAdmin().
// ============================================================

import {
  activityRepo, knowledgeRepo, canonicalRepo, patternRepo, evaluationRepo, taskRepo, getSettings,
} from './store';
import type { ActionTask } from './types';
import { genId } from './router';
import { knowledgeFingerprint, semanticFingerprint, summarize } from './fingerprint';
import { embedText, isEmbeddingsConfigured, currentEmbeddingModel } from './embeddings';

/** Best-effort embedding — null when keyless or on error (never throws). */
async function embedIfConfigured(text: string): Promise<number[] | null> {
  if (!isEmbeddingsConfigured()) return null;
  try { return await embedText(text); } catch { return null; }
}

/**
 * Best-effort embedding plus the model that produced it. `embeddingModel` is
 * non-null only when a vector was produced, so it stays in lock-step with
 * `embedding` and lets backfill detect a model change later.
 */
async function embedWithModel(text: string): Promise<{ embedding: number[] | null; embeddingModel: string | null }> {
  const embedding = await embedIfConfigured(text);
  return { embedding, embeddingModel: embedding ? currentEmbeddingModel() : null };
}
import type {
  KnowledgeItem, CanonicalAnswer, EvaluationRecord, AnswerFormat, ValidationStatus, SafetyFlag, Audience,
} from './types';

// ── Knowledge ─────────────────────────────────────────────────
export async function promoteEventToKnowledge(eventId: string): Promise<KnowledgeItem | null> {
  const event = await activityRepo.get(eventId);
  if (!event) return null;
  const settings = await getSettings();
  const { createKnowledgeCandidate } = await import('./router');
  // Use the stored response summary as the answer basis when the full text isn't retained.
  return createKnowledgeCandidate(event, event.responseSummary, { ...settings, knowledgePromotionThreshold: 0 });
}

export interface CreateKnowledgeInput {
  title: string; knowledgeType: KnowledgeItem['knowledgeType']; sport: KnowledgeItem['sport'];
  topic: string; userIntent: string; canonicalQuestion: string; canonicalAnswer: string;
  shortAnswer?: string; structuredSteps?: string[]; evidenceSummary?: string;
  confidenceScore?: number; safetyFlags?: SafetyFlag[];
}

export async function createKnowledge(input: CreateKnowledgeInput): Promise<KnowledgeItem> {
  const now = new Date().toISOString();
  const { embedding, embeddingModel } = await embedWithModel(input.canonicalQuestion);
  const item: KnowledgeItem = {
    id: genId('know'),
    title: input.title,
    knowledgeType: input.knowledgeType,
    sport: input.sport,
    topic: input.topic,
    userIntent: input.userIntent,
    canonicalQuestion: input.canonicalQuestion,
    canonicalAnswer: input.canonicalAnswer,
    shortAnswer: input.shortAnswer ?? summarize(input.canonicalAnswer, 160),
    structuredSteps: input.structuredSteps ?? [],
    evidenceSummary: input.evidenceSummary ?? 'Manually authored by admin.',
    fingerprint: knowledgeFingerprint({ userIntent: input.userIntent, sport: input.sport, topic: input.topic, answer: input.canonicalAnswer }),
    sourceEventIds: [],
    sourceReportIds: [],
    sourceTaskIds: [],
    confidenceScore: input.confidenceScore ?? 0.7,
    validationStatus: 'needs-review',
    approvedByAdmin: null,
    safetyFlags: input.safetyFlags ?? [],
    usageCount: 0,
    successCount: 0,
    failureCount: 0,
    lastUsedAt: null,
    embedding,
    embeddingModel,
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
  return knowledgeRepo.create(item);
}

export async function reviewKnowledge(id: string, status: ValidationStatus, adminEmail: string | null): Promise<KnowledgeItem | undefined> {
  const patch: Partial<KnowledgeItem> = { validationStatus: status };
  if (status === 'approved') {
    patch.approvedByAdmin = adminEmail;
    // Compute the embedding on approval so it's ready for retrieval.
    const existing = await knowledgeRepo.get(id);
    if (existing && !existing.embedding) {
      const { embedding, embeddingModel } = await embedWithModel(existing.canonicalQuestion);
      patch.embedding = embedding;
      patch.embeddingModel = embeddingModel;
    }
  }
  if (status === 'archived') patch.archived = true;
  return knowledgeRepo.update(id, patch);
}

export async function updateKnowledge(id: string, patch: Partial<KnowledgeItem>): Promise<KnowledgeItem | undefined> {
  // Recompute fingerprint if answer-bearing fields changed.
  const existing = await knowledgeRepo.get(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...patch };
  merged.fingerprint = knowledgeFingerprint({ userIntent: merged.userIntent, sport: merged.sport, topic: merged.topic, answer: merged.canonicalAnswer });
  const finalPatch: Partial<KnowledgeItem> = { ...patch, fingerprint: merged.fingerprint };
  if (patch.canonicalQuestion && patch.canonicalQuestion !== existing.canonicalQuestion) {
    const { embedding, embeddingModel } = await embedWithModel(patch.canonicalQuestion);
    finalPatch.embedding = embedding;
    finalPatch.embeddingModel = embeddingModel;
  }
  return knowledgeRepo.update(id, finalPatch);
}

/** Record a positive/negative reuse outcome → adjusts confidence honestly. */
export async function recordKnowledgeOutcome(id: string, outcome: 'success' | 'failure'): Promise<KnowledgeItem | undefined> {
  const k = await knowledgeRepo.get(id);
  if (!k) return undefined;
  const delta = outcome === 'success' ? 0.03 : -0.08;
  return knowledgeRepo.update(id, {
    successCount: k.successCount + (outcome === 'success' ? 1 : 0),
    failureCount: k.failureCount + (outcome === 'failure' ? 1 : 0),
    confidenceScore: Number(Math.max(0, Math.min(1, k.confidenceScore + delta)).toFixed(3)),
  });
}

// ── Canonical answers ─────────────────────────────────────────
export interface CreateCanonicalInput {
  canonicalQuestion: string; canonicalAnswer: string; answerFormat: AnswerFormat;
  topic: string; sport: CanonicalAnswer['sport']; audience: Audience;
  triggerPhrases?: string[]; confidenceScore?: number; allowedAutoServe?: boolean;
  requiresAdminReview?: boolean; safetyFlags?: SafetyFlag[]; sourceKnowledgeIds?: string[];
  regressionTestCases?: CanonicalAnswer['regressionTestCases'];
}

export async function createCanonicalAnswer(input: CreateCanonicalInput): Promise<CanonicalAnswer> {
  const now = new Date().toISOString();
  const { embedding, embeddingModel } = await embedWithModel(input.canonicalQuestion);
  const answer: CanonicalAnswer = {
    id: genId('canon'),
    canonicalQuestion: input.canonicalQuestion,
    canonicalAnswer: input.canonicalAnswer,
    answerFormat: input.answerFormat,
    topic: input.topic,
    sport: input.sport,
    audience: input.audience,
    triggerPhrases: input.triggerPhrases ?? [],
    semanticFingerprint: semanticFingerprint(input.canonicalQuestion),
    confidenceScore: input.confidenceScore ?? 0.8,
    allowedAutoServe: input.allowedAutoServe ?? false,
    requiresAdminReview: input.requiresAdminReview ?? true,
    safetyFlags: input.safetyFlags ?? [],
    sourceKnowledgeIds: input.sourceKnowledgeIds ?? [],
    regressionTestCases: input.regressionTestCases ?? [],
    validationStatus: 'needs-review',
    approvedByAdmin: null,
    lastValidatedAt: null,
    usageCount: 0,
    aiCallsAvoided: 0,
    tokensAvoided: 0,
    estimatedCostSavedCents: 0,
    embedding,
    embeddingModel,
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
  };
  return canonicalRepo.create(answer);
}

/** Promote an approved knowledge item into a (review-pending) canonical answer. */
export async function canonicalizeKnowledge(knowledgeId: string): Promise<CanonicalAnswer | null> {
  const k = await knowledgeRepo.get(knowledgeId);
  if (!k) return null;
  return createCanonicalAnswer({
    canonicalQuestion: k.canonicalQuestion,
    canonicalAnswer: k.canonicalAnswer,
    answerFormat: 'coaching-response',
    topic: k.topic,
    sport: k.sport,
    audience: 'athlete',
    confidenceScore: k.confidenceScore,
    safetyFlags: k.safetyFlags,
    sourceKnowledgeIds: [k.id],
  });
}

export async function reviewCanonical(id: string, status: ValidationStatus, adminEmail: string | null): Promise<CanonicalAnswer | undefined> {
  const patch: Partial<CanonicalAnswer> = { validationStatus: status, lastValidatedAt: new Date().toISOString() };
  if (status === 'approved') { patch.approvedByAdmin = adminEmail; patch.allowedAutoServe = true; }
  return canonicalRepo.update(id, patch);
}

export async function updateCanonical(id: string, patch: Partial<CanonicalAnswer>): Promise<CanonicalAnswer | undefined> {
  const next: Partial<CanonicalAnswer> = { ...patch };
  if (patch.canonicalQuestion) {
    next.semanticFingerprint = semanticFingerprint(patch.canonicalQuestion);
    const { embedding, embeddingModel } = await embedWithModel(patch.canonicalQuestion);
    next.embedding = embedding;
    next.embeddingModel = embeddingModel;
  }
  return canonicalRepo.update(id, next);
}

/**
 * Backfill embeddings on approved/usable records. Re-embeds rows that are
 * either missing a vector OR were embedded with a different model than the one
 * currently configured (`AI_EMBEDDINGS_MODEL`) — so a model upgrade refreshes
 * stored vectors instead of leaving a mismatched-dimension/space mix. Best-
 * effort; no-op when embeddings aren't configured. Returns how many of each
 * were (re-)embedded.
 */
export async function backfillEmbeddings(limit = 200): Promise<{ knowledge: number; canonical: number; backend: 'embeddings' | 'lexical' }> {
  if (!isEmbeddingsConfigured()) return { knowledge: 0, canonical: 0, backend: 'lexical' };
  const model = currentEmbeddingModel();
  const stale = (x: { embedding: number[] | null; embeddingModel: string | null }) => !x.embedding || x.embeddingModel !== model;
  let k = 0; let c = 0;
  const knowledge = (await knowledgeRepo.list()).filter((x) => !x.archived && stale(x)).slice(0, limit);
  for (const item of knowledge) {
    const vec = await embedIfConfigured(item.canonicalQuestion);
    if (vec) { await knowledgeRepo.update(item.id, { embedding: vec, embeddingModel: model }); k += 1; }
  }
  const canonical = (await canonicalRepo.list()).filter((x) => stale(x)).slice(0, limit);
  for (const item of canonical) {
    const vec = await embedIfConfigured(item.canonicalQuestion);
    if (vec) { await canonicalRepo.update(item.id, { embedding: vec, embeddingModel: model }); c += 1; }
  }
  return { knowledge: k, canonical: c, backend: 'embeddings' };
}

export async function invalidateCanonical(id: string, reason: string): Promise<CanonicalAnswer | undefined> {
  return canonicalRepo.update(id, { validationStatus: 'superseded', allowedAutoServe: false, lastValidatedAt: new Date().toISOString(), evidenceSummary: reason } as Partial<CanonicalAnswer>);
}

// ── Evaluations ───────────────────────────────────────────────
export interface CreateEvaluationInput {
  evaluatedObjectType: EvaluationRecord['evaluatedObjectType'];
  evaluatedObjectId: string;
  evaluatorType: EvaluationRecord['evaluatorType'];
  evaluatorRef?: string | null;
  scores: Partial<Pick<EvaluationRecord, 'scoreAccuracy' | 'scoreUsefulness' | 'scoreSafety' | 'scoreClarity' | 'scoreCompleteness' | 'scoreReusePotential' | 'scoreCostEfficiency'>>;
  notes?: string;
  recommendedAction?: EvaluationRecord['recommendedAction'];
}

export async function createEvaluation(input: CreateEvaluationInput): Promise<EvaluationRecord> {
  const s = input.scores;
  const vals = [s.scoreAccuracy, s.scoreUsefulness, s.scoreSafety, s.scoreClarity, s.scoreCompleteness, s.scoreReusePotential, s.scoreCostEfficiency]
    .map((v) => v ?? 0.5);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const record: EvaluationRecord = {
    id: genId('eval'),
    evaluatedObjectType: input.evaluatedObjectType,
    evaluatedObjectId: input.evaluatedObjectId,
    evaluatorType: input.evaluatorType,
    evaluatorRef: input.evaluatorRef ?? null,
    scoreAccuracy: vals[0], scoreUsefulness: vals[1], scoreSafety: vals[2], scoreClarity: vals[3],
    scoreCompleteness: vals[4], scoreReusePotential: vals[5], scoreCostEfficiency: vals[6],
    passFail: avg >= 0.6 ? 'pass' : 'fail',
    notes: input.notes ?? '',
    recommendedAction: input.recommendedAction ?? 'none',
    dataSource: 'real',
    createdAt: new Date().toISOString(),
  };
  return evaluationRepo.create(record);
}

// ── Pattern → fix packet ──────────────────────────────────────
export interface FixPacket {
  title: string;
  markdownPrompt: string;
  jsonContext: Record<string, unknown>;
  acceptanceCriteria: string[];
  regressionTests: string[];
  relatedKnowledgeIds: string[];
  relatedEventIds: string[];
}

export async function generateFixPacketFromPattern(patternId: string): Promise<FixPacket | null> {
  const p = await patternRepo.get(patternId);
  if (!p) return null;
  const md = [
    `# Fix Packet — ${p.patternTitle}`,
    '',
    `**Pattern type:** ${p.patternType}`,
    `**Affected feature:** ${p.affectedFeature}${p.affectedRoute ? ` (${p.affectedRoute})` : ''}`,
    `**Occurrences:** ${p.occurrenceCount} · first seen ${p.firstSeenAt} · last seen ${p.lastSeenAt}`,
    '',
    '## Summary', p.summary, '',
    '## Recommended prevention', p.recommendedPrevention || '_TBD — admin to define._', '',
    '## Recommended automation', p.recommendedAutomation || '_TBD — admin to define._',
  ].join('\n');
  return {
    title: `Fix Packet — ${p.patternTitle}`,
    markdownPrompt: md,
    jsonContext: {
      patternId: p.id, patternType: p.patternType, affectedFeature: p.affectedFeature,
      affectedRoute: p.affectedRoute, occurrenceCount: p.occurrenceCount, sport: p.affectedSport,
    },
    acceptanceCriteria: [
      `The recurring issue "${p.patternTitle}" no longer reproduces on ${p.affectedFeature}.`,
      'A regression test covers the failure mode.',
      'Pattern status moves to resolved with evidence.',
    ],
    regressionTests: [`Reproduce ${p.patternTitle} and assert it is handled gracefully.`],
    relatedKnowledgeIds: p.relatedKnowledgeIds,
    relatedEventIds: p.relatedEventIds,
  };
}

// ── Export ────────────────────────────────────────────────────
export async function exportKnowledge(format: 'json' | 'markdown'): Promise<{ body: string; contentType: string; filename: string }> {
  const items = await knowledgeRepo.list();
  if (format === 'json') {
    return { body: JSON.stringify(items, null, 2), contentType: 'application/json', filename: 'intelligence-knowledge.json' };
  }
  const md = ['# SwingVantage — First-Party Knowledge Export', '', `_${items.length} items · generated ${new Date().toISOString()}_`, ''];
  for (const k of items) {
    md.push(`## ${k.title}`, '', `- **Type:** ${k.knowledgeType} · **Sport:** ${k.sport} · **Status:** ${k.validationStatus} · **Confidence:** ${k.confidenceScore}`,
      `- **Q:** ${k.canonicalQuestion}`, '', k.canonicalAnswer, '');
    if (k.structuredSteps.length) md.push('**Steps:**', ...k.structuredSteps.map((s, i) => `${i + 1}. ${s}`), '');
  }
  return { body: md.join('\n'), contentType: 'text/markdown', filename: 'intelligence-knowledge.md' };
}

// ── Task → Claude Code fix packet ─────────────────────────────
const PRODUCT_CONTEXT =
  'SwingVantage.com is a premium AI-powered multi-sport swing-improvement platform ' +
  '(golf, tennis, baseball, slow-pitch & fast-pitch softball, pickleball, padel). ' +
  'Core promise: "One fix. One plan. One retest." Keyless-first; never fabricate data; ' +
  'admin surfaces are admin-only + noindex.';

const DO_NOT_BREAK = [
  'Video uploads', 'Authentication', 'AI coach', 'Video analysis pipeline',
  'Gemini/OpenAI/Claude provider routing', 'Existing admin features', 'Public user experience',
];

/** A specific (not generic) Claude Code repair prompt for an Action Task. */
export function buildTaskRepairPrompt(task: ActionTask): string {
  const files = task.affectedFilePaths.length ? task.affectedFilePaths : ['(inspect via search — see Context)'];
  const repro = task.reproductionSteps.length ? task.reproductionSteps : ['(reproduction steps not yet captured)'];
  const accept = task.acceptanceCriteria.length ? task.acceptanceCriteria : ['Issue no longer reproduces', 'Regression tests added'];
  return [
    '# Claude Code Repair Prompt', '',
    '## Role',
    'You are an elite senior engineer and product-quality architect working on SwingVantage.com.', '',
    '## Objective',
    'Fix the specific issue below without breaking existing functionality.', '',
    '## Context', PRODUCT_CONTEXT, '',
    `- Affected feature: ${task.affectedFeature}`,
    `- Affected route: ${task.affectedRoute ?? 'unknown'}`,
    `- Affected component: ${task.affectedComponent ?? 'unknown'}`,
    `- Affected sport: ${task.affectedSport}`,
    `- Category: ${task.category} · Severity: ${task.severity} · Priority: ${task.priority}`,
    `- First detected: ${task.firstDetectedAt} · Occurrences: ${task.occurrenceCount}`, '',
    '## Problem', task.title, '', task.evidenceSummary || '_No evidence summary captured._', '',
    '## Evidence',
    `- Root-cause hypothesis: ${task.rootCauseHypothesis || 'unknown'}`,
    `- User impact: ${task.userImpact || 'unknown'}`,
    `- Business impact: ${task.businessImpact || 'unknown'}`,
    ...(task.aiQualityImpact ? [`- AI quality impact: ${task.aiQualityImpact}`] : []),
    `- Confidence: ${task.confidenceScore}`, '',
    '### Reproduction steps', ...repro.map((s, i) => `${i + 1}. ${s}`), '',
    '## Required Fix', task.suggestedNextAction || 'Diagnose the root cause and implement the smallest reversible fix.', '',
    '## Files to Inspect', ...files.map((f) => `- \`${f}\``), '',
    '## Tests to Run',
    '- Unit + integration tests for the affected module',
    '- Relevant Playwright/e2e flows if user-facing',
    '- `cd apps/web && npx tsc --noEmit && npm run lint && npx jest <area> --runInBand`', '',
    '## Acceptance Criteria', ...accept.map((a) => `- ${a}`), '',
    '## Do Not Break', ...DO_NOT_BREAK.map((d) => `- ${d}`), '',
    '## Deliverables',
    '- Code changes', '- Tests (incl. regression prevention)',
    '- Documentation updates if behavior changed', '- Update the Action OS task status when resolved',
  ].join('\n');
}

export async function generateFixPacketFromTask(taskId: string): Promise<FixPacket | null> {
  const task = await taskRepo.get(taskId);
  if (!task) return null;
  return {
    title: `Fix Packet — ${task.title}`,
    markdownPrompt: buildTaskRepairPrompt(task),
    jsonContext: {
      taskId: task.id, category: task.category, severity: task.severity, priority: task.priority,
      affectedFeature: task.affectedFeature, affectedRoute: task.affectedRoute,
      affectedComponent: task.affectedComponent, affectedFilePaths: task.affectedFilePaths,
      occurrenceCount: task.occurrenceCount, confidenceScore: task.confidenceScore,
      sport: task.affectedSport, doNotBreak: DO_NOT_BREAK,
    },
    acceptanceCriteria: task.acceptanceCriteria.length ? task.acceptanceCriteria : ['Issue no longer reproduces', 'Regression test added'],
    regressionTests: [`Reproduce "${task.title}" and assert it is handled gracefully.`],
    relatedKnowledgeIds: task.relatedKnowledgeIds,
    relatedEventIds: task.relatedEventIds,
  };
}

/** Render a FixPacket as a downloadable Markdown or JSON file. */
export function renderFixPacketFile(packet: FixPacket, format: 'markdown' | 'json'): { body: string; contentType: string; filename: string } {
  const slug = packet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'fix-packet';
  if (format === 'json') {
    return {
      body: JSON.stringify({ packetType: 'swingvantage-claude-code-fix-packet', generatedAt: new Date().toISOString(), ...packet }, null, 2),
      contentType: 'application/json',
      filename: `${slug}.json`,
    };
  }
  const md = [
    packet.markdownPrompt, '',
    '---', '',
    '## Acceptance criteria', ...packet.acceptanceCriteria.map((a) => `- [ ] ${a}`), '',
    '## Regression tests', ...packet.regressionTests.map((t) => `- ${t}`), '',
  ].join('\n');
  return { body: md, contentType: 'text/markdown', filename: `${slug}.md` };
}
