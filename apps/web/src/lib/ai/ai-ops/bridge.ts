// ============================================================
// SwingVantage — AI Operations: frame-vision → orchestrator bridge (§3/§6.2)
// ------------------------------------------------------------
// Adapts the EXISTING frame-based AI vision result (@swingiq/core's
// AIVisualAnalysis — produced from still frames, the privacy-preserving path)
// into the orchestrator's stage contracts:
//
//   • visionAnalysisToIntakeResult  → VideoIntakeResult  (the video_intake
//     evidence the normalizer expects), so the coach grounds on the REAL frame
//     observations instead of re-sending the video to Gemini.
//   • createBridgedIntakeProvider   → a VideoIntakeProvider that simply returns
//     that evidence, so runAnalysisPipeline can be driven with the frame vision
//     as its intake stage (no network — pure transform).
//   • visionAnalysisToCoachSynthesis → a deterministic, keyless-safe CoachSynthesis
//     derived from the vision result, used as the baseline when the AI coach
//     stage is disabled/over-budget so the structured one-fix/one-plan/one-retest
//     contract is ALWAYS present without a second paid call.
//
// PRIVACY: this is a pure in-memory transform of data the vision call already
// returned. It sends nothing — no video, no frames — to any provider.
// HONESTY: confidence + support carry through from the vision result; nothing
// is invented. Vision observations are directly_observed (the model saw them).
// ============================================================

import type { AIVisualAnalysis, ConfidenceLevel, VisibilityQuality } from '@swingiq/core';
import {
  VideoIntakeResultSchema,
  CoachSynthesisSchema,
  type AiProviderName,
  type CoachSynthesis,
  type Observation,
  type ProviderTrace,
  type VideoIntakeResult,
} from './schemas';
import type { VideoIntakeProvider } from './types';

/** Human confidence band → a calibrated numeric confidence. */
function confToNum(level: ConfidenceLevel): number {
  switch (level) {
    case 'high':
      return 0.85;
    case 'moderate':
      return 0.6;
    case 'low':
    default:
      return 0.35;
  }
}

/** Frame visibility quality → the intake bodyVisibility band (honest downgrade). */
function visibilityToBody(q: VisibilityQuality): VideoIntakeResult['bodyVisibility'] {
  switch (q) {
    case 'excellent':
    case 'good':
      return 'full';
    case 'limited':
      return 'partial';
    case 'poor':
    default:
      return 'poor';
  }
}

/** Map the core vision provider label onto the orchestrator's provider enum. */
function providerName(metaProvider: string): AiProviderName {
  const p = metaProvider.toLowerCase();
  if (p.includes('google') || p.includes('gemini')) return 'gemini';
  if (p.includes('openai') || p.includes('gpt')) return 'openai';
  if (p.includes('anthropic') || p.includes('claude')) return 'anthropic';
  return 'none';
}

/**
 * Bridge a frame-based AIVisualAnalysis into the orchestrator's VideoIntakeResult
 * evidence. Observations come from the model's evidence-backed findings
 * (priorities + strengths + clearly-visible elements); confidence + limitations
 * carry through untouched.
 */
export function visionAnalysisToIntakeResult(analysis: AIVisualAnalysis, videoId: string): VideoIntakeResult {
  const observations: Observation[] = [];

  // Mechanical priorities — the substantive, evidence-backed findings.
  for (const p of analysis.topPriorities) {
    observations.push({
      claim: p.issue,
      evidence: p.evidenceFromVideo,
      confidence: confToNum(p.confidence),
      claimType: 'directly_observed',
      sportRelevance: p.whyItMatters,
      limitations: null,
    });
  }
  // Genuine, evidence-backed strengths.
  for (const s of analysis.strengths ?? []) {
    observations.push({
      claim: `Strength: ${s.strength}`,
      evidence: s.evidenceFromVideo,
      confidence: analysis.overallConfidence,
      claimType: 'directly_observed',
      sportRelevance: 'A working element to preserve while changing the fault.',
      limitations: null,
    });
  }
  // A few clearly-visible elements as supporting context (capped to avoid noise).
  for (const v of analysis.whatWasClearlyVisible.slice(0, 4)) {
    observations.push({
      claim: v,
      evidence: 'Clearly visible across the sampled frames.',
      confidence: Math.min(0.8, analysis.overallConfidence + 0.1),
      claimType: 'directly_observed',
      sportRelevance: 'Visible swing element supporting the analysis.',
      limitations: null,
    });
  }

  const uncertainties: string[] = [];
  const vq = analysis.videoQuality;
  if (!vq.contactVisible) uncertainties.push('Contact/impact was not clearly visible in the frames.');
  if (!vq.fullMotionCaptured) uncertainties.push('The full motion was not captured — some phases may be missing.');

  const result: VideoIntakeResult = {
    schemaVersion: analysis.meta.schemaVersion,
    provider: providerName(analysis.meta.provider),
    model: analysis.meta.model,
    videoId,
    sportDetected: analysis.meta.sport,
    cameraAngle: vq.cameraAngle.note || null,
    inputQuality: analysis.visibilityQuality,
    bodyVisibility: visibilityToBody(vq.bodyVisibility.quality),
    movementType: null,
    phases: analysis.detectedPhases.map((p) => ({ name: p.phaseName, start: null, end: null })),
    timestamps: [],
    observations,
    risks: [],
    uncertainties,
    confidence: analysis.overallConfidence,
  };

  const parsed = VideoIntakeResultSchema.safeParse(result);
  return parsed.success ? parsed.data : result;
}

