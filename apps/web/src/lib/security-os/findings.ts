// ============================================================
// securityOS — findings deriver (PURE)
// ------------------------------------------------------------
// Turns evaluated posture checks (and joined-in audit-robot findings) into
// SecurityFindings: a stable, severity-scored, framework-mapped list the
// findings UI renders and the owner triages. PURE — deterministic ids so
// owner state (status/notes/risk-acceptance) survives re-scans.
//
//   • A `fail` check → a finding at the check's declared severity.
//   • A `partial` check → a finding one severity notch lower (a weakness).
//   • `pass` / `unknown` → no finding (unknowns lower confidence instead).
// ============================================================

import type {
  EvaluatedCheck,
  Level,
  SecurityFinding,
  Severity,
  ScoreCategoryId,
  FindingView,
  FindingOverrideMap,
} from './types';
import { SEVERITY_RANK, OPEN_FINDING_STATUSES, DEFAULT_SETTINGS } from './types';
import { downgrade } from './scoring';

/** An audit-robot finding (subset of /admin/audits), joined in as a source. */
export interface AuditRobotFinding {
  id: string;
  category: string;
  finding: string;
  recommendation: string;
  /** P0 | P1 | P2 | P3. */
  priority: string;
  status: string;
}

const LEVEL_FOR_SEVERITY: Record<Severity, Level> = {
  critical: 'high',
  high: 'high',
  medium: 'medium',
  low: 'low',
  informational: 'low',
};

const RISK_BASE: Record<Severity, number> = {
  critical: 92,
  high: 76,
  medium: 55,
  low: 32,
  informational: 12,
};

const LEVEL_FACTOR: Record<Level, number> = { high: 1, medium: 0.85, low: 0.7 };

/** 0–100 composite risk score from severity × likelihood × impact. */
export function riskScoreFor(severity: Severity, likelihood: Level, impact: Level): number {
  const base = RISK_BASE[severity];
  const factor = (LEVEL_FACTOR[likelihood] + LEVEL_FACTOR[impact]) / 2;
  return Math.round(base * factor);
}

