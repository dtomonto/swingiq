// ============================================================
// SwingVantage — Deterministic Diagnosis → Next-Action adapter
// ------------------------------------------------------------
// Bridges a DeterministicDiagnosis into the app's unified next-best-action feed
// (lib/next-action/rank). Pure + side-effect-free, so Today / the dashboard hero
// can rank the deterministic read alongside the priority engine, retest prompts,
// readiness and the keystone — one confident next step, not competing panels.
// ============================================================

import type { ActionCandidate } from '@/lib/next-action/rank';
import type { FaultSeverity } from '@/lib/faults/types';
import type { DeterministicDiagnosis, DiagnosisUrgency } from './diagnose-types';

/** Map fault severity onto the ranker's 0–1 severity scale. */
const SEVERITY_SCORE: Record<FaultSeverity, number> = {
  critical: 0.9,
  notable: 0.65,
  minor: 0.45,
  watch: 0.25,
};

/** Urgency (history-aware) nudges severity up so pressing fixes lead. */
const URGENCY_BUMP: Record<DiagnosisUrgency, number> = { high: 0.1, medium: 0.03, low: 0 };

export interface DiagnosisActionOptions {
  /** Where the CTA points (default: the diagnose flow to confirm). */
  href?: string;
  /** 0–1 recency for the ranker (default 1 = just computed). */
  recency?: number;
}

/**
 * Convert a deterministic diagnosis into one ranked ActionCandidate. Severity
 * comes from the primary cause's fault severity (bumped by urgency); confidence
 * is the engine's 0–100 score normalized to 0–1; the detail explains the lead or
 * why a deeper look is recommended.
 */
export function diagnosisToActionCandidate(
  d: DeterministicDiagnosis,
  opts: DiagnosisActionOptions = {},
): ActionCandidate {
  const severity = Math.min(1, (SEVERITY_SCORE[d.severity] ?? 0.5) + (URGENCY_BUMP[d.urgency] ?? 0));
  const detail = d.escalateToAI && d.escalationReasons[0] ? d.escalationReasons[0] : d.confidenceReason;
  return {
    id: `deterministic::${d.sport}::${d.primary.faultId}`,
    source: 'priority',
    title: `Work your likely #1 fix: ${d.primary.name}`,
    detail,
    href: opts.href ?? '/diagnose',
    severity,
    confidence: Math.max(0, Math.min(1, d.confidence / 100)),
    recency: opts.recency ?? 1,
  };
}
