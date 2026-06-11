// ============================================================
// SwingVantage — RecordAssist: ReadinessScoreEngine
// ------------------------------------------------------------
// The proprietary Frame Readiness Score (0–100): a single honest number
// that predicts whether a clip will be usable for analysis. Pure +
// deterministic. Default weights follow the product spec; a preset may
// nudge the weights per sport/action (e.g. tennis serve cares more about
// headroom/orientation; putting cares less about implement risk).
// ============================================================

import type {
  FrameQualitySignals,
  ReadinessScore,
  ReadinessState,
  ReadinessComponent,
  ReadinessComponentKey,
  SportActionPreset,
  KineticConfidenceLevel,
} from '../types';

/** Default max points per component (sums to 100). */
export const DEFAULT_WEIGHTS: Record<ReadinessComponentKey, number> = {
  full_body: 25,
  implement: 15,
  centering: 15,
  distance: 15,
  lighting: 10,
  stability: 10,
  background: 5,
  angle: 5,
};

const COMPONENT_LABELS: Record<ReadinessComponentKey, string> = {
  full_body: 'Full body visible',
  implement: 'Implement likely visible',
  centering: 'Centered in frame',
  distance: 'Good distance',
  lighting: 'Lighting',
  stability: 'Camera steady',
  background: 'Clear background',
  angle: 'Correct angle',
};

/** Fraction (0–1) of a component's points earned given the signals. */
function fractionFor(key: ReadinessComponentKey, q: FrameQualitySignals): number {
  switch (key) {
    case 'full_body': {
      if (q.fullBodyVisible) return 1;
      // Partial credit for head OR feet visible.
      const head = q.headVisible === 'visible' ? 0.5 : q.headVisible === 'partial' ? 0.25 : 0;
      const feet = q.feetVisible === 'visible' ? 0.5 : q.feetVisible === 'partial' ? 0.25 : 0;
      return head + feet;
    }
    case 'implement':
      if (q.implementRisk === 'low') return 1;
      if (q.implementRisk === 'medium') return 0.6;
      if (q.implementRisk === 'high') return 0.1;
      return 0.5; // unknown → neutral
    case 'centering':
      if (q.centering === 'centered') return 1;
      if (q.centering === 'left' || q.centering === 'right') return 0.3;
      return 0;
    case 'distance':
      if (q.distance === 'good') return 1;
      if (q.distance === 'too_far' || q.distance === 'too_close') return 0.3;
      return 0;
    case 'lighting':
      if (q.lighting === 'good') return 1;
      if (q.lighting === 'low') return 0.2;
      return 0.6; // unknown → mostly credited (don't punish for missing pixels)
    case 'stability':
      if (q.stability === 'steady') return 1;
      if (q.stability === 'shaky') return 0.2;
      return 0.7;
    case 'background':
      if (q.background === 'clear') return 1;
      if (q.background === 'busy') return 0.3;
      return 0.7;
    case 'angle':
      return q.orientationMatch ? 1 : 0.2;
  }
}

/** Resolve the effective per-component max from defaults + preset overrides. */
export function resolveWeights(preset?: SportActionPreset): Record<ReadinessComponentKey, number> {
  if (!preset?.weightOverrides) return { ...DEFAULT_WEIGHTS };
  const merged = { ...DEFAULT_WEIGHTS, ...preset.weightOverrides };
  // Renormalize to 100 so the score stays on a stable 0–100 scale.
  const total = Object.values(merged).reduce((a, b) => a + b, 0);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  const scaled = {} as Record<ReadinessComponentKey, number>;
  (Object.keys(merged) as ReadinessComponentKey[]).forEach((k) => {
    scaled[k] = (merged[k] / total) * 100;
  });
  return scaled;
}

export function stateForScore(score: number): ReadinessState {
  if (score <= 39) return 'not_usable';
  if (score <= 69) return 'needs_adjustment';
  if (score <= 84) return 'usable';
  return 'excellent';
}

function confidenceFor(q: FrameQualitySignals): KineticConfidenceLevel {
  if (!q.personDetected) return 'insufficient';
  const unknowns = [q.lighting, q.background, q.stability].filter((v) => v === 'unknown').length;
  if (!q.boundingBox) return 'low';
  if (unknowns >= 2) return 'low';
  if (unknowns === 1) return 'medium';
  return 'high';
}

export function computeReadiness(
  q: FrameQualitySignals,
  preset?: SportActionPreset,
): ReadinessScore {
  const weights = resolveWeights(preset);

  // No person → score 0, but still surface the component breakdown so the UI
  // can explain *why* it's zero.
  const components: ReadinessComponent[] = (Object.keys(weights) as ReadinessComponentKey[]).map(
    (key) => {
      const max = weights[key];
      const earned = q.personDetected ? fractionFor(key, q) * max : 0;
      return {
        key,
        label: COMPONENT_LABELS[key],
        earned: Math.round(earned * 10) / 10,
        max: Math.round(max * 10) / 10,
      };
    },
  );

  const rawScore = components.reduce((sum, c) => sum + c.earned, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    score,
    state: stateForScore(score),
    components,
    confidence: confidenceFor(q),
  };
}
