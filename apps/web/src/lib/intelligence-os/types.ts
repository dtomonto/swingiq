// ============================================================
// SwingVantage — First-Party Intelligence OS · domain types
// ------------------------------------------------------------
// Strongly-typed records for the intelligence flywheel: capture →
// normalize → dedupe → evaluate → promote → retrieve → improve →
// reduce token use. Persisted via the shared `growth_records` JSONB
// repository (see ./store.ts), keyless-first like CentralIntelligenceOS.
//
// Field names are camelCase to match the codebase TS convention and the
// repository's auto `updatedAt` stamping. Every record carries an honest
// `DataSource` label so the admin never mistakes demo/config-pending data
// for real signal.
// ============================================================

/** Honest provenance label — never present anything but `real` as real. */
export type DataSource = 'real' | 'estimated' | 'imported' | 'placeholder' | 'mock';

export const SPORTS = [
  'golf', 'tennis', 'baseball', 'softball-slowpitch', 'softball-fastpitch', 'pickleball', 'padel', 'cross-sport', 'none',
] as const;
export type Sport = (typeof SPORTS)[number];

/** Where an AI interaction originated. */
export const SOURCE_SYSTEMS = [
  'ai-coach', 'video-analysis', 'drill-plan', 'retest-plan', 'admin-report',
  'seo-audit', 'ux-audit', 'support-response', 'claude-code-fix-packet', 'manual-admin-entry',
] as const;
export type SourceSystem = (typeof SOURCE_SYSTEMS)[number];

export type Provider = 'anthropic' | 'openai' | 'gemini' | 'first-party' | 'none' | 'other';

export type AiActivityStatus = 'ok' | 'fallback' | 'error' | 'flagged';

/** Optional safety review flags (youth / medical / legal / privacy / personalized). */
export type SafetyFlag = 'youth' | 'medical' | 'legal' | 'privacy' | 'personalized' | 'safety';

// ── 1 · AI Activity Event ─────────────────────────────────────
export interface AIActivityEvent {
  id: string;
  sourceSystem: SourceSystem;
  feature: string;
  sport: Sport;
  userIntent: string;
  promptHash: string;
  promptSummary: string;
  responseHash: string;
  responseSummary: string;
  provider: Provider;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCostCents: number;
  latencyMs: number | null;
  status: AiActivityStatus;
  confidenceScore: number; // 0..1
  safetyFlags: SafetyFlag[];
  qualityScore: number | null; // 0..1
  userFeedback: 'positive' | 'negative' | 'neutral' | null;
  adminFeedback: 'approved' | 'low-quality' | 'needs-review' | null;
  /** Hashed/anonymized — never store a raw user id in the knowledge layer. */
  relatedUserIdHash: string | null;
  relatedSessionId: string | null;
  relatedVideoId: string | null;
  relatedReportId: string | null;
  relatedTaskId: string | null;
  /** Set when this event already produced a knowledge candidate (dedup guard). */
  promotedKnowledgeId: string | null;
  dataSource: DataSource;
  createdAt: string;
}

// ── 2 · Knowledge Item ────────────────────────────────────────
export const KNOWLEDGE_TYPES = [
  'coaching-answer', 'swing-diagnosis-pattern', 'drill-recommendation', 'retest-recommendation',
  'upload-fix', 'ai-quality-fix', 'ux-pattern', 'seo-pattern', 'revenue-pattern',
  'support-answer', 'technical-fix', 'admin-operating-procedure', 'claude-code-repair-pattern',
] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