/**
 * A VideoIntakeProvider that yields the bridged frame-vision evidence — lets
 * runAnalysisPipeline use the existing (privacy-preserving) frame analysis as
 * its intake stage. Pure: performs no IO.
 */
export function createBridgedIntakeProvider(
  analysis: AIVisualAnalysis,
  opts: { now?: () => string } = {},
): VideoIntakeProvider {
  const now = opts.now ?? (() => new Date().toISOString());
  return {
    name: 'bridged-vision',
    async intake(input) {
      const at = now();
      const result = visionAnalysisToIntakeResult(analysis, input.videoId);
      const trace: ProviderTrace = {
        stage: 'video_intake',
        provider: providerName(analysis.meta.provider),
        model: analysis.meta.model,
        promptVersion: null,
        startedAt: at,
        completedAt: at,
        latencyMs: 0, // the vision call already happened; this is a transform
        inputTokens: null,
        outputTokens: null,
        estimatedCost: null,
        status: 'ok',
        errorCode: null,
        errorMessage: null,
        retryCount: 0,
        fallbackUsed: false,
        sanitizedRequest: null,
        sanitizedResponse: null,
      };
      return { result, trace };
    },
  };
}

/** Compact text for a practice drill line. */
function drillLine(d: AIVisualAnalysis['practicePlan'][number]): string {
  return `${d.name} — ${d.purpose} (${d.repsOrDuration}). Correct when: ${d.howToKnowCorrect}`;
}

/**
 * Deterministic, keyless-safe CoachSynthesis derived from the vision result.
 * Used as the baseline when the AI coach stage is disabled or over-budget, so
 * the structured one-fix / one-plan / one-retest contract is always present
 * without a second paid call. Nothing is invented — every field maps from the
 * model's own evidence-backed output.
 */
export function visionAnalysisToCoachSynthesis(analysis: AIVisualAnalysis): CoachSynthesis {
  const primary = analysis.topPriorities[0];
  const n = analysis.nextUpload;

  const limitations: string[] = [];
  if (analysis.visibilityQuality === 'limited' || analysis.visibilityQuality === 'poor') {
    limitations.push(`Frame visibility was ${analysis.visibilityQuality} — findings are constrained.`);
  }
  if (!analysis.videoQuality.contactVisible) limitations.push('Impact/contact was not clearly visible.');
  limitations.push('Visual estimate from sampled frames — not a biomechanical measurement.');

  const coach: CoachSynthesis = {
    summary: analysis.summary,
    quickRead: primary ? `${primary.issue} — ${primary.correctiveFocus}` : analysis.summary,
    whatISee: analysis.whatWasClearlyVisible.join(' '),
    primaryFault: primary?.issue ?? 'No single dominant fault stood out.',
    oneFix: primary?.correctiveFocus ?? 'Keep reinforcing your current motion and re-record for a clearer read.',
    whyItMatters: primary?.whyItMatters ?? 'Consistent mechanics make ball flight more repeatable.',
    practicePlan: analysis.practicePlan.map(drillLine).join('\n'),
    retestProtocol: `Re-record from ${n.cameraAngle} (${n.framing}, ${n.distance}); ${n.sportNotes} Then compare against this analysis.`,
    coachNotes: analysis.videoQuality.nextCaptureRecommendation || null,
    confidence: analysis.overallConfidence,
    evidenceUsed: analysis.topPriorities.map((p) => p.evidenceFromVideo),
    safetyDisclaimer: 'This is an AI visual estimate from video frames, not medical or biomechanical measurement advice.',
    limitations,
  };

  const parsed = CoachSynthesisSchema.safeParse(coach);
  return parsed.success ? parsed.data : coach;
}
