// ============================================================
// SwingVantage — AI Visual Analysis Schemas
//
// These schemas define the contract for REAL AI vision analysis:
// the model inspects actual extracted video frames and must return
// JSON that validates against `AIVisualAnalysisResultSchema`.
//
// Nothing here is heuristic or simulated — these types describe the
// structured output of an AI vision model. If the model returns
// malformed data, validation fails and the user is shown a clean
// retry/error state (never fabricated feedback).
// ============================================================

import { z } from 'zod';

/** Bump when the user-facing result shape changes (stored with saved sessions). */
export const VISUAL_ANALYSIS_SCHEMA_VERSION = '1.0.0';

// ──────────────────────────────────────────────────────────────
// Shared enums
// ──────────────────────────────────────────────────────────────

/** Sports SwingVantage supports — mirrors core `SportId`. */
export const VisualSportSchema = z.enum([
  'golf',
  'tennis',
  'pickleball',
  'padel',
  'baseball',
  'softball_slow',
  'softball_fast',
]);
export type VisualSport = z.infer<typeof VisualSportSchema>;

/** How clearly something could be assessed from the frames. */
export const VisibilityQualitySchema = z.enum(['excellent', 'good', 'limited', 'poor']);
export type VisibilityQuality = z.infer<typeof VisibilityQualitySchema>;

