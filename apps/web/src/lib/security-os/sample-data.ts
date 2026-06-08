// ============================================================
// securityOS — demo findings (PURE, clearly-labelled)
// ------------------------------------------------------------
// Safe, illustrative findings used ONLY to fill empty states in development
// or when the live posture scan produces nothing actionable. Every demo
// finding is flagged `isSeed` and `source: 'demo'` so the UI labels it as a
// sample — it is never mistaken for a real, measured posture finding and
// never implies a live vulnerability in production. Mirrors the
// central-intelligence/sample-data.ts convention.
// ============================================================

import type { SecurityFinding } from './types';
import { riskScoreFor } from './findings';

export function demoFindings(now: string = new Date().toISOString()): SecurityFinding[] {
  const due = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: 'demo:critical-rls',
      title: '[Sample] User-data table is missing a Row-Level Security policy',
      description:
        'Illustrative example: a user-scoped table without an RLS policy would let one user’s token read another user’s rows.',
      category: 'data_protection',
      riskDomain: 'Database',
      source: 'demo',
      severity: 'critical',
      likelihood: 'medium',
      impact: 'high',
      riskScore: riskScoreFor('critical', 'medium', 'high'),
      affectedArea: 'Database',
      evidence: ['Sample data — not a real finding from your environment.'],
      recommendedFix: 'Add a per-user RLS policy to every user-scoped table.',
      businessImpact: 'Cross-user data exposure is the most damaging breach for a user-data product.',
      technicalImpact: 'An IDOR or leaked anon key returns other users’ rows directly from the DB.',
      frameworks: { owaspTop10: 'A01: Broken Access Control', owaspAsvs: 'V4 Access Control' },
      effort: 'L',
      canClaudeFix: false,
      needsCredentials: true,
      recurrenceRisk: 'high',
      stepByStepActions: ['Enable RLS on the table.', 'Add a policy scoping rows to auth.uid().', 'Test cross-user denial.'],
      createdAt: now,
      dueDate: due(1),
      isSeed: true,
    },
    {
      id: 'demo:ai-prompt-injection',
      title: '[Sample] No prompt-injection test suite for AI coaching output',
      description:
        'Illustrative example: AI surfaces without adversarial tests can regress into leaking instructions or unsafe advice.',
      category: 'ai_security',
      riskDomain: 'AI',
      source: 'demo',
      severity: 'high',
      likelihood: 'medium',
      impact: 'high',
      riskScore: riskScoreFor('high', 'medium', 'high'),
      affectedArea: 'AI',
      evidence: ['Sample data — not a real finding from your environment.'],
      recommendedFix: 'Add a stored, runnable red-team prompt suite and wire failures into findings.',
      businessImpact: 'Manipulable AI coaching erodes user trust and could surface unsafe recommendations.',
      technicalImpact: 'A crafted input makes the assistant reveal its system prompt or bypass role limits.',
      frameworks: { owaspLlm: 'LLM01: Prompt Injection' },
      effort: 'L',
      canClaudeFix: true,
      needsCredentials: false,
      recurrenceRisk: 'high',
      stepByStepActions: ['Author safe adversarial prompts.', 'Assert safe refusals.', 'Record failures as findings.'],
      createdAt: now,
      dueDate: due(3),
      isSeed: true,
    },
    {
      id: 'demo:dep-scan',
      title: '[Sample] Dependency vulnerability scanning is not in CI',
      description:
        'Illustrative example: without an automated npm-audit/OSV pass, a known-vulnerable package can ship unnoticed.',
      category: 'secure_dev_lifecycle',
      riskDomain: 'Dependencies',
      source: 'demo',
      severity: 'medium',
      likelihood: 'high',
      impact: 'medium',
      riskScore: riskScoreFor('medium', 'high', 'medium'),
      affectedArea: 'Dependencies',
      evidence: ['Sample data — not a real finding from your environment.'],
      recommendedFix: 'Add an npm-audit (or OSV-Scanner) CI job and enable Dependabot.',
      businessImpact: 'Known CVEs in dependencies are the most automated attack path.',
      technicalImpact: 'A vulnerable transitive package ships and is exploited by a commodity scanner.',
      frameworks: { owaspTop10: 'A06: Vulnerable & Outdated Components' },
      effort: 'M',
      canClaudeFix: true,
      needsCredentials: false,
      addToCi: true,
      recurrenceRisk: 'medium',
      stepByStepActions: ['Add an npm-audit CI job.', 'Enable Dependabot.', 'Triage findings here.'],
      createdAt: now,
      dueDate: due(7),
      isSeed: true,
    },
  ];
}