function dueDateFor(now: string, severity: Severity): string {
  const days = DEFAULT_SETTINGS.dueDays[severity];
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Build a SecurityFinding from a failed/partial posture check. */
export function findingFromCheck(check: EvaluatedCheck, now: string): SecurityFinding | null {
  if (check.result === 'pass' || check.result === 'unknown') return null;
  const severity = check.result === 'partial' ? downgrade(check.severity) : check.severity;
  const likelihood = check.result === 'fail' ? LEVEL_FOR_SEVERITY[severity] : 'medium';
  const impact = LEVEL_FOR_SEVERITY[check.severity];
  return {
    id: `chk:${check.id}`,
    title: check.title,
    description: check.description,
    category: check.category,
    riskDomain: check.riskDomain,
    source: 'posture-scan',
    severity,
    likelihood,
    impact,
    riskScore: riskScoreFor(severity, likelihood, impact),
    affectedArea: check.riskDomain,
    evidence: check.evidence,
    recommendedFix: check.recommendedFix,
    businessImpact: check.businessImpact,
    technicalImpact: check.whatCouldHappen,
    frameworks: check.frameworks,
    effort: check.effort,
    canClaudeFix: check.canClaudeFix,
    needsCredentials: check.needsCredentials,
    addToCi: check.addToCi,
    recurrenceRisk: check.result === 'partial' ? 'medium' : 'high',
    stepByStepActions: check.stepByStepActions,
    createdAt: now,
    dueDate: dueDateFor(now, severity),
  };
}

const AUDIT_SEVERITY: Record<string, Severity> = {
  P0: 'critical',
  P1: 'high',
  P2: 'medium',
  P3: 'low',
};

const AUDIT_CATEGORY: Array<[RegExp, ScoreCategoryId]> = [
  [/auth|rbac|access|login|session|admin/i, 'identity_access'],
  [/rls|database|data|privacy|pii|retention/i, 'data_protection'],
  [/ai|llm|prompt|model/i, 'ai_security'],
  [/header|csp|cors|xss|inject|rate|api/i, 'application_security'],
  [/deploy|infra|env|secret|build/i, 'infrastructure'],
  [/log|monitor|incident|alert/i, 'monitoring_ir'],
  [/test|coverage|dependency|scan|ci/i, 'secure_dev_lifecycle'],
];

function categorize(text: string): ScoreCategoryId {
  return AUDIT_CATEGORY.find(([re]) => re.test(text))?.[1] ?? 'application_security';
}

/** Map an open security-relevant audit-robot finding into a SecurityFinding. */
export function findingFromAudit(a: AuditRobotFinding, now: string): SecurityFinding {
  const severity = AUDIT_SEVERITY[a.priority] ?? 'medium';
  const category = categorize(`${a.category} ${a.finding}`);
  const likelihood = LEVEL_FOR_SEVERITY[severity];
  return {
    id: `audit:${a.id}`,
    title: a.finding.length > 120 ? a.finding.slice(0, 117) + '…' : a.finding,
    description: a.finding,
    category,
    riskDomain: 'API',
    source: 'audit-robot',
    severity,
    likelihood,
    impact: likelihood,
    riskScore: riskScoreFor(severity, likelihood, likelihood),
    affectedArea: a.category,
    evidence: [`Audit finding ${a.id}`, `Priority ${a.priority}`, `Category: ${a.category}`, `Status: ${a.status}`],
    recommendedFix: a.recommendation || 'Resolve the finding and mark it done in Audit Reports.',
    businessImpact: 'Flagged by an internal audit robot as a security-relevant issue.',
    technicalImpact: a.recommendation || 'See the audit report for full context.',
    frameworks: {},
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    recurrenceRisk: 'medium',
    stepByStepActions: [
      'Open the finding in Audit Reports for full context.',
      a.recommendation || 'Apply the recommended fix.',
      'Verify the fix, then mark the finding done in /admin/audits.',
    ],
    createdAt: now,
    dueDate: dueDateFor(now, severity),
  };
}

export interface DeriveOptions {
  /** Only include audit-robot findings flagged as security-relevant. */
  securityAuditOnly?: boolean;
}

const SECURITY_AUDIT_RE = /secur|privacy|auth|rls|csp|cors|xss|inject|secret|rate|gdpr|consent|pii/i;

/** Derive the full finding list from evaluated checks + audit-robot findings. */
export function deriveFindings(
  checks: EvaluatedCheck[],
  auditFindings: AuditRobotFinding[],
  now: string,
  opts: DeriveOptions = {},
): SecurityFinding[] {
  const fromChecks = checks
    .map((c) => findingFromCheck(c, now))
    .filter((f): f is SecurityFinding => f !== null);

  const securityOnly = opts.securityAuditOnly ?? true;
  const fromAudits = auditFindings
    .filter((a) => !securityOnly || SECURITY_AUDIT_RE.test(`${a.category} ${a.finding}`))
    .map((a) => findingFromAudit(a, now));

  return [...fromChecks, ...fromAudits].sort(sortFindings);
}

/** Severity-first, then risk-score, then id (stable). */
export function sortFindings(a: SecurityFinding, b: SecurityFinding): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    b.riskScore - a.riskScore ||
    a.id.localeCompare(b.id)
  );
}

/** Apply the owner overlay (status/notes/risk-acceptance) to findings. */
export function applyFindingOverrides(
  findings: SecurityFinding[],
  overrides: FindingOverrideMap,
  now: string = new Date().toISOString(),
): FindingView[] {
  const today = now.slice(0, 10);
  return findings.map((f) => {
    const o = overrides[f.id];
    const status = o?.status ?? 'new';
    const open = OPEN_FINDING_STATUSES.includes(status);
    return {
      ...f,
      status,
      note: o?.note,
      acceptedRiskJustification: o?.acceptedRiskJustification,
      resolvedAt: o?.resolvedAt,
      overdue: open && f.dueDate < today,
    };
  });
}

export interface FindingCounts {
  total: number;
  open: number;
  overdue: number;
  resolved: number;
  acceptedRisk: number;
  bySeverity: Record<Severity, number>;
}

/** Roll up open/overdue/resolved counts for the dashboard. */
export function summarizeFindings(views: FindingView[]): FindingCounts {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };
  let open = 0;
  let overdue = 0;
  let resolved = 0;
  let acceptedRisk = 0;
  for (const v of views) {
    const isOpen = OPEN_FINDING_STATUSES.includes(v.status);
    if (isOpen) {
      open += 1;
      bySeverity[v.severity] += 1;
      if (v.overdue) overdue += 1;
    }
    if (v.status === 'resolved') resolved += 1;
    if (v.status === 'accepted_risk') acceptedRisk += 1;
  }
  return { total: views.length, open, overdue, resolved, acceptedRisk, bySeverity };
}
