// ============================================================
// First-Party Intelligence OS — demo seed (keyless fallback)
// ------------------------------------------------------------
// Small, illustrative dataset so the OS is fully navigable before any real
// source is wired. EVERY record is labelled dataSource: 'demo' so the UI can
// honestly distinguish it from captured data (CLAUDE.md: never fake real data).
// Kept intentionally tiny — the flywheel grows this from live capture.
// ============================================================

import { fingerprint, semanticFingerprint } from './fingerprint';
import type {
  AiActivityEvent, KnowledgeItem, CanonicalAnswer, PatternMemory, AnswerCache,
  EvaluationRecord, TokenSavingsEntry, ActionTask, ActionReport, IntelligenceSettings,
} from './types';

const T = '2026-06-01T12:00:00.000Z';
const demo = { dataSource: 'demo' as const, createdAt: T, updatedAt: T };

export const AI_EVENTS: AiActivityEvent[] = [
  {
    ...demo, id: 'evt-coach-slice-golf',
    sourceSystem: 'AI Coach', feature: 'coach_chat', sport: 'golf',
    userIntent: 'fix a slice', promptHash: semanticFingerprint('how do i fix my slice'),
    promptSummary: 'How do I fix my slice?', responseHash: semanticFingerprint('slice fix grip path face'),
    responseSummary: 'Strengthen grip, fix out-to-in path, square the face at impact.',
    provider: 'openai', model: 'gpt-4o', inputTokens: 820, outputTokens: 540, estimatedCost: 0.012,
    latencyMs: 2400, status: 'ok', confidenceScore: 0.88, safetyFlags: [], qualityScore: 0.86,
    userFeedback: 'positive', adminFeedback: 'approved', relatedUserIdHash: 'u_demo1',
    relatedSessionId: null, relatedVideoId: null, relatedReportId: null, relatedTaskId: null,
    fingerprint: fingerprint({ category: 'AI Coach', sport: 'golf', signature: 'how do i fix my slice' }),
    reusePotential: 0.92,
  },
  {
    ...demo, id: 'evt-upload-timeout-1',
    sourceSystem: 'Video Analysis', feature: 'upload', sport: null,
    userIntent: 'upload swing video', promptHash: semanticFingerprint('upload large video timeout'),
    promptSummary: 'Upload of 180MB video failed', responseHash: semanticFingerprint('upload timeout retry chunk'),
    responseSummary: 'Upload timed out on mobile Safari for large file.',
    provider: null, model: null, inputTokens: null, outputTokens: null, estimatedCost: null,
    latencyMs: 31000, status: 'error', confidenceScore: null, safetyFlags: [], qualityScore: null,
    userFeedback: 'negative', adminFeedback: 'none', relatedUserIdHash: 'u_demo2',
    relatedSessionId: 'sess-demo-2', relatedVideoId: 'vid-demo-2', relatedReportId: null, relatedTaskId: 'task-upload-safari',
    fingerprint: fingerprint({ category: 'Upload', route: '/start', signature: 'upload large video timeout mobile safari' }),
    reusePotential: 0.4,
  },
];

