// ============================================================
// securityOS — server generation entry (SERVER-ONLY)
// ------------------------------------------------------------
// Thin wiring: gather posture → evaluate checks → compute score → derive
// findings → generate recommendations → return one serializable scan result.
// The admin pages call runSecurityScan(); "Run scan" in the UI simply
// re-renders the (force-dynamic) page, which calls this again with fresh
// signals. Owner state (finding status / settings / history) is applied
// client-side, so this stays a stateless pure-ish function over live signals.
// ============================================================

import 'server-only';

import { gatherPosture } from './posture.server';
import { evaluateChecks } from './posture-checks';
import { computeSecurityScore } from './scoring';
import { deriveFindings } from './findings';
import { generateRecommendations } from './recommendations';
import type {
  EvaluatedCheck,
  SecurityFinding,
  SecurityRecommendation,
  SecurityScore,
} from './types';

export interface SecurityScanResult {
  generatedAt: string;
  score: SecurityScore;
  checks: EvaluatedCheck[];
  /** Raw posture-derived + audit findings (owner overlay applied client-side). */
  findings: SecurityFinding[];
  /** Recommendations derived from the (pre-triage) findings. */
  recommendations: SecurityRecommendation[];
  /** True when at least one check could not be read (lowers confidence). */
  hasUnknowns: boolean;
}

/** Gather signals and produce the full scored security scan. */
export function runSecurityScan(now: Date = new Date()): SecurityScanResult {
  const { input, auditFindings } = gatherPosture(now);
  const checks = evaluateChecks(input);
  const score = computeSecurityScore(checks, { now: input.now });
  const findings = deriveFindings(checks, auditFindings, input.now);
  const recommendations = generateRecommendations(findings);

  return {
    generatedAt: input.now,
    score,
    checks,
    findings,
    recommendations,
    hasUnknowns: checks.some((c) => c.result === 'unknown'),
  };
}