/** Human-readable confidence for an individual observation. */
export const ConfidenceLevelSchema = z.enum(['high', 'moderate', 'low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// ──────────────────────────────────────────────────────────────
// Internal standardized observation schema
// (matches the VisualObservation contract — usable by future
//  pose/landmark providers without changing the public result)
// ──────────────────────────────────────────────────────────────

export const VisualObservationSchema = z.object({
  sport: VisualSportSchema,
  videoMetadata: z.object({
    durationSeconds: z.number().optional(),
    frameCountAnalyzed: z.number().int().nonnegative(),
    resolution: z.string().optional(),
    cameraAngleAssessment: z.string().optional(),
    visibilityQuality: VisibilityQualitySchema,
  }),
  detectedPhases: z.array(
    z.object({
      phaseName: z.string(),
      confidence: z.number().min(0).max(1),
      frameIndex: z.number().int().optional(),
      timestampSeconds: z.number().optional(),
      observations: z.array(z.string()),
    }),
  ),
  bodyMechanics: z.object({
    posture: z.string().optional(),
    balance: z.string().optional(),
    sequencing: z.string().optional(),
    rotation: z.string().optional(),
    handPathOrSwingPath: z.string().optional(),
    lowerBodyUse: z.string().optional(),
    headOrEyeStability: z.string().optional(),
    contactPosition: z.string().optional(),
    finishPosition: z.string().optional(),
  }),
  equipmentInteraction: z
    .object({
      clubRacketBatPath: z.string().optional(),
      contactZone: z.string().optional(),
      faceOrBarrelControl: z.string().optional(),
    })
    .optional(),
  constraints: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
export type VisualObservation = z.infer<typeof VisualObservationSchema>;

// ──────────────────────────────────────────────────────────────
// User-facing AI result schema (the model must return this)
// ──────────────────────────────────────────────────────────────

const QualityAssessmentSchema = z.object({
  quality: VisibilityQualitySchema,
  note: z.string(),
});

export const VideoQualityCheckSchema = z.object({
  cameraAngle: QualityAssessmentSchema,
  lighting: QualityAssessmentSchema,
  bodyVisibility: QualityAssessmentSchema,
  swingVisibility: QualityAssessmentSchema,
  contactVisible: z.boolean(),
  fullMotionCaptured: z.boolean(),
  nextCaptureRecommendation: z.string(),
});
export type VideoQualityCheck = z.infer<typeof VideoQualityCheckSchema>;

/**
 * A genuine strength the model can point to in the frames. Each strength
 * must be backed by visible evidence — never generic praise. The field is
 * optional on the result (the model may find none) so older saved results
 * and minor model variance still validate.
 */
export const SwingStrengthSchema = z.object({
  strength: z.string(),
  evidenceFromVideo: z.string(),
});
export type SwingStrength = z.infer<typeof SwingStrengthSchema>;

export const MechanicalPrioritySchema = z.object({
  issue: z.string(),
  whyItMatters: z.string(),
  evidenceFromVideo: z.string(),
  confidence: ConfidenceLevelSchema,
  correctiveFocus: z.string(),
});
export type MechanicalPriority = z.infer<typeof MechanicalPrioritySchema>;

export const PracticeDrillSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  repsOrDuration: z.string(),
  howToKnowCorrect: z.string(),
});
export type PracticeDrill = z.infer<typeof PracticeDrillSchema>;

export const NextUploadGuidanceSchema = z.object({
  cameraAngle: z.string(),
  framing: z.string(),
  lighting: z.string(),
  distance: z.string(),
  sportNotes: z.string(),
});
export type NextUploadGuidance = z.infer<typeof NextUploadGuidanceSchema>;

export const DetectedPhaseSchema = z.object({
  phaseName: z.string(),
  observation: z.string(),
  confidence: ConfidenceLevelSchema,
});
export type DetectedPhase = z.infer<typeof DetectedPhaseSchema>;

/**
 * The exact JSON shape the AI vision model is required to return.
 * Array bounds are intentionally a little forgiving (the prompt asks
 * for 3 priorities / 3–5 drills) so minor model variance doesn't trip
 * validation, while still guaranteeing the UI always has real content.
 */
export const AIVisualAnalysisResultSchema = z.object({
  summary: z.string().min(1),
  whatWasClearlyVisible: z.array(z.string()).min(1).max(8),
  /** Genuine, evidence-backed strengths. May be empty if none are clearly visible. */
  strengths: z.array(SwingStrengthSchema).max(5).optional().default([]),
  videoQuality: VideoQualityCheckSchema,
  detectedPhases: z.array(DetectedPhaseSchema).max(12).optional().default([]),
  topPriorities: z.array(MechanicalPrioritySchema).min(1).max(5),
  practicePlan: z.array(PracticeDrillSchema).min(1).max(6),
  nextUpload: NextUploadGuidanceSchema,
  overallConfidence: z.number().min(0).max(1),
  visibilityQuality: VisibilityQualitySchema,
});
export type AIVisualAnalysisResult = z.infer<typeof AIVisualAnalysisResultSchema>;

/** Server-attached provenance, added after the model output is validated. */
export const AnalysisMetaSchema = z.object({
  sport: VisualSportSchema,
  frameCountAnalyzed: z.number().int().nonnegative(),
  provider: z.string(),
  model: z.string(),
  schemaVersion: z.string(),
  createdAt: z.string(),
});
export type AnalysisMeta = z.infer<typeof AnalysisMetaSchema>;

/** Final object returned to the client and suitable for save/export. */
export const AIVisualAnalysisSchema = AIVisualAnalysisResultSchema.extend({
  meta: AnalysisMetaSchema,
});
export type AIVisualAnalysis = z.infer<typeof AIVisualAnalysisSchema>;

// ──────────────────────────────────────────────────────────────
// Parsing helpers
// ──────────────────────────────────────────────────────────────

/**
 * Extract the first balanced top-level JSON object from a model response.
 * Vision models occasionally wrap JSON in ```json fences or add a sentence
 * of prose; this pulls out the object without a brittle regex.
 * Returns `null` if no balanced object is found.
 */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export type ValidatedResult =
  | { ok: true; data: AIVisualAnalysisResult }
  | { ok: false; error: string };

/**
 * Parse + validate a raw model response into an AIVisualAnalysisResult.
 * Never throws — returns a tagged result so callers can show a clean
 * retry state instead of crashing or rendering malformed analysis.
 */
export function validateAIResult(rawText: string): ValidatedResult {
  const json = extractJsonObject(rawText);
  if (!json) {
    return { ok: false, error: 'No JSON object found in AI response.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    return {
      ok: false,
      error: `AI response was not valid JSON: ${err instanceof Error ? err.message : 'parse error'}`,
    };
  }

  const result = AIVisualAnalysisResultSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: `AI response did not match the expected schema: ${result.error.issues
        .slice(0, 4)
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ')}`,
    };
  }

  return { ok: true, data: result.data };
}

/** Attach server-side provenance to a validated result. */
export function attachMeta(
  result: AIVisualAnalysisResult,
  meta: Omit<AnalysisMeta, 'schemaVersion' | 'createdAt'> & {
    schemaVersion?: string;
    createdAt?: string;
  },
): AIVisualAnalysis {
  return {
    ...result,
    meta: {
      ...meta,
      schemaVersion: meta.schemaVersion ?? VISUAL_ANALYSIS_SCHEMA_VERSION,
      createdAt: meta.createdAt ?? new Date().toISOString(),
    },
  };
}