export const KNOWLEDGE: KnowledgeItem[] = [
  {
    ...demo, id: 'kn-slice-fix-golf',
    title: 'Golf slice — canonical fix path', knowledgeType: 'Coaching Answer', sport: 'golf',
    topic: 'slice', userIntent: 'fix a slice',
    canonicalQuestion: 'How do I fix my slice?',
    canonicalAnswer: 'A slice comes from an open clubface relative to an out-to-in swing path. Fix it in three steps: (1) strengthen the grip so the lead hand shows 2–3 knuckles, (2) feel an in-to-out path by swinging toward right field, (3) release to square the face at impact. Verify with a retest on the same club.',
    shortAnswer: 'Strengthen grip, swing in-to-out, square the face. Then retest.',
    structuredSteps: ['Strengthen grip (2–3 knuckles visible)', 'Swing in-to-out', 'Square the face at impact', 'Retest same club'],
    evidenceSummary: 'Repeated across 14 coach sessions with positive user feedback.',
    sourceEventIds: ['evt-coach-slice-golf'], sourceReportIds: [], sourceTaskIds: [],
    confidenceScore: 0.9, validationStatus: 'Approved', approvedByAdmin: true,
    usageCount: 23, successCount: 20, failureCount: 1, lastUsedAt: T,
    fingerprint: fingerprint({ category: 'Coaching Answer', sport: 'golf', signature: 'how do i fix my slice' }),
    tags: ['slice', 'driver', 'high-reuse'], archived: false,
  },
  {
    ...demo, id: 'kn-upload-safari-fix',
    title: 'Large-file upload timeout on mobile Safari', knowledgeType: 'Upload Fix', sport: null,
    topic: 'upload reliability', userIntent: 'upload large video on mobile',
    canonicalQuestion: 'Why do large video uploads fail on mobile Safari?',
    canonicalAnswer: 'Mobile Safari drops long single-request uploads. Use chunked/resumable upload with a longer client timeout and a clear progress UI. Validate file size/format client-side before upload.',
    shortAnswer: 'Use chunked/resumable upload + longer timeout on mobile Safari.',
    structuredSteps: ['Chunk the upload', 'Raise client timeout', 'Show progress', 'Validate size/format first'],
    evidenceSummary: 'Pattern observed in upload error events on iOS Safari.',
    sourceEventIds: ['evt-upload-timeout-1'], sourceReportIds: ['rep-upload-reliability'], sourceTaskIds: ['task-upload-safari'],
    confidenceScore: 0.72, validationStatus: 'Needs Review', approvedByAdmin: false,
    usageCount: 0, successCount: 0, failureCount: 0, lastUsedAt: null,
    fingerprint: fingerprint({ category: 'Upload Fix', signature: 'upload large video timeout mobile safari' }),
    tags: ['upload', 'mobile', 'reliability'], archived: false,
  },
];

export const CANONICAL: CanonicalAnswer[] = [
  {
    ...demo, id: 'ca-slice-golf',
    canonicalQuestion: 'How do I fix my slice?',
    canonicalAnswer: 'Strengthen your grip, feel an in-to-out path, and square the face at impact — then retest on the same club. (One fix. One plan. One retest.)',
    answerFormat: 'Coaching Response', topic: 'slice', sport: 'golf', audience: 'athlete',
    triggerPhrases: ['fix my slice', 'stop slicing', 'why do i slice', 'slice fix'],
    semanticFingerprint: semanticFingerprint('how do i fix my slice'),
    confidenceScore: 0.9, allowedAutoServe: true, requiresAdminReview: false,
    sourceKnowledgeIds: ['kn-slice-fix-golf'],
    regressionTestCases: [{ input: 'how do I fix my slice', expectsIncludes: 'in-to-out' }],
    lastValidatedAt: T, usageCount: 41, aiCallsAvoided: 41, tokensAvoided: 55000, estimatedCostSaved: 0.49,
    sensitivity: 'general',
  },
];

export const PATTERNS: PatternMemory[] = [
  {
    ...demo, id: 'pat-upload-safari',
    patternTitle: 'Large-file uploads time out on mobile Safari', patternType: 'Recurring Upload Issue',
    summary: 'Repeated upload failures for >100MB videos on iOS Safari — single-request uploads exceed the gateway timeout.',
    fingerprint: fingerprint({ category: 'Upload', route: '/start', signature: 'upload large video timeout mobile safari' }),
    affectedFeature: 'upload', affectedSport: null, affectedRoute: '/start',
    occurrenceCount: 9, firstSeenAt: '2026-05-10T00:00:00.000Z', lastSeenAt: T, evidenceCount: 9,
    confidenceScore: 0.8,
    recommendedPrevention: 'Adopt resumable chunked uploads and validate file size client-side.',
    recommendedAutomation: 'Auto-open an Action Task when >3 upload-timeout events share this fingerprint in 24h.',
    relatedKnowledgeIds: ['kn-upload-safari-fix'], relatedEventIds: ['evt-upload-timeout-1'],
    relatedTaskIds: ['task-upload-safari'], relatedReportIds: ['rep-upload-reliability'],
    status: 'Open', tags: ['upload', 'mobile', 'reliability'],
  },
  {
    ...demo, id: 'pat-slice-question',
    patternTitle: '“How do I fix my slice?” is the #1 golf coach question', patternType: 'Recurring User Question',
    summary: 'Slice-fix is asked far more than any other golf coach query — a prime candidate for canonical first-party answering.',
    fingerprint: fingerprint({ category: 'AI Coach', sport: 'golf', signature: 'how do i fix my slice' }),
    affectedFeature: 'coach_chat', affectedSport: 'golf', affectedRoute: '/coach',
    occurrenceCount: 41, firstSeenAt: '2026-04-01T00:00:00.000Z', lastSeenAt: T, evidenceCount: 41,
    confidenceScore: 0.93,
    recommendedPrevention: 'Serve the approved canonical answer before calling the coach model.',
    recommendedAutomation: 'Route slice-fix intents to canonical answer ca-slice-golf.',
    relatedKnowledgeIds: ['kn-slice-fix-golf'], relatedEventIds: ['evt-coach-slice-golf'],
    relatedTaskIds: [], relatedReportIds: [],
    status: 'Mitigated', tags: ['coach', 'golf', 'high-reuse'],
  },
];

