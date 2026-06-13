// ============================================================
// First-Party Intelligence OS — data models & schemas (single source of truth)
// ------------------------------------------------------------
// The strategic layer that lets SwingVantage learn from every AI interaction,
// report, fix and outcome so third-party models become *exception handlers*,
// not the default engine. Every model is zod-validated and stored as a JSONB
// record (kind-keyed) via ./store, which degrades to an in-process memory store
// when Supabase is unconfigured (keyless-first, like lib/growth/repository.ts).
//
// Honesty-first: every record carries a `dataSource` label so demo / pending
// data is never presented as real. NEVER fabricate metrics here.
// ============================================================

import { z } from 'zod';

// ── Honest data-source labels (CLAUDE.md house rule) ──────────
export const DataSource = z.enum([
  'real', // captured from a live system
  'demo', // illustrative seed data
  'manual', // hand-entered by an admin
  'integration_pending', // adapter exists, source not wired
  'awaiting_source', // no source yet
]);
export type DataSource = z.infer<typeof DataSource>;

export const SPORTS = [
  'golf', 'tennis', 'baseball', 'slow-pitch', 'fast-pitch', 'pickleball', 'padel', 'cross-sport',
] as const;
export const Sport = z.enum(SPORTS);
export type Sport = z.infer<typeof Sport>;

// ── Shared severity / priority / confidence scales ────────────
export const Severity = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type Severity = z.infer<typeof Severity>;

export const Priority = z.enum(['p0', 'p1', 'p2', 'p3']);
export type Priority = z.infer<typeof Priority>;

/** 0..1 normalized confidence. null = genuinely unknown (never fake 0). */
const confidence = z.number().min(0).max(1).nullable();

const baseRecord = {
  id: z.string(),
  dataSource: DataSource.default('demo'),
  createdAt: z.string(),
  updatedAt: z.string(),
};

// ============================================================
// 1. AI Activity Event — every meaningful AI interaction
// ============================================================
export const AiSource = z.enum([
  'AI Coach', 'Video Analysis', 'Drill Plan', 'Retest Plan', 'Admin Report',
  'SEO Audit', 'UX Audit', 'Support Response', 'Claude Code Fix Packet', 'Manual Admin Entry',
]);
export type AiSource = z.infer<typeof AiSource>;