export const VALIDATION_STATUSES = [
  'candidate', 'needs-review', 'approved', 'rejected', 'superseded', 'archived',
] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export interface KnowledgeItem {
  id: string;
  title: string;
  knowledgeType: KnowledgeType;
  sport: Sport;
  topic: string;
  userIntent: string;
  canonicalQuestion: string;
  canonicalAnswer: string;
  shortAnswer: string;
  structuredSteps: string[];
  evidenceSummary: string;
  /** Stable dedup key derived from intent + sport + topic + answer meaning. */
  fingerprint: string;
  sourceEventIds: string[];
  sourceReportIds: string[];
  sourceTaskIds: string[];
  confidenceScore: number; // 0..1
  validationStatus: ValidationStatus;
  approvedByAdmin: string | null; // admin email, when approved
  safetyFlags: SafetyFlag[];
  usageCount: number;
  successCount: number;
  failureCount: number;
  lastUsedAt: string | null;
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// ── 3 · Canonical Answer ──────────────────────────────────────
export const ANSWER_FORMATS = [
  'short-answer', 'coaching-response', 'step-by-step-fix', 'drill-plan', 'retest-plan',
  'admin-fix-prompt', 'support-response', 'report-summary', 'technical-recommendation',
] as const;
export type AnswerFormat = (typeof ANSWER_FORMATS)[number];

export type Audience = 'athlete' | 'admin' | 'developer' | 'support' | 'public';

export interface RegressionTestCase {
  input: string;
  expectedContains: string[];
}

export interface CanonicalAnswer {
  id: string;
  canonicalQuestion: string;
  canonicalAnswer: string;
  answerFormat: AnswerFormat;
  topic: string;
  sport: Sport;
  audience: Audience;
  triggerPhrases: string[];
  semanticFingerprint: string;
  confidenceScore: number; // 0..1
  allowedAutoServe: boolean;
  requiresAdminReview: boolean;
  safetyFlags: SafetyFlag[];
  sourceKnowledgeIds: string[];
  regressionTestCases: RegressionTestCase[];
  validationStatus: ValidationStatus;
  approvedByAdmin: string | null;
  lastValidatedAt: string | null;
  usageCount: number;
  aiCallsAvoided: number;
  tokensAvoided: number;
  estimatedCostSavedCents: number;
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
}

// ── 4 · Pattern Memory ────────────────────────────────────────
export const PATTERN_TYPES = [
  'recurring-user-question', 'recurring-swing-fault', 'recurring-drill-recommendation',
  'recurring-upload-issue', 'recurring-ai-quality-issue', 'recurring-ux-friction',
  'recurring-conversion-dropoff', 'recurring-seo-gap', 'recurring-revenue-opportunity',
  'recurring-technical-bug', 'recurring-admin-fix', 'recurring-claude-code-repair-pattern',
] as const;
export type PatternType = (typeof PATTERN_TYPES)[number];

export type PatternStatus = 'open' | 'monitoring' | 'actioned' | 'resolved' | 'ignored';

export interface PatternMemory {
  id: string;
  patternTitle: string;
  patternType: PatternType;
  summary: string;
  fingerprint: string;
  affectedFeature: string;
  affectedSport: Sport;
  affectedRoute: string | null;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  evidenceCount: number;
  confidenceScore: number; // 0..1
  recommendedPrevention: string;
  recommendedAutomation: string;
  relatedKnowledgeIds: string[];
  relatedEventIds: string[];
  relatedTaskIds: string[];
  relatedReportIds: string[];
  status: PatternStatus;
  tags: string[];
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
}

// ── 5 · Answer Cache ──────────────────────────────────────────
export type CacheServedSource = 'exact-cache' | 'canonical-answer' | 'knowledge' | 'rule-engine' | 'small-model';

export interface AnswerCacheEntry {
  id: string;
  cacheKey: string;
  semanticFingerprint: string;
  requestSummary: string;
  response: string;
  responseType: AnswerFormat;
  confidenceScore: number;
  source: CacheServedSource;
  providerOriginallyUsed: Provider | null;
  modelOriginallyUsed: string | null;
  tokenCostOriginal: number; // total tokens of the original call
  costCentsOriginal: number;
  /** True when the request was personalized/sensitive — never global-reuse. */
  personalized: boolean;
  safetyFlags: SafetyFlag[];
  usageCount: number;
  lastHitAt: string | null;
  expiresAt: string | null;
  invalidationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── 6 · Evaluation Record ─────────────────────────────────────
export type EvaluatedObjectType = 'ai-activity-event' | 'knowledge-item' | 'canonical-answer' | 'pattern-memory';
export const EVALUATOR_TYPES = [
  'user-feedback', 'admin-review', 'automated-heuristic', 'retest-outcome', 'report-outcome', 'error-free-reuse', 'manual-qa',
] as const;
export type EvaluatorType = (typeof EVALUATOR_TYPES)[number];

export interface EvaluationRecord {
  id: string;
  evaluatedObjectType: EvaluatedObjectType;
  evaluatedObjectId: string;
  evaluatorType: EvaluatorType;
  evaluatorRef: string | null; // admin email / heuristic id
  scoreAccuracy: number; // 0..1
  scoreUsefulness: number;
  scoreSafety: number;
  scoreClarity: number;
  scoreCompleteness: number;
  scoreReusePotential: number;
  scoreCostEfficiency: number;
  passFail: 'pass' | 'fail';
  notes: string;
  recommendedAction: 'promote' | 'review' | 'reject' | 'invalidate' | 'none';
  dataSource: DataSource;
  createdAt: string;
}

// ── 7 · Token Savings Ledger ──────────────────────────────────
export type SavingsServedBy = 'exact-cache' | 'canonical-answer' | 'rule-engine' | 'retrieval' | 'small-model' | 'manual-admin-knowledge';

export interface TokenSavingsEntry {
  id: string;
  eventType: 'ai-call-avoided';
  sourceFeature: string;
  avoidedProvider: Provider | null;
  avoidedModel: string | null;
  avoidedInputTokens: number;
  avoidedOutputTokens: number;
  estimatedCostSavedCents: number;
  servedBy: SavingsServedBy;
  relatedCacheId: string | null;
  relatedKnowledgeId: string | null;
  relatedCanonicalAnswerId: string | null;
  dataSource: DataSource;
  createdAt: string;
}

// ── 8 · Settings (singleton) ──────────────────────────────────
export interface IntelligenceSettings {
  id: 'intelligence-os-settings';
  /** Auto-serve a canonical answer only at/above this confidence. */
  autoServeConfidenceThreshold: number; // 0..1
  /** Semantic cache match requires at least this confidence to reuse. */
  semanticMatchThreshold: number; // 0..1
  /** Promote an AI event to a knowledge candidate at/above this confidence. */
  knowledgePromotionThreshold: number; // 0..1
  /** Default cache TTL in hours (0 = no expiry). */
  cacheTtlHours: number;
  /** When true, every canonical answer requires admin review before auto-serve. */
  requireReviewBeforeAutoServe: boolean;
  /** Topics that must never be globally reused without admin review. */
  reviewRequiredSafetyFlags: SafetyFlag[];
  /** Substrings that mark a request as privacy-excluded (never cached globally). */
  privacyExclusionKeywords: string[];
  /** Alert when estimated daily AI spend (cents) exceeds this. 0 = off. */
  dailyTokenBudgetAlertCents: number;
  /** Max estimated cost per feature per day (cents). 0 = off. */
  maxCostPerFeatureCents: number;
  /** Keep raw AI events for N days before summarization. 0 = keep. */
  rawEventRetentionDays: number;
  /** Archive low-value events after N days. 0 = keep. */
  lowValueArchiveDays: number;
  updatedAt: string;
  updatedBy: string | null;
}

// ── 9 · Action Task ───────────────────────────────────────────
// The clickable Action OS layer: every Critical / High Priority / Needs
// Attention item becomes a traceable task with an executive detail view and a
// downloadable Claude Code fix packet. Patterns/reports/events promote into these.
export const TASK_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
export type TaskSeverity = (typeof TASK_SEVERITIES)[number];

export const TASK_PRIORITIES = ['p0', 'p1', 'p2', 'p3'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = [
  'new', 'triaged', 'in-progress', 'waiting', 'needs-review',
  'fixed', 'verified', 'monitoring', 'archived', 'ignored',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CATEGORIES = [
  'upload', 'authentication', 'video-analysis', 'ai-coach', 'report-generation',
  'player-dashboard', 'admin-dashboard', 'payments-monetization', 'ads-revenue',
  'seo-aeo-geo', 'performance', 'mobile-ux', 'accessibility', 'privacy', 'security',
  'database', 'api', 'model-routing', 'prompt-quality', 'conversion-funnel', 'retention',
  'engagement', 'content-gap', 'opportunity', 'bug', 'technical-debt', 'growth',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type FixComplexity = 'trivial' | 'small' | 'medium' | 'large' | 'unknown';

export interface TaskNote { at: string; author: string; body: string; }
export interface TaskHistoryEntry { at: string; event: string; detail?: string; }

export interface ActionTask {
  id: string;
  title: string;
  severity: TaskSeverity;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  source: string;
  affectedFeature: string;
  affectedSport: Sport;
  affectedRoute: string | null;
  affectedComponent: string | null;
  affectedFilePaths: string[];
  owner: string | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
  occurrenceCount: number;
  suggestedNextAction: string;
  rootCauseHypothesis: string;
  evidenceSummary: string;
  userImpact: string;
  businessImpact: string;
  revenueImpact: string | null;
  brandTrustImpact: string | null;
  aiQualityImpact: string | null;
  confidenceScore: number; // 0..1
  fixComplexity: FixComplexity;
  estimatedEffort: string | null;
  dependencies: string[];
  relatedTaskIds: string[];
  relatedReportIds: string[];
  relatedEventIds: string[];
  relatedKnowledgeIds: string[];
  reproductionSteps: string[];
  acceptanceCriteria: string[];
  resolutionNotes: string | null;
  internalLearningTags: string[];
  safetyFlags: SafetyFlag[];
  /** Dedup key from category + route + component + severity + signature. */
  fingerprint: string;
  notes: TaskNote[];
  history: TaskHistoryEntry[];
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// ── 10 · Action Report ────────────────────────────────────────
// Durable, retention-tiered findings that can generate tasks and link back.
export const REPORT_TYPES = [
  'system-health', 'ai-quality', 'video-analysis', 'upload-reliability', 'login-auth',
  'seo-aeo-geo', 'ux-friction', 'conversion-funnel', 'revenue-opportunity', 'ads-monetization',
  'privacy-security', 'performance', 'accessibility', 'feature-gap', 'growth-opportunity',
  'admin-operations', 'user-journey',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LIFECYCLES = [
  'generated', 'reviewed', 'converted-to-tasks', 'in-progress', 'partially-resolved',
  'resolved', 'monitoring', 'archived', 'superseded', 'deleted',
] as const;
export type ReportLifecycle = (typeof REPORT_LIFECYCLES)[number];

/** Space-efficient layered retention: hot keeps the full body; warm/cold keep
 *  only the summary + findings (the body is dropped/externalized). */
export type RetentionTier = 'hot' | 'warm' | 'cold';

export interface ReportFinding {
  id: string;
  title: string;
  severity: TaskSeverity;
  detail: string;
  recommendation: string;
}

export interface ActionReport {
  id: string;
  title: string;
  type: ReportType;
  source: string;
  lifecycleStatus: ReportLifecycle;
  severitySummary: string;
  prioritySummary: string;
  executiveSummary: string;
  findings: ReportFinding[];
  generatedTaskIds: string[];
  evidenceReferences: string[];
  recommendedActions: string[];
  internalLearningTags: string[];
  searchMetadata: string;
  retentionTier: RetentionTier;
  duplicateGroupId: string | null;
  fingerprint: string;
  /** Retained only while hot; null once summarized into the warm/cold tier. */
  fullBody: string | null;
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}