export const CACHE: AnswerCache[] = [
  {
    ...demo, id: 'cache-slice-golf',
    cacheKey: semanticFingerprint('how do i fix my slice') + ':golf',
    semanticFingerprint: semanticFingerprint('how do i fix my slice'),
    requestSummary: 'How do I fix my slice? (golf)',
    response: 'Strengthen grip, swing in-to-out, square the face. Then retest.',
    responseType: 'Coaching Response', confidenceScore: 0.9, source: 'Canonical Answer',
    providerOriginallyUsed: 'openai', modelOriginallyUsed: 'gpt-4o', tokenCostOriginal: 1360,
    usageCount: 41, lastHitAt: T, expiresAt: '2026-07-01T00:00:00.000Z',
    invalidationReason: null, sensitivity: 'general',
  },
];

export const EVALUATIONS: EvaluationRecord[] = [
  {
    ...demo, id: 'eval-slice-1',
    evaluatedObjectType: 'knowledge', evaluatedObjectId: 'kn-slice-fix-golf', evaluatorType: 'Admin Review',
    scoreAccuracy: 0.9, scoreUsefulness: 0.92, scoreSafety: 1, scoreClarity: 0.88,
    scoreCompleteness: 0.85, scoreReusePotential: 0.95, scoreCostEfficiency: 0.9,
    passFail: 'pass', notes: 'Clear, safe, high reuse. Approved for canonical auto-serve.',
    recommendedAction: 'Promote to canonical answer (done: ca-slice-golf).',
  },
];

export const TOKEN_SAVINGS: TokenSavingsEntry[] = [
  {
    ...demo, id: 'ts-slice-week',
    eventType: 'canonical_served', sourceFeature: 'coach_chat', avoidedProvider: 'openai', avoidedModel: 'gpt-4o',
    avoidedInputTokens: 33620, avoidedOutputTokens: 22140, estimatedCostSaved: 0.49,
    servedBy: 'Canonical Answer', relatedCacheId: 'cache-slice-golf', relatedKnowledgeId: 'kn-slice-fix-golf',
    relatedCanonicalAnswerId: 'ca-slice-golf',
  },
];