export const AiActivityEventSchema = z.object({
  ...baseRecord,
  sourceSystem: AiSource,
  feature: z.string(),
  sport: Sport.nullable(),
  userIntent: z.string(),
  promptHash: z.string(),
  promptSummary: z.string(),
  responseHash: z.string(),
  responseSummary: z.string(),
  provider: z.string().nullable(), // gemini / openai / anthropic / null
  model: z.string().nullable(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  estimatedCost: z.number().nonnegative().nullable(),
  latencyMs: z.number().nonnegative().nullable(),
  status: z.enum(['ok', 'error', 'fallback', 'skipped']),
  confidenceScore: confidence,
  safetyFlags: z.array(z.string()).default([]),
  qualityScore: confidence,
  userFeedback: z.enum(['positive', 'negative', 'none']).default('none'),
  adminFeedback: z.enum(['approved', 'rejected', 'none']).default('none'),
  relatedUserIdHash: z.string().nullable(), // hashed — never raw
  relatedSessionId: z.string().nullable(),
  relatedVideoId: z.string().nullable(),
  relatedReportId: z.string().nullable(),
  relatedTaskId: z.string().nullable(),
  fingerprint: z.string(),
  reusePotential: confidence,
});
export type AiActivityEvent = z.infer<typeof AiActivityEventSchema>;

// ============================================================
// 2. Knowledge Item — reusable first-party intelligence
// ============================================================
export const KnowledgeType = z.enum([
  'Coaching Answer', 'Swing Diagnosis Pattern', 'Drill Recommendation', 'Retest Recommendation',
  'Upload Fix', 'AI Quality Fix', 'UX Pattern', 'SEO Pattern', 'Revenue Pattern',
  'Support Answer', 'Technical Fix', 'Admin Operating Procedure', 'Claude Code Repair Pattern',
]);
export type KnowledgeType = z.infer<typeof KnowledgeType>;

export const ValidationStatus = z.enum([
  'Candidate', 'Needs Review', 'Approved', 'Rejected', 'Superseded', 'Archived',
]);
export type ValidationStatus = z.infer<typeof ValidationStatus>;

export const KnowledgeItemSchema = z.object({
  ...baseRecord,
  title: z.string(),
  knowledgeType: KnowledgeType,
  sport: Sport.nullable(),
  topic: z.string(),
  userIntent: z.string(),
  canonicalQuestion: z.string(),
  canonicalAnswer: z.string(),
  shortAnswer: z.string(),
  structuredSteps: z.array(z.string()).default([]),
  evidenceSummary: z.string(),
  sourceEventIds: z.array(z.string()).default([]),
  sourceReportIds: z.array(z.string()).default([]),
  sourceTaskIds: z.array(z.string()).default([]),
  confidenceScore: confidence,
  validationStatus: ValidationStatus,
  approvedByAdmin: z.boolean().default(false),
  usageCount: z.number().int().nonnegative().default(0),
  successCount: z.number().int().nonnegative().default(0),
  failureCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.string().nullable(),
  fingerprint: z.string(),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

// ============================================================
// 3. Canonical Answer — serve repeated questions without third-party AI
// ============================================================
export const AnswerFormat = z.enum([
  'Short Answer', 'Coaching Response', 'Step-by-Step Fix', 'Drill Plan', 'Retest Plan',
  'Admin Fix Prompt', 'Support Response', 'Report Summary', 'Technical Recommendation',
]);
export type AnswerFormat = z.infer<typeof AnswerFormat>;

export const CanonicalAnswerSchema = z.object({
  ...baseRecord,
  canonicalQuestion: z.string(),
  canonicalAnswer: z.string(),
  answerFormat: AnswerFormat,
  topic: z.string(),
  sport: Sport.nullable(),
  audience: z.string(),
  triggerPhrases: z.array(z.string()).default([]),
  semanticFingerprint: z.string(),
  confidenceScore: confidence,
  allowedAutoServe: z.boolean().default(false),
  requiresAdminReview: z.boolean().default(true),
  sourceKnowledgeIds: z.array(z.string()).default([]),
  regressionTestCases: z.array(z.object({ input: z.string(), expectsIncludes: z.string() })).default([]),
  lastValidatedAt: z.string().nullable(),
  usageCount: z.number().int().nonnegative().default(0),
  aiCallsAvoided: z.number().int().nonnegative().default(0),
  tokensAvoided: z.number().int().nonnegative().default(0),
  estimatedCostSaved: z.number().nonnegative().default(0),
  // Safety gating — sensitive content is never auto-served globally.
  sensitivity: z.enum(['general', 'youth', 'medical', 'legal', 'privacy', 'personalized']).default('general'),
});
export type CanonicalAnswer = z.infer<typeof CanonicalAnswerSchema>;

// ============================================================
// 4. Pattern Memory — recurring issues / questions / opportunities
// ============================================================
export const PatternType = z.enum([
  'Recurring User Question', 'Recurring Swing Fault', 'Recurring Drill Recommendation',
  'Recurring Upload Issue', 'Recurring AI Quality Issue', 'Recurring UX Friction',
  'Recurring Conversion Drop-Off', 'Recurring SEO Gap', 'Recurring Revenue Opportunity',
  'Recurring Technical Bug', 'Recurring Admin Fix', 'Recurring Claude Code Repair Pattern',
]);
export type PatternType = z.infer<typeof PatternType>;

export const PatternStatus = z.enum(['Open', 'Monitoring', 'Mitigated', 'Resolved', 'Archived']);
export type PatternStatus = z.infer<typeof PatternStatus>;

export const PatternMemorySchema = z.object({
  ...baseRecord,
  patternTitle: z.string(),
  patternType: PatternType,
  summary: z.string(),
  fingerprint: z.string(),
  affectedFeature: z.string().nullable(),
  affectedSport: Sport.nullable(),
  affectedRoute: z.string().nullable(),
  occurrenceCount: z.number().int().nonnegative().default(1),
  firstSeenAt: z.string(),
  lastSeenAt: z.string(),
  evidenceCount: z.number().int().nonnegative().default(0),
  confidenceScore: confidence,
  recommendedPrevention: z.string(),
  recommendedAutomation: z.string(),
  relatedKnowledgeIds: z.array(z.string()).default([]),
  relatedEventIds: z.array(z.string()).default([]),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedReportIds: z.array(z.string()).default([]),
  status: PatternStatus,
  tags: z.array(z.string()).default([]),
});
export type PatternMemory = z.infer<typeof PatternMemorySchema>;

// ============================================================
// 5. Answer Cache — high-confidence repeated answers
// ============================================================
export const CacheServedBy = z.enum([
  'Exact Cache', 'Canonical Answer', 'Rule Engine', 'Retrieval', 'Small Model', 'Manual Admin Knowledge',
]);
export type CacheServedBy = z.infer<typeof CacheServedBy>;

export const AnswerCacheSchema = z.object({
  ...baseRecord,
  cacheKey: z.string(),
  semanticFingerprint: z.string(),
  requestSummary: z.string(),
  response: z.string(),
  responseType: AnswerFormat,
  confidenceScore: confidence,
  source: CacheServedBy,
  providerOriginallyUsed: z.string().nullable(),
  modelOriginallyUsed: z.string().nullable(),
  tokenCostOriginal: z.number().int().nonnegative().nullable(),
  usageCount: z.number().int().nonnegative().default(0),
  lastHitAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  invalidationReason: z.string().nullable(),
  sensitivity: z.enum(['general', 'youth', 'medical', 'legal', 'privacy', 'personalized']).default('general'),
});
export type AnswerCache = z.infer<typeof AnswerCacheSchema>;

// ============================================================
// 6. Evaluation Record — is an output good enough to reuse?
// ============================================================
export const EvaluatorType = z.enum([
  'User Feedback', 'Admin Review', 'Automated Heuristic', 'Retest Outcome',
  'Report Outcome', 'Error-Free Reuse', 'Manual QA',
]);
export type EvaluatorType = z.infer<typeof EvaluatorType>;

export const EvaluationRecordSchema = z.object({
  ...baseRecord,
  evaluatedObjectType: z.enum(['ai_event', 'knowledge', 'canonical_answer', 'cache']),
  evaluatedObjectId: z.string(),
  evaluatorType: EvaluatorType,
  scoreAccuracy: confidence,
  scoreUsefulness: confidence,
  scoreSafety: confidence,
  scoreClarity: confidence,
  scoreCompleteness: confidence,
  scoreReusePotential: confidence,
  scoreCostEfficiency: confidence,
  passFail: z.enum(['pass', 'fail', 'inconclusive']),
  notes: z.string(),
  recommendedAction: z.string(),
});
export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;

// ============================================================
// 7. Token Savings Ledger — business impact
// ============================================================
export const TokenSavingsEntrySchema = z.object({
  ...baseRecord,
  eventType: z.enum(['cache_hit', 'canonical_served', 'rule_served', 'retrieval_served']),
  sourceFeature: z.string(),
  avoidedProvider: z.string().nullable(),
  avoidedModel: z.string().nullable(),
  avoidedInputTokens: z.number().int().nonnegative().default(0),
  avoidedOutputTokens: z.number().int().nonnegative().default(0),
  estimatedCostSaved: z.number().nonnegative().default(0),
  servedBy: CacheServedBy,
  relatedCacheId: z.string().nullable(),
  relatedKnowledgeId: z.string().nullable(),
  relatedCanonicalAnswerId: z.string().nullable(),
});
export type TokenSavingsEntry = z.infer<typeof TokenSavingsEntrySchema>;

// ============================================================
// 8. Action Task — the Action OS layer (clickable priority items)
// ============================================================
export const TaskStatus = z.enum([
  'New', 'Triaged', 'In Progress', 'Waiting', 'Needs Review',
  'Fixed', 'Verified', 'Monitoring', 'Archived', 'Ignored',
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskCategory = z.enum([
  'Upload', 'Authentication', 'Video Analysis', 'AI Coach', 'Report Generation',
  'Player Dashboard', 'Admin Dashboard', 'Payments / Monetization', 'Ads / Revenue',
  'SEO / AEO / GEO', 'Performance', 'Mobile UX', 'Accessibility', 'Privacy', 'Security',
  'Database', 'API', 'Model Routing', 'Prompt Quality', 'Conversion Funnel', 'Retention',
  'Engagement', 'Content Gap', 'Opportunity', 'Bug', 'Technical Debt', 'Growth',
]);
export type TaskCategory = z.infer<typeof TaskCategory>;

export const ActionTaskSchema = z.object({
  ...baseRecord,
  title: z.string(),
  severity: Severity,
  priority: Priority,
  status: TaskStatus,
  category: TaskCategory,
  source: z.string(),
  affectedFeature: z.string().nullable(),
  affectedSport: Sport.nullable(),
  affectedRoute: z.string().nullable(),
  affectedComponent: z.string().nullable(),
  affectedFilePaths: z.array(z.string()).default([]),
  owner: z.string().nullable(),
  firstDetectedAt: z.string(),
  lastDetectedAt: z.string(),
  occurrenceCount: z.number().int().nonnegative().default(1),
  suggestedNextAction: z.string(),
  rootCauseHypothesis: z.string(),
  evidenceSummary: z.string(),
  userImpact: z.string(),
  businessImpact: z.string(),
  revenueImpact: z.string().nullable(),
  brandTrustImpact: z.string().nullable(),
  aiQualityImpact: z.string().nullable(),
  confidenceScore: confidence,
  fixComplexity: z.enum(['trivial', 'small', 'medium', 'large', 'unknown']).default('unknown'),
  estimatedEffort: z.string().nullable(),
  dependencies: z.array(z.string()).default([]),
  relatedTasks: z.array(z.string()).default([]),
  relatedReports: z.array(z.string()).default([]),
  relatedEvents: z.array(z.string()).default([]),
  reproductionSteps: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  resolutionNotes: z.string().nullable(),
  internalLearningTags: z.array(z.string()).default([]),
  notes: z.array(z.object({ at: z.string(), author: z.string(), body: z.string() })).default([]),
  history: z.array(z.object({ at: z.string(), event: z.string(), detail: z.string().optional() })).default([]),
  fingerprint: z.string(),
  archived: z.boolean().default(false),
});
export type ActionTask = z.infer<typeof ActionTaskSchema>;

// ============================================================
// 9. Action Report — durable, retention-tiered findings
// ============================================================
export const ReportType = z.enum([
  'System Health Report', 'AI Quality Report', 'Video Analysis Report', 'Upload Reliability Report',
  'Login / Auth Report', 'SEO / AEO / GEO Report', 'UX Friction Report', 'Conversion Funnel Report',
  'Revenue Opportunity Report', 'Ads Monetization Report', 'Privacy / Security Report',
  'Performance Report', 'Accessibility Report', 'Feature Gap Report', 'Growth Opportunity Report',
  'Admin Operations Report', 'User Journey Report',
]);
export type ReportType = z.infer<typeof ReportType>;

export const ReportLifecycle = z.enum([
  'Generated', 'Reviewed', 'Converted to Tasks', 'In Progress', 'Partially Resolved',
  'Resolved', 'Monitoring', 'Archived', 'Superseded', 'Deleted',
]);
export type ReportLifecycle = z.infer<typeof ReportLifecycle>;

export const RetentionTier = z.enum(['hot', 'warm', 'cold']);
export type RetentionTier = z.infer<typeof RetentionTier>;

export const ActionReportSchema = z.object({
  ...baseRecord,
  title: z.string(),
  type: ReportType,
  source: z.string(),
  lifecycleStatus: ReportLifecycle,
  severitySummary: z.string(),
  prioritySummary: z.string(),
  executiveSummary: z.string(),
  findings: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: Severity,
    detail: z.string(),
    recommendation: z.string(),
  })).default([]),
  generatedTaskIds: z.array(z.string()).default([]),
  generatedOpportunityIds: z.array(z.string()).default([]),
  evidenceReferences: z.array(z.string()).default([]),
  recommendedActions: z.array(z.string()).default([]),
  internalLearningTags: z.array(z.string()).default([]),
  searchMetadata: z.string(),
  retentionTier: RetentionTier.default('hot'),
  storageSizeEstimate: z.number().int().nonnegative().default(0),
  duplicateGroupId: z.string().nullable(),
  fingerprint: z.string(),
  // Warm/cold tiers keep only the summary; the full body is dropped/externalized.
  fullBody: z.string().nullable(),
  archived: z.boolean().default(false),
});
export type ActionReport = z.infer<typeof ActionReportSchema>;

// ============================================================
// 10. Intelligence Settings — thresholds, retention, safety
// ============================================================
export const IntelligenceSettingsSchema = z.object({
  ...baseRecord,
  autoServeThreshold: z.number().min(0).max(1).default(0.85),
  semanticMatchThreshold: z.number().min(0).max(1).default(0.8),
  knowledgePromotionThreshold: z.number().min(0).max(1).default(0.75),
  cacheTtlDays: z.number().int().positive().default(30),
  requireReviewForSensitive: z.boolean().default(true),
  // Retention (days)
  keepRawAiEventsDays: z.number().int().positive().default(30),
  summarizeAfterDays: z.number().int().positive().default(60),
  archiveAfterDays: z.number().int().positive().default(180),
  // Budgets / alerts
  monthlyTokenBudget: z.number().int().nonnegative().nullable(),
  maxCostPerFeature: z.number().nonnegative().nullable(),
  privacyExclusions: z.array(z.string()).default(['email', 'name', 'raw_video', 'phone']),
});
export type IntelligenceSettings = z.infer<typeof IntelligenceSettingsSchema>;

// ── Record-kind registry (stable string keys for the store) ───
export const RECORD_KINDS = {
  aiEvent: 'ai_event',
  knowledge: 'knowledge',
  canonical: 'canonical_answer',
  pattern: 'pattern_memory',
  cache: 'answer_cache',
  evaluation: 'evaluation',
  tokenSavings: 'token_savings',
  task: 'action_task',
  report: 'action_report',
  settings: 'intelligence_settings',
} as const;
export type RecordKind = (typeof RECORD_KINDS)[keyof typeof RECORD_KINDS];

// Severity → UI badge tone (StatusBadge) + ui/Badge variant mapping helpers.
export function severityTone(s: Severity): 'critical' | 'warning' | 'watch' | 'routine' {
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'warning';
  if (s === 'medium') return 'watch';
  return 'routine';
}
