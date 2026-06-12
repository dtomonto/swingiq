// ============================================================
// SwingVantage — AI Operations: normalized schemas (Zod)
// ------------------------------------------------------------
// The typed contracts every stage of the AI analysis pipeline speaks
// (master-prompt §6). Provider-agnostic + honesty-first: every claim
// carries a confidence + claimType + limitations so nothing reads as
// false precision. Used by the orchestrator, coach, admin, and evals.
// ============================================================

import { z } from 'zod';

// ── enums ────────────────────────────────────────────────────
export const AnalysisStatus = z.enum([
  'queued',
  'preprocessing',
  'measuring',
  'video_intake',
  'normalizing',
  'coaching',
  'premium_narrative',
  'completed',
  'failed',
  'needs_review',
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;

export const AnalysisMode = z.enum(['standard', 'premium']);
export type AnalysisMode = z.infer<typeof AnalysisMode>;

export const ClaimType = z.enum(['directly_observed', 'inferred', 'uncertain']);
export type ClaimType = z.infer<typeof ClaimType>;

export const ProviderStage = z.enum([
  'video_intake',
  'measurement',
  'coach_synthesis',
  'premium_narrative',
  'coach_chat',
  'eval_scoring',
]);
export type ProviderStage = z.infer<typeof ProviderStage>;

export const AiProviderName = z.enum(['gemini', 'openai', 'anthropic', 'mediapipe', 'none']);
export type AiProviderName = z.infer<typeof AiProviderName>;

// ── §6.6 ProviderTrace ───────────────────────────────────────
export const ProviderTraceSchema = z.object({
  stage: ProviderStage,
  provider: AiProviderName,
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  latencyMs: z.number().nonnegative().nullable(),
  inputTokens: z.number().nonnegative().nullable(),
  outputTokens: z.number().nonnegative().nullable(),
  estimatedCost: z.number().nonnegative().nullable(),
  status: z.enum(['ok', 'error', 'skipped', 'fallback']),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  retryCount: z.number().int().nonnegative().default(0),
  fallbackUsed: z.boolean().default(false),
  // Sanitized/redacted — never raw provider payloads unless explicitly configured.
  sanitizedRequest: z.unknown().nullable().optional(),
  sanitizedResponse: z.unknown().nullable().optional(),
});
export type ProviderTrace = z.infer<typeof ProviderTraceSchema>;

// ── §6.1 AIAnalysisJob ───────────────────────────────────────
export const AIAnalysisJobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  videoId: z.string(),
  sport: z.string().nullable(),
  status: AnalysisStatus,
  analysisMode: AnalysisMode,
  createdAt: z.string(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  failedAt: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  providerTrace: z.array(ProviderTraceSchema).default([]),
  costEstimate: z.number().nonnegative().nullable().optional(),
  latencyMs: z.number().nonnegative().nullable().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
});
export type AIAnalysisJob = z.infer<typeof AIAnalysisJobSchema>;

// ── §6.2 VideoIntakeResult ───────────────────────────────────
export const ObservationSchema = z.object({
  claim: z.string(),
  evidence: z.string(),
  timestampStart: z.number().nullable().optional(),
  timestampEnd: z.number().nullable().optional(),
  frameReference: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  claimType: ClaimType,
  sportRelevance: z.string(),
  limitations: z.string().nullable().optional(),
});
export type Observation = z.infer<typeof ObservationSchema>;

export const VideoIntakeResultSchema = z.object({
  schemaVersion: z.string(),
  provider: AiProviderName,
  model: z.string().nullable(),
  videoId: z.string(),
  sportDetected: z.string().nullable(),
  cameraAngle: z.string().nullable(),
  inputQuality: z.enum(['excellent', 'good', 'limited', 'poor']),
  bodyVisibility: z.enum(['full', 'partial', 'poor', 'none']),
  movementType: z.string().nullable(),
  phases: z.array(z.object({ name: z.string(), start: z.number().nullable(), end: z.number().nullable() })).default([]),
  timestamps: z.array(z.number()).default([]),
  observations: z.array(ObservationSchema).default([]),
  risks: z.array(z.string()).default([]),
  uncertainties: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
});
export type VideoIntakeResult = z.infer<typeof VideoIntakeResultSchema>;

// ── §6.3 MeasurementResult ───────────────────────────────────
export const MetricSchema = z.object({
  name: z.string(),
  value: z.number().nullable(),
  unit: z.string(),
  source: z.string(),
  method: z.string(),
  timestamp: z.number().nullable().optional(),
  confidence: z.number().min(0).max(1),
  // measured vs derived vs estimated — never claim measured without a method.
  precision: z.enum(['measured', 'derived', 'estimated']),
  limitations: z.string().nullable().optional(),
});
export type Metric = z.infer<typeof MetricSchema>;

export const MeasurementResultSchema = z.object({
  provider: AiProviderName,
  modelOrMethod: z.string(),
  landmarks: z.unknown().nullable().optional(),
  derivedMetrics: z.array(MetricSchema).default([]),
  frameMetrics: z.array(MetricSchema).default([]),
  phaseMetrics: z.array(MetricSchema).default([]),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
  sourceFrames: z.array(z.number()).default([]),
});
export type MeasurementResult = z.infer<typeof MeasurementResultSchema>;

// ── §6.4 NormalizedAnalysisEvidence ──────────────────────────
export const EvidenceClaimSchema = z.object({
  claim: z.string(),
  source: z.enum(['video_intake', 'measurement', 'merged']),
  supportLevel: z.enum(['measured', 'observed', 'inferred', 'uncertain']),
  confidence: z.number().min(0).max(1),
  timestamp: z.number().nullable().optional(),
  usedInCoachOutput: z.boolean().default(false),
});
export type EvidenceClaim = z.infer<typeof EvidenceClaimSchema>;

export const NormalizedAnalysisEvidenceSchema = z.object({
  videoIntake: VideoIntakeResultSchema.nullable(),
  measurements: MeasurementResultSchema.nullable(),
  mergedObservations: z.array(ObservationSchema).default([]),
  evidenceClaims: z.array(EvidenceClaimSchema).default([]),
  unsupportedClaimsRejected: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(1),
  analysisLimitations: z.array(z.string()).default([]),
});
export type NormalizedAnalysisEvidence = z.infer<typeof NormalizedAnalysisEvidenceSchema>;

// ── §6.5 CoachSynthesis (the user-facing report) ─────────────
export const CoachSynthesisSchema = z.object({
  summary: z.string(),
  quickRead: z.string(),
  whatISee: z.string(),
  primaryFault: z.string(),
  oneFix: z.string(),
  whyItMatters: z.string(),
  practicePlan: z.string(),
  retestProtocol: z.string(),
  coachNotes: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  evidenceUsed: z.array(z.string()).default([]),
  safetyDisclaimer: z.string(),
  limitations: z.array(z.string()).default([]),
});
export type CoachSynthesis = z.infer<typeof CoachSynthesisSchema>;

/** Plain JSON Schema for the coach output, for provider structured-output calls. */
export const COACH_SYNTHESIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary', 'quickRead', 'whatISee', 'primaryFault', 'oneFix',
    'whyItMatters', 'practicePlan', 'retestProtocol', 'confidence',
    'evidenceUsed', 'safetyDisclaimer', 'limitations',
  ],
  properties: {
    summary: { type: 'string' },
    quickRead: { type: 'string' },
    whatISee: { type: 'string' },
    primaryFault: { type: 'string' },
    oneFix: { type: 'string' },
    whyItMatters: { type: 'string' },
    practicePlan: { type: 'string' },
    retestProtocol: { type: 'string' },
    coachNotes: { type: 'string' },
    confidence: { type: 'number' },
    evidenceUsed: { type: 'array', items: { type: 'string' } },
    safetyDisclaimer: { type: 'string' },
    limitations: { type: 'array', items: { type: 'string' } },
  },
} as const;

// ── §6.7 AIAdminProviderSettings ─────────────────────────────
export const AIAdminProviderSettingsSchema = z.object({
  provider: AiProviderName,
  stage: ProviderStage,
  enabled: z.boolean(),
  defaultModel: z.string().nullable(),
  fallbackModel: z.string().nullable(),
  timeoutMs: z.number().int().positive().nullable(),
  maxTokens: z.number().int().positive().nullable(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  costBudgetDaily: z.number().nonnegative().nullable().optional(),
  rateLimitPerMinute: z.number().int().positive().nullable().optional(),
  lastTestStatus: z.enum(['ok', 'error', 'untested']).default('untested'),
  lastTestedAt: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type AIAdminProviderSettings = z.infer<typeof AIAdminProviderSettingsSchema>;
