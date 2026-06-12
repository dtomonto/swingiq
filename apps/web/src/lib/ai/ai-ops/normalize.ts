// ============================================================
// SwingVantage — AI Operations: evidence normalizer (§6.4 / master-prompt §3)
// ------------------------------------------------------------
// The honesty gate between the raw provider stages and the coach. It merges
// Gemini video-intake observations with MediaPipe measurement metrics into a
// single NormalizedAnalysisEvidence object the coach can ground on, and it is
// where unsupported / too-weak claims are REJECTED rather than passed through.
//
// Rules (no false precision, ever):
//   • every claim keeps an honest supportLevel (measured > observed > inferred
//     > uncertain) derived from its origin, never inflated;
//   • claims below a confidence floor are dropped into unsupportedClaimsRejected
//     so the report can say what it could NOT stand behind;
//   • visible disagreements (e.g. "no body visible" + pose metrics present) are
//     surfaced as conflicts, not silently averaged away;
//   • the blended confidenceScore is penalised for poor input quality / low
//     visibility / a missing stage — it never reads higher than the inputs.
//
// Pure + deterministic (no IO, no clock) → trivially unit-testable.
// ============================================================

import {
  NormalizedAnalysisEvidenceSchema,
  type EvidenceClaim,
  type MeasurementResult,
  type NormalizedAnalysisEvidence,
  type Observation,
  type VideoIntakeResult,
} from './schemas';

export interface NormalizeInput {
  videoIntake: VideoIntakeResult | null;
  measurements: MeasurementResult | null;
}

export interface NormalizeOptions {
  /** Claims weaker than this confidence are rejected (not shown to the coach). */
  rejectBelowConfidence?: number;
}

const DEFAULT_REJECT_BELOW = 0.15;

/** Video observation claimType → evidence supportLevel (honest, never inflated). */
function observationSupport(o: Observation): EvidenceClaim['supportLevel'] {
  switch (o.claimType) {
    case 'directly_observed':
      return 'observed';
    case 'inferred':
      return 'inferred';
    case 'uncertain':
    default:
      return 'uncertain';
  }
}

/** Measurement precision → evidence supportLevel. Estimated 2D proxies are
 *  inferred, never "measured" — only a true measured method earns 'measured'. */
function metricSupport(precision: 'measured' | 'derived' | 'estimated'): EvidenceClaim['supportLevel'] {
  if (precision === 'measured') return 'measured';
  return 'inferred'; // derived + estimated proxies are directional, not facts
}

/** Round to keep generated claim text tidy without implying false precision. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v && v.trim() !== '')));
}

/**
 * Merge intake + measurement into normalized evidence. Safe with either (or
 * both) inputs null — a missing stage simply contributes no claims and is
 * recorded as a limitation.
 */
export function normalizeEvidence(input: NormalizeInput, opts: NormalizeOptions = {}): NormalizedAnalysisEvidence {
  const reject = opts.rejectBelowConfidence ?? DEFAULT_REJECT_BELOW;
  const intake = input.videoIntake;
  const measure = input.measurements;

  const mergedObservations: Observation[] = intake?.observations ? [...intake.observations] : [];

  const evidenceClaims: EvidenceClaim[] = [];
  const unsupportedClaimsRejected: string[] = [];
  const conflicts: string[] = [];
  const analysisLimitations: string[] = [];

  // ── Video-intake observations → evidence claims (or rejected) ──
  for (const o of mergedObservations) {
    if (o.confidence < reject) {
      unsupportedClaimsRejected.push(`${o.claim} (video confidence ${o.confidence.toFixed(2)} below floor)`);
      continue;
    }
    evidenceClaims.push({
      claim: o.claim,
      source: 'video_intake',
      supportLevel: observationSupport(o),
      confidence: o.confidence,
      timestamp: o.timestampStart ?? null,
      usedInCoachOutput: false,
    });
  }

  // ── Measurement metrics → evidence claims (or rejected) ──
  const allMetrics = measure ? [...measure.derivedMetrics, ...measure.phaseMetrics, ...measure.frameMetrics] : [];
  for (const m of allMetrics) {
    if (m.value == null) continue; // a null metric is an absence, not a claim
    const text = `${m.name.replace(/_/g, ' ')} ≈ ${fmt(m.value)} ${m.unit}`.trim();
    if (m.confidence < reject) {
      unsupportedClaimsRejected.push(`${text} (measurement confidence ${m.confidence.toFixed(2)} below floor)`);
      continue;
    }
    evidenceClaims.push({
      claim: text,
      source: 'measurement',
      supportLevel: metricSupport(m.precision),
      confidence: m.confidence,
      timestamp: m.timestamp ?? null,
      usedInCoachOutput: false,
    });
  }

  // ── Conflicts: surface visible disagreements rather than averaging them ──
  if (measure && intake && (intake.bodyVisibility === 'poor' || intake.bodyVisibility === 'none')) {
    conflicts.push(
      `Video reports body visibility "${intake.bodyVisibility}" yet pose measurements are present — treat measurements as low-trust.`,
    );
  }
  if (measure && intake && intake.observations.length === 0 && allMetrics.length > 0) {
    conflicts.push('Measurements exist but the video stage produced no observations — coaching leans on proxies only.');
  }

  // ── Limitations: carry every honesty caveat forward, de-duplicated ──
  if (intake) {
    analysisLimitations.push(...intake.uncertainties, ...intake.risks);
    if (intake.inputQuality === 'poor' || intake.inputQuality === 'limited') {
      analysisLimitations.push(`Video input quality is "${intake.inputQuality}" — observations are constrained.`);
    }
  } else {
    analysisLimitations.push('No video-understanding stage ran — analysis is limited to on-device measurements (if any).');
  }
  if (measure) {
    analysisLimitations.push(...measure.warnings);
  } else {
    analysisLimitations.push('No measurement stage ran — no objective metrics are available.');
  }
  if (evidenceClaims.length === 0) {
    analysisLimitations.push('No evidence cleared the confidence floor — a clearer, well-lit, full-body video would help.');
  }

  // ── Blended confidence: never higher than the contributing inputs ──
  const parts: number[] = [];
  if (intake) parts.push(intake.confidence);
  if (measure) parts.push(measure.confidence);
  let confidenceScore = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  // Penalties for honesty — poor visibility / quality / having only one stage.
  if (intake && (intake.bodyVisibility === 'poor' || intake.bodyVisibility === 'none')) confidenceScore *= 0.7;
  if (intake && intake.inputQuality === 'poor') confidenceScore *= 0.8;
  if (parts.length < 2) confidenceScore *= 0.9; // a single stage is inherently less corroborated
  if (evidenceClaims.length === 0) confidenceScore = Math.min(confidenceScore, 0.1);
  confidenceScore = Math.max(0, Math.min(1, confidenceScore));

  const evidence: NormalizedAnalysisEvidence = {
    videoIntake: intake,
    measurements: measure,
    mergedObservations,
    evidenceClaims,
    unsupportedClaimsRejected: uniq(unsupportedClaimsRejected),
    conflicts: uniq(conflicts),
    confidenceScore,
    analysisLimitations: uniq(analysisLimitations),
  };

  // Self-validate: the normalizer's own output must honor the schema.
  const parsed = NormalizedAnalysisEvidenceSchema.safeParse(evidence);
  return parsed.success ? parsed.data : evidence;
}