export const TASKS: ActionTask[] = [
  {
    ...demo, id: 'task-upload-safari',
    title: 'Video uploads fail on mobile Safari for large files',
    severity: 'high', priority: 'p1', status: 'New', category: 'Upload', source: 'Upload Reliability Report',
    affectedFeature: 'upload', affectedSport: null, affectedRoute: '/start', affectedComponent: 'UploadHandler',
    affectedFilePaths: ['apps/web/src/app/(app)/start', 'apps/web/src/lib/upload'],
    owner: null, firstDetectedAt: '2026-05-10T00:00:00.000Z', lastDetectedAt: T, occurrenceCount: 9,
    suggestedNextAction: 'Implement chunked/resumable upload with a longer client timeout.',
    rootCauseHypothesis: 'Single-request uploads exceed the gateway/client timeout on iOS Safari for >100MB files.',
    evidenceSummary: '9 upload-timeout events on iOS Safari over 30 days; all >100MB.',
    userImpact: 'Athletes cannot submit swings; first-session abandonment.',
    businessImpact: 'Lost activations at the most critical funnel step.',
    revenueImpact: 'Estimated drop at upload step — quantify once analytics wired.',
    brandTrustImpact: 'First impression failure erodes trust.', aiQualityImpact: null,
    confidenceScore: 0.8, fixComplexity: 'medium', estimatedEffort: '2–3 days',
    dependencies: [], relatedTasks: [], relatedReports: ['rep-upload-reliability'], relatedEvents: ['evt-upload-timeout-1'],
    reproductionSteps: ['On iPhone Safari, open /start', 'Select a >100MB video', 'Observe timeout after ~30s'],
    acceptanceCriteria: ['Large files upload reliably on mobile Safari', 'Progress UI shown', 'Regression tests for large/slow/timeout/success'],
    resolutionNotes: null, internalLearningTags: ['upload', 'mobile', 'reliability'],
    notes: [], history: [{ at: T, event: 'created', detail: 'Opened from Upload Reliability Report' }],
    fingerprint: fingerprint({ category: 'Upload', route: '/start', severity: 'high', signature: 'upload large video timeout mobile safari' }),
    archived: false,
  },
  {
    ...demo, id: 'task-slice-canonical-opportunity',
    title: 'Opportunity: serve slice-fix from first-party canonical answer',
    severity: 'medium', priority: 'p2', status: 'In Progress', category: 'Opportunity', source: 'Pattern Memory',
    affectedFeature: 'coach_chat', affectedSport: 'golf', affectedRoute: '/coach', affectedComponent: 'CoachChat',
    affectedFilePaths: [], owner: null, firstDetectedAt: '2026-04-01T00:00:00.000Z', lastDetectedAt: T, occurrenceCount: 41,
    suggestedNextAction: 'Route slice-fix intents through resolveWithFirstPartyIntelligence before the coach model.',
    rootCauseHypothesis: 'Same high-confidence answer regenerated 41× — pure third-party cost with no novelty.',
    evidenceSummary: '41 near-identical slice-fix coach calls; canonical answer approved.',
    userImpact: 'Faster, more consistent coaching responses.',
    businessImpact: 'Lower AI cost, higher consistency.',
    revenueImpact: null, brandTrustImpact: 'More consistent coaching builds trust.',
    aiQualityImpact: 'Removes answer drift across sessions.',
    confidenceScore: 0.9, fixComplexity: 'small', estimatedEffort: '1 day',
    dependencies: [], relatedTasks: [], relatedReports: [], relatedEvents: ['evt-coach-slice-golf'],
    reproductionSteps: [], acceptanceCriteria: ['Slice-fix served by canonical answer when confidence ≥ threshold', 'Token-savings entry recorded per hit'],
    resolutionNotes: null, internalLearningTags: ['coach', 'golf', 'cost'],
    notes: [], history: [{ at: T, event: 'created', detail: 'Opened from pattern pat-slice-question' }],
    fingerprint: fingerprint({ category: 'Opportunity', sport: 'golf', signature: 'serve slice fix canonical first party' }),
    archived: false,
  },
];

export const REPORTS: ActionReport[] = [
  {
    ...demo, id: 'rep-upload-reliability',
    title: 'Upload Reliability Report — May 2026', type: 'Upload Reliability Report', source: 'Upload pipeline',
    lifecycleStatus: 'Converted to Tasks',
    severitySummary: '1 high', prioritySummary: '1 p1',
    executiveSummary: 'Large-file uploads time out on mobile Safari, blocking activations at the first funnel step. One high-priority task opened.',
    findings: [{
      id: 'f1', title: 'Mobile Safari large-file timeout', severity: 'high',
      detail: '9 upload-timeout events on iOS Safari for files >100MB.',
      recommendation: 'Adopt chunked/resumable uploads with a longer client timeout.',
    }],
    generatedTaskIds: ['task-upload-safari'], generatedOpportunityIds: [],
    evidenceReferences: ['evt-upload-timeout-1'],
    recommendedActions: ['Implement resumable uploads', 'Add upload regression tests'],
    internalLearningTags: ['upload', 'mobile'], searchMetadata: 'upload safari timeout reliability mobile ios large file',
    retentionTier: 'hot', storageSizeEstimate: 4096, duplicateGroupId: null,
    fingerprint: fingerprint({ category: 'Upload Reliability Report', signature: 'upload reliability mobile safari timeout' }),
    fullBody: 'Full report body retained while hot. Summarized to findings when it ages into the warm tier.',
    archived: false,
  },
];

export const SETTINGS: IntelligenceSettings[] = [
  {
    ...demo, id: 'settings-default',
    autoServeThreshold: 0.85, semanticMatchThreshold: 0.8, knowledgePromotionThreshold: 0.75,
    cacheTtlDays: 30, requireReviewForSensitive: true,
    keepRawAiEventsDays: 30, summarizeAfterDays: 60, archiveAfterDays: 180,
    monthlyTokenBudget: null, maxCostPerFeature: null,
    privacyExclusions: ['email', 'name', 'raw_video', 'phone'],
  },
];
